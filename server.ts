import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import multer from 'multer';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import {
  blogPosts,
  contactMessages,
  navigationItems,
  pages,
  partners,
  partnerTranslations,
  productCategories,
  products,
  productTranslations,
  projects,
  projectTranslations,
  quoteRequests,
  seoMetadata,
  services,
  serviceTranslations,
  socialLinks,
  users,
  websiteSettings,
} from './src/db/schema.ts';
import {
  createContactMessage,
  createMediaAsset,
  createQuoteRequest,
  getAdminOverviewData,
  getMediaAssetById,
  getPublicBootstrap,
  getSitemapEntities,
  Locale,
  logActivity,
  upsertPageTranslation,
} from './src/db/queries.ts';
import { AuthRequest, requireAuth, requirePermission } from './src/middleware/auth.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set('trust proxy', 1);

// Basic security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

// Simple sliding-window rate limiter for public form submissions
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);
    if (!record || record.resetAt < now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a minute before submitting again.',
      });
    }
    record.count += 1;
    return next();
  };
}

// Secure multipart upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Allowed: PDF, DOCX, PNG, JPG, WEBP, SVG.'));
    }
  },
});

// Technical SEO: robots.txt & dynamic XML sitemap
app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const { pageRows, productRows, partnerRows, projectRows, blogRows } = await getSitemapEntities();

    const staticPaths = [
      '/',
      '/about',
      '/products',
      '/services',
      '/partners',
      '/projects',
      '/news',
      '/contact',
      '/quote',
      '/divisions/industrial-engineering',
      '/divisions/pumps',
      '/divisions/contracting',
      '/divisions/real-estate',
      '/divisions/healthcare',
      '/divisions/solar-energy',
    ];

    const dynamicPaths = [
      ...pageRows.map((p) => (p.slug === 'home' ? '/' : `/${p.slug}`)),
      ...productRows.map((p) => `/products/${p.slug}`),
      ...partnerRows.map((p) => `/partners/${p.slug}`),
      ...projectRows.map((p) => `/projects/${p.slug}`),
      ...blogRows.map((b) => `/news/${b.slug}`),
    ];

    const uniquePaths = Array.from(new Set([...staticPaths, ...dynamicPaths]));
    const today = new Date().toISOString().split('T')[0];

    const urlsXml = uniquePaths
      .map((routePath) => {
        const enUrl = `${baseUrl}${routePath === '/' ? '' : routePath}?lang=en`;
        const arUrl = `${baseUrl}${routePath === '/' ? '' : routePath}?lang=ar`;
        return `  <url>
    <loc>${baseUrl}${routePath}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="ar" href="${arUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${routePath}" />
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`;
      })
      .join('\n');

    res
      .type('application/xml')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlsXml}\n</urlset>`
      );
  } catch (error) {
    console.error('Failed to render sitemap:', error);
    res.status(500).type('text/plain').send('Error generating sitemap');
  }
});

// Serve stored media assets safely
app.get('/api/media/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid media ID' });
  }
  try {
    const asset = await getMediaAssetById(id);
    if (!asset || !asset.dataBase64) {
      return res.status(404).json({ error: 'Media asset not found' });
    }
    const buffer = Buffer.from(asset.dataBase64, 'base64');
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (asset.mimeType === 'image/svg+xml') {
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
    }
    return res.send(buffer);
  } catch (error) {
    console.error('Error serving media asset:', error);
    return res.status(500).json({ error: 'Unable to load media asset' });
  }
});

// Public Bootstrap API
app.get('/api/public/bootstrap', async (req, res) => {
  const langParam = req.query.lang === 'ar' ? 'ar' : 'en';
  try {
    const data = await getPublicBootstrap(langParam as Locale);
    res.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load site data';
    res.status(500).json({ error: message });
  }
});

// Public Contact Form API
const contactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().default(''),
  company: z.string().trim().max(120).optional().default(''),
  subject: z.string().trim().min(2).max(180),
  message: z.string().trim().min(10).max(4000),
  locale: z.enum(['en', 'ar']).optional().default('en'),
  websiteTrap: z.string().max(0).optional().default(''), // Honeypot spam protection
});

app.post('/api/public/contact', rateLimit(10, 60_000), async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Please check your input fields and provide a valid email and message.',
      issues: parsed.error.flatten(),
    });
  }
  try {
    const created = await createContactMessage(parsed.data);
    res.status(201).json({ success: true, id: created.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit inquiry';
    res.status(500).json({ error: message });
  }
});

// Public Request a Quote API (supports multipart file upload)
const quoteSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(150),
  businessEmail: z.string().trim().email().max(160),
  phone: z.string().trim().min(6).max(40),
  productOrService: z.string().trim().min(2).max(200),
  productId: z.string().optional(),
  estimatedQuantity: z.string().trim().max(80).optional().default(''),
  projectDescription: z.string().trim().min(10).max(5000),
  preferredContactMethod: z.enum(['email', 'phone', 'whatsapp']).optional().default('email'),
  locale: z.enum(['en', 'ar']).optional().default('en'),
  websiteTrap: z.string().max(0).optional().default(''),
});

app.post(
  '/api/public/quotes',
  rateLimit(8, 60_000),
  upload.single('attachment'),
  async (req, res) => {
    const parsed = quoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Please complete all required quotation fields with a valid business email and phone number.',
        issues: parsed.error.flatten(),
      });
    }

    try {
      let attachmentAssetId: number | null = null;
      let attachmentName = '';

      if (req.file) {
        const asset = await createMediaAsset({
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          dataBase64: req.file.buffer.toString('base64'),
          folder: 'rfq-attachments',
        });
        attachmentAssetId = asset.id;
        attachmentName = req.file.originalname;
      }

      const numericProductId =
        parsed.data.productId && Number.isFinite(Number(parsed.data.productId))
          ? Number(parsed.data.productId)
          : null;

      const created = await createQuoteRequest({
        fullName: parsed.data.fullName,
        companyName: parsed.data.companyName,
        businessEmail: parsed.data.businessEmail,
        phone: parsed.data.phone,
        productOrService: parsed.data.productOrService,
        productId: numericProductId,
        estimatedQuantity: parsed.data.estimatedQuantity,
        projectDescription: parsed.data.projectDescription,
        preferredContactMethod: parsed.data.preferredContactMethod,
        attachmentAssetId,
        attachmentName,
        locale: parsed.data.locale,
      });

      // Configurable optional webhook email notification
      if (process.env.RFQ_NOTIFICATION_WEBHOOK_URL) {
        fetch(process.env.RFQ_NOTIFICATION_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NEW_QUOTE_REQUEST',
            to: process.env.RFQ_NOTIFICATION_EMAIL || 'info@park.com.sa',
            quoteId: created.id,
            companyName: created.companyName,
            businessEmail: created.businessEmail,
            productOrService: created.productOrService,
          }),
        }).catch((err) => console.error('RFQ notification webhook error:', err));
      }

      res.status(201).json({ success: true, id: created.id });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit quotation request';
      res.status(500).json({ error: message });
    }
  }
);

// Protected Admin Auth Identity
app.get('/api/admin/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.dbUser });
});

// Protected Admin Overview (all CMS collections)
app.get(
  '/api/admin/overview',
  requireAuth,
  requirePermission(['content:write', 'catalog:write', 'leads:read']),
  async (_req: AuthRequest, res) => {
    try {
      const overview = await getAdminOverviewData();
      res.json(overview);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load admin overview';
      res.status(500).json({ error: message });
    }
  }
);

// Admin: Update Website Settings
app.put(
  '/api/admin/settings',
  requireAuth,
  requirePermission(['*']),
  async (req: AuthRequest, res) => {
    const schema = z.object({
      companyNameEn: z.string().min(2),
      companyNameAr: z.string().min(2),
      taglineEn: z.string().min(2),
      taglineAr: z.string().min(2),
      addressEn: z.string().min(2),
      addressAr: z.string().min(2),
      phone: z.string().min(4),
      whatsapp: z.string().min(4),
      email: z.string().email(),
      primaryColor: z.string().min(4).max(20),
      accentColor: z.string().min(4).max(20),
      mapEmbedUrl: z.string().optional().default(''),
      copyrightEn: z.string().min(2),
      copyrightAr: z.string().min(2),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid settings payload' });

    try {
      const [updated] = await db
        .update(websiteSettings)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(websiteSettings.siteKey, 'default'))
        .returning();

      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'website_settings',
        entityId: String(updated?.id || 'default'),
        details: 'Updated bilingual corporate settings',
        ipAddress: req.ip,
      });

      res.json(updated);
    } catch (error) {
      console.error('Update settings failed:', error);
      res.status(500).json({ error: 'Failed to update website settings' });
    }
  }
);

// Admin: Update Page Translation
app.put(
  '/api/admin/pages/:id/translations/:locale',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const pageId = Number(req.params.id);
    const locale = req.params.locale === 'ar' ? 'ar' : 'en';
    const schema = z.object({
      title: z.string().min(1),
      heroHeading: z.string().default(''),
      heroSubheading: z.string().default(''),
      heroCtaText: z.string().default(''),
      heroCtaUrl: z.string().default('/quote'),
      introBannerText: z.string().default(''),
      introBannerCtaText: z.string().default(''),
      bodyContent: z.string().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(pageId)) {
      return res.status(400).json({ error: 'Invalid page translation payload' });
    }

    try {
      const result = await upsertPageTranslation(pageId, locale, parsed.data);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'page_translations',
        entityId: `${pageId}:${locale}`,
        details: `Updated ${locale.toUpperCase()} content for page #${pageId}`,
        ipAddress: req.ip,
      });
      res.json(result);
    } catch (error) {
      console.error('Update page translation failed:', error);
      res.status(500).json({ error: 'Failed to update page translation' });
    }
  }
);

// Admin: Categories CRUD
app.post(
  '/api/admin/categories',
  requireAuth,
  requirePermission(['catalog:write']),
  async (req: AuthRequest, res) => {
    const schema = z.object({
      slug: z.string().min(2),
      nameEn: z.string().min(2),
      nameAr: z.string().min(2),
      descriptionEn: z.string().default(''),
      descriptionAr: z.string().default(''),
      imageUrl: z.string().default('/images/product-pump.jpg'),
      sortOrder: z.number().int().default(0),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid category payload' });

    try {
      const [created] = await db.insert(productCategories).values(parsed.data).returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'product_categories',
        entityId: String(created.id),
        details: `Created category ${created.nameEn}`,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Failed to create category (ensure slug is unique)' });
    }
  }
);

// Admin: Products CRUD
const productPayloadSchema = z.object({
  sku: z.string().min(2),
  slug: z.string().min(2),
  categoryId: z.number().int().nullable().optional(),
  partnerId: z.number().int().nullable().optional(),
  imageUrl: z.string().default('/images/product-pump.jpg'),
  datasheetUrl: z.string().default(''),
  division: z.string().default('pumps'),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  en: z.object({
    name: z.string().min(2),
    summary: z.string().min(2),
    description: z.string().default(''),
    specificationsJson: z
      .array(z.object({ label: z.string(), value: z.string(), unit: z.string().optional() }))
      .default([]),
    applicationsJson: z.array(z.string()).default([]),
  }),
  ar: z.object({
    name: z.string().min(2),
    summary: z.string().min(2),
    description: z.string().default(''),
    specificationsJson: z
      .array(z.object({ label: z.string(), value: z.string(), unit: z.string().optional() }))
      .default([]),
    applicationsJson: z.array(z.string()).default([]),
  }),
});

app.post(
  '/api/admin/products',
  requireAuth,
  requirePermission(['catalog:write']),
  async (req: AuthRequest, res) => {
    const parsed = productPayloadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid product payload' });

    try {
      const { en, ar, ...core } = parsed.data;
      const [created] = await db.insert(products).values(core).returning();
      await db.insert(productTranslations).values([
        { productId: created.id, locale: 'en', ...en },
        { productId: created.id, locale: 'ar', ...ar },
      ]);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'products',
        entityId: String(created.id),
        details: `Created product ${core.sku}`,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product (verify SKU and slug are unique)' });
    }
  }
);

app.put(
  '/api/admin/products/:id',
  requireAuth,
  requirePermission(['catalog:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const parsed = productPayloadSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid product update payload' });
    }

    try {
      const { en, ar, ...core } = parsed.data;
      const [updated] = await db
        .update(products)
        .set({ ...core, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();

      await db.delete(productTranslations).where(eq(productTranslations.productId, id));
      await db.insert(productTranslations).values([
        { productId: id, locale: 'en', ...en },
        { productId: id, locale: 'ar', ...ar },
      ]);

      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'products',
        entityId: String(id),
        details: `Updated product ${core.sku}`,
      });
      res.json(updated);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

app.delete(
  '/api/admin/products/:id',
  requireAuth,
  requirePermission(['catalog:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(products).where(eq(products.id, id));
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DELETE',
        entityType: 'products',
        entityId: String(id),
        details: `Deleted product #${id}`,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }
);

// Admin: Partners CRUD
const partnerSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  logoUrl: z.string().default(''),
  websiteUrl: z.string().default(''),
  country: z.string().default(''),
  categoryLabelEn: z.string().default(''),
  categoryLabelAr: z.string().default(''),
  sortOrder: z.number().int().default(0),
  isFeatured: z.boolean().default(true),
  isPublished: z.boolean().default(true),
  en: z.object({
    displayName: z.string().min(2),
    tagline: z.string().default(''),
    description: z.string().min(2),
    highlightsJson: z.array(z.string()).default([]),
  }),
  ar: z.object({
    displayName: z.string().min(2),
    tagline: z.string().default(''),
    description: z.string().min(2),
    highlightsJson: z.array(z.string()).default([]),
  }),
});

app.post(
  '/api/admin/partners',
  requireAuth,
  requirePermission(['content:write', 'catalog:write']),
  async (req: AuthRequest, res) => {
    const parsed = partnerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid partner payload' });
    try {
      const { en, ar, ...core } = parsed.data;
      const [created] = await db.insert(partners).values(core).returning();
      await db.insert(partnerTranslations).values([
        { partnerId: created.id, locale: 'en', ...en },
        { partnerId: created.id, locale: 'ar', ...ar },
      ]);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'partners',
        entityId: String(created.id),
        details: `Created partner ${core.name}`,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Create partner error:', error);
      res.status(500).json({ error: 'Failed to create partner' });
    }
  }
);

app.put(
  '/api/admin/partners/:id',
  requireAuth,
  requirePermission(['content:write', 'catalog:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const parsed = partnerSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid partner payload' });
    }
    try {
      const { en, ar, ...core } = parsed.data;
      const [updated] = await db
        .update(partners)
        .set({ ...core, updatedAt: new Date() })
        .where(eq(partners.id, id))
        .returning();
      await db.delete(partnerTranslations).where(eq(partnerTranslations.partnerId, id));
      await db.insert(partnerTranslations).values([
        { partnerId: id, locale: 'en', ...en },
        { partnerId: id, locale: 'ar', ...ar },
      ]);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'partners',
        entityId: String(id),
        details: `Updated partner ${core.name}`,
      });
      res.json(updated);
    } catch (error) {
      console.error('Update partner error:', error);
      res.status(500).json({ error: 'Failed to update partner' });
    }
  }
);

app.delete(
  '/api/admin/partners/:id',
  requireAuth,
  requirePermission(['content:write', 'catalog:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(partners).where(eq(partners.id, id));
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DELETE',
        entityType: 'partners',
        entityId: String(id),
        details: `Deleted partner #${id}`,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete partner error:', error);
      res.status(500).json({ error: 'Failed to delete partner' });
    }
  }
);

// Admin: Projects CRUD
const projectSchema = z.object({
  slug: z.string().min(2),
  category: z.string().min(2),
  division: z.string().default('contracting'),
  locationEn: z.string().default(''),
  locationAr: z.string().default(''),
  completionYear: z.string().default(''),
  imageUrl: z.string().default('/images/sector-utilities.jpg'),
  isFeatured: z.boolean().default(true),
  isPublished: z.boolean().default(true),
  isPlaceholder: z.boolean().default(false),
  en: z.object({
    title: z.string().min(2),
    summary: z.string().min(2),
    scopeOfWork: z.string().default(''),
    outcomeNotes: z.string().default(''),
  }),
  ar: z.object({
    title: z.string().min(2),
    summary: z.string().min(2),
    scopeOfWork: z.string().default(''),
    outcomeNotes: z.string().default(''),
  }),
});

app.post(
  '/api/admin/projects',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid project payload' });
    try {
      const { en, ar, ...core } = parsed.data;
      const [created] = await db.insert(projects).values(core).returning();
      await db.insert(projectTranslations).values([
        { projectId: created.id, locale: 'en', ...en },
        { projectId: created.id, locale: 'ar', ...ar },
      ]);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'projects',
        entityId: String(created.id),
        details: `Created project ${en.title}`,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

app.put(
  '/api/admin/projects/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid project payload' });
    }
    try {
      const { en, ar, ...core } = parsed.data;
      const [updated] = await db
        .update(projects)
        .set({ ...core, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();
      await db.delete(projectTranslations).where(eq(projectTranslations.projectId, id));
      await db.insert(projectTranslations).values([
        { projectId: id, locale: 'en', ...en },
        { projectId: id, locale: 'ar', ...ar },
      ]);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'projects',
        entityId: String(id),
        details: `Updated project ${en.title}`,
      });
      res.json(updated);
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

app.delete(
  '/api/admin/projects/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(projects).where(eq(projects.id, id));
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DELETE',
        entityType: 'projects',
        entityId: String(id),
        details: `Deleted project #${id}`,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }
);

// Admin: Services Update
app.put(
  '/api/admin/services/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const schema = z.object({
      isPublished: z.boolean().default(true),
      en: z.object({
        title: z.string().min(2),
        shortDescription: z.string().min(2),
        fullDescription: z.string().default(''),
      }),
      ar: z.object({
        title: z.string().min(2),
        shortDescription: z.string().min(2),
        fullDescription: z.string().default(''),
      }),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid service update' });
    }
    try {
      await db
        .update(services)
        .set({ isPublished: parsed.data.isPublished, updatedAt: new Date() })
        .where(eq(services.id, id));
      await db.delete(serviceTranslations).where(eq(serviceTranslations.serviceId, id));
      await db.insert(serviceTranslations).values([
        { serviceId: id, locale: 'en', ...parsed.data.en, featuresJson: [] },
        { serviceId: id, locale: 'ar', ...parsed.data.ar, featuresJson: [] },
      ]);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'services',
        entityId: String(id),
        details: `Updated service ${parsed.data.en.title}`,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Update service error:', error);
      res.status(500).json({ error: 'Failed to update service' });
    }
  }
);

// Admin: Blog Posts CRUD
const blogSchema = z.object({
  slug: z.string().min(2),
  categoryEn: z.string().min(2),
  categoryAr: z.string().min(2),
  coverImageUrl: z.string().default('/images/facility-pump-room.jpg'),
  authorName: z.string().default('United Park Editorial Team'),
  readTimeMinutes: z.number().int().min(1).max(60).default(4),
  isPublished: z.boolean().default(true),
  titleEn: z.string().min(2),
  titleAr: z.string().min(2),
  excerptEn: z.string().min(2),
  excerptAr: z.string().min(2),
  contentEn: z.string().min(5),
  contentAr: z.string().min(5),
});

app.post(
  '/api/admin/blog',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const parsed = blogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid article payload' });
    try {
      const [created] = await db.insert(blogPosts).values(parsed.data).returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'blog_posts',
        entityId: String(created.id),
        details: `Published article ${created.titleEn}`,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Create blog error:', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  }
);

app.put(
  '/api/admin/blog/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const parsed = blogSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid article payload' });
    }
    try {
      const [updated] = await db
        .update(blogPosts)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(blogPosts.id, id))
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'blog_posts',
        entityId: String(id),
        details: `Updated article ${updated.titleEn}`,
      });
      res.json(updated);
    } catch (error) {
      console.error('Update blog error:', error);
      res.status(500).json({ error: 'Failed to update article' });
    }
  }
);

app.delete(
  '/api/admin/blog/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(blogPosts).where(eq(blogPosts.id, id));
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DELETE',
        entityType: 'blog_posts',
        entityId: String(id),
        details: `Deleted article #${id}`,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete blog error:', error);
      res.status(500).json({ error: 'Failed to delete article' });
    }
  }
);

// Admin: Media Library Upload
app.post(
  '/api/admin/media',
  requireAuth,
  requirePermission(['media:write', 'content:write', 'catalog:write']),
  upload.single('file'),
  async (req: AuthRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file attached' });
    }
    try {
      const asset = await createMediaAsset({
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        dataBase64: req.file.buffer.toString('base64'),
        altEn: typeof req.body.altEn === 'string' ? req.body.altEn : req.file.originalname,
        altAr: typeof req.body.altAr === 'string' ? req.body.altAr : req.file.originalname,
        folder: typeof req.body.folder === 'string' ? req.body.folder : 'cms',
        uploadedByUserId: req.dbUser?.id ?? null,
      });

      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPLOAD',
        entityType: 'media_assets',
        entityId: String(asset.id),
        details: `Uploaded ${asset.filename}`,
      });

      res.status(201).json(asset);
    } catch (error) {
      console.error('Media upload failed:', error);
      res.status(500).json({ error: 'Failed to upload media file' });
    }
  }
);

// Admin: Lead Management (Quotes & Contact Messages)
app.put(
  '/api/admin/quotes/:id',
  requireAuth,
  requirePermission(['leads:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const schema = z.object({
      status: z.enum(['new', 'in_review', 'quoted', 'archived']),
      adminNotes: z.string().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid quote update' });
    }
    try {
      const [updated] = await db
        .update(quoteRequests)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(quoteRequests.id, id))
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'quote_requests',
        entityId: String(id),
        details: `Updated quote #${id} status to ${parsed.data.status}`,
      });
      res.json(updated);
    } catch (error) {
      console.error('Quote update error:', error);
      res.status(500).json({ error: 'Failed to update quote request' });
    }
  }
);

app.put(
  '/api/admin/contacts/:id',
  requireAuth,
  requirePermission(['leads:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const schema = z.object({
      status: z.enum(['new', 'responded', 'archived']),
      adminNotes: z.string().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid contact update' });
    }
    try {
      const [updated] = await db
        .update(contactMessages)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(contactMessages.id, id))
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'contact_messages',
        entityId: String(id),
        details: `Updated contact message #${id} status to ${parsed.data.status}`,
      });
      res.json(updated);
    } catch (error) {
      console.error('Contact update error:', error);
      res.status(500).json({ error: 'Failed to update contact message' });
    }
  }
);

// Admin: SEO Metadata Upsert
app.put(
  '/api/admin/seo',
  requireAuth,
  requirePermission(['seo:write']),
  async (req: AuthRequest, res) => {
    const schema = z.object({
      routeKey: z.string().min(1),
      locale: z.enum(['en', 'ar']),
      metaTitle: z.string().min(2),
      metaDescription: z.string().min(2),
      canonicalPath: z.string().min(1),
      ogTitle: z.string().default(''),
      ogDescription: z.string().default(''),
      schemaType: z.string().default('WebPage'),
      keywords: z.string().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid SEO payload' });

    try {
      const [saved] = await db
        .insert(seoMetadata)
        .values({ ...parsed.data, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [seoMetadata.routeKey, seoMetadata.locale],
          set: { ...parsed.data, updatedAt: new Date() },
        })
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'seo_metadata',
        entityId: `${parsed.data.routeKey}:${parsed.data.locale}`,
        details: `Updated SEO metadata for ${parsed.data.routeKey} (${parsed.data.locale})`,
      });
      res.json(saved);
    } catch (error) {
      console.error('SEO update error:', error);
      res.status(500).json({ error: 'Failed to save SEO metadata' });
    }
  }
);

// Admin: Navigation Menu Item Update
app.put(
  '/api/admin/menu-items/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const schema = z.object({
      labelEn: z.string().min(1),
      labelAr: z.string().min(1),
      url: z.string().min(1),
      sortOrder: z.number().int(),
      isVisible: z.boolean(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid menu item payload' });
    }
    try {
      const [updated] = await db
        .update(navigationItems)
        .set(parsed.data)
        .where(eq(navigationItems.id, id))
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'navigation_items',
        entityId: String(id),
        details: `Updated menu link ${parsed.data.labelEn}`,
      });
      res.json(updated);
    } catch (error) {
      console.error('Menu item update error:', error);
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  }
);

// Admin: Social Link Update
app.put(
  '/api/admin/social-links/:id',
  requireAuth,
  requirePermission(['*']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const schema = z.object({
      url: z.string().url(),
      isVisible: z.boolean(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid social link payload' });
    }
    try {
      const [updated] = await db
        .update(socialLinks)
        .set(parsed.data)
        .where(eq(socialLinks.id, id))
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'social_links',
        entityId: String(id),
        details: `Updated social link ${updated.platform}`,
      });
      res.json(updated);
    } catch (error) {
      console.error('Social link update error:', error);
      res.status(500).json({ error: 'Failed to update social link' });
    }
  }
);

// Admin: User Role Management (Super Admin only)
app.put(
  '/api/admin/users/:id/role',
  requireAuth,
  requirePermission(['*']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const schema = z.object({
      roleId: z.number().int(),
      isActive: z.boolean(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid user role update' });
    }
    try {
      const [updated] = await db
        .update(users)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'users',
        entityId: String(id),
        details: `Updated role/status for user #${id}`,
      });
      res.json(updated);
    } catch (error) {
      console.error('User role update error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }
);

// Global error handler for multer / unexpected API errors
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(400).json({ error: err.message || 'Bad request' });
});

async function startServer() {
  app.use(
    '/models',
    express.static(path.resolve(process.cwd(), 'public/models'), {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.glb')) {
          res.setHeader('Content-Type', 'model/gltf-binary');
        }
      },
    })
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, { maxAge: '1d' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`United Park Group (PARK) server listening on port ${PORT}`);
  });
}

startServer();

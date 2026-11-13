import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import multer from 'multer';
import { z } from 'zod';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  banners,
  blogPosts,
  contactMessages,
  homepageSections,
  mediaAssets,
  mediaFolders,
  navigationItems,
  pages,
  pageSections,
  pageTranslations,
  partners,
  partnerTranslations,
  productCategories,
  productPriceHistory,
  products,
  productTranslations,
  projects,
  projectTranslations,
  quoteRequests,
  redirects,
  sectors,
  sectorTranslations,
  seoMetadata,
  services,
  serviceTranslations,
  socialLinks,
  systemBackups,
  testimonials,
  users,
  websiteSettings,
} from './src/db/schema.ts';
import {
  createContactMessage,
  createLogicalSnapshotPayload,
  createMediaAsset,
  createQuoteRequest,
  getAdminOverviewData,
  getMediaAssetById,
  getPublicBootstrap,
  getPublicSettings,
  getSitemapEntities,
  Locale,
  logActivity,
  upsertPageTranslation,
} from './src/db/queries.ts';
import {
  AuthRequest,
  requireAuth,
  requirePermission,
  userHasAnyPermission,
} from './src/middleware/auth.ts';

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple sliding-window rate limiter
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

// Public RFQ upload (5MB max)
const publicUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Allowed: PDF, DOCX, PNG, JPG, WEBP.'));
    }
  },
});

// Admin Media Library upload (supports JPG, PNG, WebP, sanitized SVG, MP4, PDF up to 15MB)
const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'application/pdf',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported media format. Allowed: JPG, PNG, WebP, SVG, MP4, PDF.'));
    }
  },
});

function sanitizeSvgBuffer(buf: Buffer): Buffer {
  let svg = buf.toString('utf8');
  svg = svg
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '');
  return Buffer.from(svg, 'utf8');
}

function extractImageDimensions(buf: Buffer, mimeType: string): { width: number; height: number } {
  try {
    if (mimeType === 'image/png' && buf.length >= 24) {
      return {
        width: buf.readUInt32BE(16),
        height: buf.readUInt32BE(20),
      };
    }
    if (mimeType === 'image/jpeg') {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) {
          return {
            height: buf.readUInt16BE(i + 5),
            width: buf.readUInt16BE(i + 7),
          };
        }
        if (buf[i] !== 0xff) break;
        const len = buf.readUInt16BE(i + 2);
        if (len < 2) break;
        i += 2 + len;
      }
    }
    if (mimeType === 'image/webp' && buf.length >= 30 && buf.toString('ascii', 12, 16) === 'VP8X') {
      const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { width, height };
    }
  } catch {
    // Non-fatal fallback
  }
  return { width: 0, height: 0 };
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

// Technical SEO: dynamic robots.txt from DB settings & XML sitemap
app.get('/robots.txt', async (req, res) => {
  const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  try {
    const settings = await getPublicSettings();
    const customRobots = settings?.robotsTxt?.trim();
    if (customRobots) {
      const hasSitemap = /sitemap:/i.test(customRobots);
      res
        .type('text/plain')
        .send(hasSitemap ? customRobots : `${customRobots}\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
      return;
    }
  } catch (err) {
    console.error('Failed loading robots.txt from DB:', err);
  }
  res
    .type('text/plain')
    .send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const { pageRows, productRows, partnerRows, projectRows, blogRows, sectorRows } =
      await getSitemapEntities();

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
    ];

    const dynamicPaths = [
      ...sectorRows.map((s) => s.routePath),
      ...pageRows.map((p) => (p.slug === 'home' ? '/' : p.slug.startsWith('park-') ? `/p/${p.slug}` : `/p/${p.slug}`)),
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
    if (!asset) {
      return res.status(404).json({ error: 'Media asset not found' });
    }
    if (!asset.dataBase64 && asset.url && !asset.url.startsWith('/api/media/')) {
      return res.redirect(asset.url);
    }
    if (!asset.dataBase64) {
      return res.status(404).json({ error: 'Media binary not found' });
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

// Track redirect hit
app.post('/api/public/redirects/:id/hit', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
  try {
    await db
      .update(redirects)
      .set({ hits: sql`${redirects.hits} + 1` })
      .where(eq(redirects.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed' });
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
  websiteTrap: z.string().max(0).optional().default(''),
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

// Public Request a Quote API
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
  publicUpload.single('attachment'),
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
  requirePermission([
    'content:read',
    'content:write',
    'catalog:read',
    'catalog:write',
    'leads:read',
    'seo:write',
    'settings:manage',
    'logs:read',
  ]),
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
  requirePermission(['settings:manage']),
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
      logoUrl: z.string().optional().default(''),
      primaryColor: z.string().min(4).max(20),
      accentColor: z.string().min(4).max(20),
      mapEmbedUrl: z.string().optional().default(''),
      copyrightEn: z.string().min(2),
      copyrightAr: z.string().min(2),
      defaultCurrency: z.string().min(3).max(8).optional().default('SAR'),
      supportedCurrenciesJson: z.array(z.string()).optional().default(['SAR', 'USD', 'AED', 'EUR']),
      defaultTaxRate: z.string().optional().default('15'),
      analyticsMeasurementId: z.string().optional().default(''),
      robotsTxt: z.string().optional().default(''),
      footerAboutEn: z.string().optional().default(''),
      footerAboutAr: z.string().optional().default(''),
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
        details: 'Updated bilingual corporate settings, currency, analytics & SEO configuration',
        ipAddress: req.ip,
      });

      res.json(updated);
    } catch (error) {
      console.error('Update settings failed:', error);
      res.status(500).json({ error: 'Failed to update website settings' });
    }
  }
);

// Admin: Pages Management (Create, Update metadata, Duplicate, Delete, Translations, Sections)
const createPageSchema = z.object({
  slug: z.string().min(2),
  template: z.string().default('standard'),
  heroImageUrl: z.string().default('/images/hero-pumps.jpg'),
  status: z.enum(['draft', 'published', 'archived', 'scheduled']).default('draft'),
  isVisible: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  scheduledAt: z.string().nullable().optional(),
  sortOrder: z.number().int().default(10),
  enTitle: z.string().min(1).default('New Page'),
  arTitle: z.string().min(1).default('صفحة جديدة'),
});

app.post(
  '/api/admin/pages',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const parsed = createPageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid page payload' });

    try {
      const { enTitle, arTitle, scheduledAt, ...core } = parsed.data;
      const isPub = core.status === 'published' ? true : core.status === 'draft' || core.status === 'archived' ? false : core.isPublished;
      const [created] = await db
        .insert(pages)
        .values({
          ...core,
          isPublished: isPub,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        })
        .returning();

      await db.insert(pageTranslations).values([
        {
          pageId: created.id,
          locale: 'en',
          title: enTitle,
          heroHeading: enTitle,
          heroSubheading: '',
          heroCtaText: 'Request Quote',
          heroCtaUrl: '/quote',
          introBannerText: '',
          introBannerCtaText: '',
          bodyContent: '',
        },
        {
          pageId: created.id,
          locale: 'ar',
          title: arTitle,
          heroHeading: arTitle,
          heroSubheading: '',
          heroCtaText: 'اطلب عرض سعر',
          heroCtaUrl: '/quote',
          introBannerText: '',
          introBannerCtaText: '',
          bodyContent: '',
        },
      ]);

      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'pages',
        entityId: String(created.id),
        details: `Created page /${created.slug} (${core.status})`,
        ipAddress: req.ip,
      });

      res.status(201).json(created);
    } catch (error) {
      console.error('Create page error:', error);
      res.status(500).json({ error: 'Failed to create page (slug must be unique)' });
    }
  }
);

app.put(
  '/api/admin/pages/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const schema = z.object({
      slug: z.string().min(2),
      template: z.string().default('standard'),
      heroImageUrl: z.string().default(''),
      status: z.enum(['draft', 'published', 'archived', 'scheduled']).default('published'),
      isVisible: z.boolean().default(true),
      scheduledAt: z.string().nullable().optional(),
      sortOrder: z.number().int().default(0),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid page update payload' });
    }
    try {
      const { scheduledAt, ...rest } = parsed.data;
      const isPublished = rest.status === 'published' || rest.status === 'scheduled';
      const [updated] = await db
        .update(pages)
        .set({
          ...rest,
          isPublished,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          updatedAt: new Date(),
        })
        .where(eq(pages.id, id))
        .returning();

      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'pages',
        entityId: String(id),
        details: `Updated page metadata /${updated.slug} (${rest.status})`,
        ipAddress: req.ip,
      });
      res.json(updated);
    } catch (error) {
      console.error('Update page error:', error);
      res.status(500).json({ error: 'Failed to update page' });
    }
  }
);

app.post(
  '/api/admin/pages/:id/duplicate',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid page ID' });
    try {
      const [source] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
      if (!source) return res.status(404).json({ error: 'Source page not found' });

      const newSlug = `${source.slug}-copy-${Date.now().toString().slice(-4)}`;
      const [created] = await db
        .insert(pages)
        .values({
          slug: newSlug,
          template: source.template,
          heroImageUrl: source.heroImageUrl,
          status: 'draft',
          isVisible: false,
          isPublished: false,
          sortOrder: source.sortOrder + 1,
        })
        .returning();

      const sourceTrans = await db
        .select()
        .from(pageTranslations)
        .where(eq(pageTranslations.pageId, id));
      if (sourceTrans.length > 0) {
        await db.insert(pageTranslations).values(
          sourceTrans.map((t) => ({
            pageId: created.id,
            locale: t.locale,
            title: `${t.title} (Copy)`,
            heroHeading: t.heroHeading,
            heroSubheading: t.heroSubheading,
            heroCtaText: t.heroCtaText,
            heroCtaUrl: t.heroCtaUrl,
            introBannerText: t.introBannerText,
            introBannerCtaText: t.introBannerCtaText,
            bodyContent: t.bodyContent,
            sectionsJson: t.sectionsJson,
          }))
        );
      }

      const sourceSecs = await db
        .select()
        .from(pageSections)
        .where(eq(pageSections.pageId, id))
        .orderBy(asc(pageSections.sortOrder));
      if (sourceSecs.length > 0) {
        await db.insert(pageSections).values(
          sourceSecs.map((s) => ({
            pageId: created.id,
            sectionType: s.sectionType,
            sortOrder: s.sortOrder,
            isVisible: s.isVisible,
            contentEnJson: s.contentEnJson,
            contentArJson: s.contentArJson,
            settingsJson: s.settingsJson,
          }))
        );
      }

      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DUPLICATE',
        entityType: 'pages',
        entityId: String(created.id),
        details: `Duplicated /${source.slug} to /${created.slug}`,
        ipAddress: req.ip,
      });

      res.status(201).json(created);
    } catch (error) {
      console.error('Duplicate page error:', error);
      res.status(500).json({ error: 'Failed to duplicate page' });
    }
  }
);

app.delete(
  '/api/admin/pages/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      const [target] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
      if (target?.slug === 'home') {
        return res.status(400).json({ error: 'Cannot delete the core Homepage entry.' });
      }
      await db.delete(pages).where(eq(pages.id, id));
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DELETE',
        entityType: 'pages',
        entityId: String(id),
        details: `Deleted page /${target?.slug || id}`,
        ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete page error:', error);
      res.status(500).json({ error: 'Failed to delete page' });
    }
  }
);

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

// Admin: Page Sections Builder CRUD
const pageSectionSchema = z.object({
  sectionType: z.enum([
    'hero',
    'image_text',
    'two_column',
    'gallery',
    'features',
    'stats',
    'testimonials',
    'cta',
    'product_showcase',
    'project_showcase',
    'contact',
  ]),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  contentEnJson: z.record(z.string(), z.unknown()).default({}),
  contentArJson: z.record(z.string(), z.unknown()).default({}),
  settingsJson: z.record(z.string(), z.unknown()).default({}),
});

app.post(
  '/api/admin/pages/:id/sections',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const pageId = Number(req.params.id);
    const parsed = pageSectionSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(pageId)) {
      return res.status(400).json({ error: 'Invalid page section payload' });
    }
    try {
      const [created] = await db
        .insert(pageSections)
        .values({ pageId, ...parsed.data })
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'page_sections',
        entityId: String(created.id),
        details: `Added ${created.sectionType} section to page #${pageId}`,
        ipAddress: req.ip,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Create page section error:', error);
      res.status(500).json({ error: 'Failed to create section' });
    }
  }
);

app.put(
  '/api/admin/page-sections/:sectionId',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const sectionId = Number(req.params.sectionId);
    const parsed = pageSectionSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(sectionId)) {
      return res.status(400).json({ error: 'Invalid section update payload' });
    }
    try {
      const [updated] = await db
        .update(pageSections)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(pageSections.id, sectionId))
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'page_sections',
        entityId: String(sectionId),
        details: `Updated section #${sectionId} (${parsed.data.sectionType})`,
        ipAddress: req.ip,
      });
      res.json(updated);
    } catch (error) {
      console.error('Update section error:', error);
      res.status(500).json({ error: 'Failed to update section' });
    }
  }
);

app.delete(
  '/api/admin/page-sections/:sectionId',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const sectionId = Number(req.params.sectionId);
    if (!Number.isFinite(sectionId)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(pageSections).where(eq(pageSections.id, sectionId));
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DELETE',
        entityType: 'page_sections',
        entityId: String(sectionId),
        details: `Deleted page section #${sectionId}`,
        ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete section error:', error);
      res.status(500).json({ error: 'Failed to delete section' });
    }
  }
);

// Admin: Business Sectors CRUD
const sectorSchema = z.object({
  slug: z.string().min(2),
  routePath: z.string().min(2),
  iconName: z.string().default('Cog'),
  imageUrl: z.string().default('/images/hero-pumps.jpg'),
  accentColor: z.string().default('#133D68'),
  sortOrder: z.number().int().default(0),
  isFeatured: z.boolean().default(true),
  isPublished: z.boolean().default(true),
  en: z.object({
    title: z.string().min(2),
    shortTitle: z.string().min(2),
    tagline: z.string().default(''),
    summary: z.string().min(2),
    description: z.string().default(''),
    highlightsJson: z.array(z.string()).default([]),
  }),
  ar: z.object({
    title: z.string().min(2),
    shortTitle: z.string().min(2),
    tagline: z.string().default(''),
    summary: z.string().min(2),
    description: z.string().default(''),
    highlightsJson: z.array(z.string()).default([]),
  }),
});

app.post(
  '/api/admin/sectors',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const parsed = sectorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid sector payload' });
    try {
      const { en, ar, ...core } = parsed.data;
      const [created] = await db.insert(sectors).values(core).returning();
      await db.insert(sectorTranslations).values([
        { sectorId: created.id, locale: 'en', ...en },
        { sectorId: created.id, locale: 'ar', ...ar },
      ]);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'sectors',
        entityId: String(created.id),
        details: `Created business sector ${en.title}`,
        ipAddress: req.ip,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Create sector error:', error);
      res.status(500).json({ error: 'Failed to create business sector' });
    }
  }
);

app.put(
  '/api/admin/sectors/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const parsed = sectorSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid sector payload' });
    }
    try {
      const { en, ar, ...core } = parsed.data;
      const [updated] = await db
        .update(sectors)
        .set({ ...core, updatedAt: new Date() })
        .where(eq(sectors.id, id))
        .returning();
      await db.delete(sectorTranslations).where(eq(sectorTranslations.sectorId, id));
      await db.insert(sectorTranslations).values([
        { sectorId: id, locale: 'en', ...en },
        { sectorId: id, locale: 'ar', ...ar },
      ]);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'sectors',
        entityId: String(id),
        details: `Updated business sector ${en.title}`,
        ipAddress: req.ip,
      });
      res.json(updated);
    } catch (error) {
      console.error('Update sector error:', error);
      res.status(500).json({ error: 'Failed to update business sector' });
    }
  }
);

app.delete(
  '/api/admin/sectors/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(sectors).where(eq(sectors.id, id));
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DELETE',
        entityType: 'sectors',
        entityId: String(id),
        details: `Deleted sector #${id}`,
        ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete sector error:', error);
      res.status(500).json({ error: 'Failed to delete sector' });
    }
  }
);

// Admin: Categories CRUD
const categorySchema = z.object({
  slug: z.string().min(2),
  parentId: z.number().int().nullable().optional().default(null),
  nameEn: z.string().min(2),
  nameAr: z.string().min(2),
  descriptionEn: z.string().default(''),
  descriptionAr: z.string().default(''),
  imageUrl: z.string().default('/images/product-pump.jpg'),
  sortOrder: z.number().int().default(0),
});

app.post(
  '/api/admin/categories',
  requireAuth,
  requirePermission(['catalog:write']),
  async (req: AuthRequest, res) => {
    const parsed = categorySchema.safeParse(req.body);
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
        ipAddress: req.ip,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Failed to create category (ensure slug is unique)' });
    }
  }
);

app.put(
  '/api/admin/categories/:id',
  requireAuth,
  requirePermission(['catalog:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid category update payload' });
    }
    try {
      const [updated] = await db
        .update(productCategories)
        .set(parsed.data)
        .where(eq(productCategories.id, id))
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'product_categories',
        entityId: String(id),
        details: `Updated category ${updated.nameEn}`,
        ipAddress: req.ip,
      });
      res.json(updated);
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
);

app.delete(
  '/api/admin/categories/:id',
  requireAuth,
  requirePermission(['catalog:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(productCategories).where(eq(productCategories.id, id));
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DELETE',
        entityType: 'product_categories',
        entityId: String(id),
        details: `Deleted category #${id}`,
        ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }
);

// Admin: Products & Pricing CRUD
const productPayloadSchema = z.object({
  sku: z.string().min(2),
  slug: z.string().min(2),
  categoryId: z.number().int().nullable().optional(),
  partnerId: z.number().int().nullable().optional(),
  imageUrl: z.string().default('/images/product-pump.jpg'),
  galleryImagesJson: z.array(z.string()).default([]),
  datasheetUrl: z.string().default(''),
  division: z.string().default('pumps'),
  brand: z.string().default(''),
  modelNumber: z.string().default(''),
  stockStatus: z.enum(['in_stock', 'made_to_order', 'out_of_stock']).default('in_stock'),
  regularPrice: z.string().default('0'),
  discountPrice: z.string().default(''),
  currency: z.string().default('SAR'),
  taxRate: z.string().default('15'),
  showPrice: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  seoTitleEn: z.string().default(''),
  seoTitleAr: z.string().default(''),
  seoDescEn: z.string().default(''),
  seoDescAr: z.string().default(''),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  priceChangeNote: z.string().optional().default(''),
  en: z.object({
    name: z.string().min(2),
    summary: z.string().min(2),
    description: z.string().default(''),
    specificationsJson: z
      .array(z.object({ label: z.string(), value: z.string(), unit: z.string().optional() }))
      .default([]),
    applicationsJson: z.array(z.string()).default([]),
    featuresJson: z.array(z.string()).default([]),
  }),
  ar: z.object({
    name: z.string().min(2),
    summary: z.string().min(2),
    description: z.string().default(''),
    specificationsJson: z
      .array(z.object({ label: z.string(), value: z.string(), unit: z.string().optional() }))
      .default([]),
    applicationsJson: z.array(z.string()).default([]),
    featuresJson: z.array(z.string()).default([]),
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
      const { en, ar, priceChangeNote, ...core } = parsed.data;
      const isPublished = core.status === 'published' && core.isPublished;
      const [created] = await db
        .insert(products)
        .values({ ...core, isPublished })
        .returning();

      await db.insert(productTranslations).values([
        { productId: created.id, locale: 'en', ...en },
        { productId: created.id, locale: 'ar', ...ar },
      ]);

      await db.insert(productPriceHistory).values({
        productId: created.id,
        previousPrice: '0',
        newPrice: core.regularPrice || '0',
        discountPrice: core.discountPrice || '',
        currency: core.currency || 'SAR',
        showPrice: core.showPrice,
        changedByUserId: req.dbUser?.id ?? null,
        changedByEmail: req.dbUser?.email || 'system',
        note: priceChangeNote || 'Initial product pricing record',
      });

      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'products',
        entityId: String(created.id),
        details: `Created product ${core.sku} (${core.currency} ${core.regularPrice}, showPrice=${core.showPrice})`,
        ipAddress: req.ip,
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
  requirePermission(['catalog:write', 'pricing:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const parsed = productPayloadSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid product update payload' });
    }

    try {
      const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!existing) return res.status(404).json({ error: 'Product not found' });

      const { en, ar, priceChangeNote, ...core } = parsed.data;
      const priceChanged =
        existing.regularPrice !== core.regularPrice ||
        existing.discountPrice !== core.discountPrice ||
        existing.currency !== core.currency ||
        existing.showPrice !== core.showPrice;

      if (priceChanged && req.dbUser && !userHasAnyPermission(req.dbUser, ['pricing:write', 'catalog:write'])) {
        return res.status(403).json({ error: 'Forbidden: Missing pricing modification permission.' });
      }

      const isPublished = core.status === 'published';
      const [updated] = await db
        .update(products)
        .set({ ...core, isPublished, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();

      await db.delete(productTranslations).where(eq(productTranslations.productId, id));
      await db.insert(productTranslations).values([
        { productId: id, locale: 'en', ...en },
        { productId: id, locale: 'ar', ...ar },
      ]);

      if (priceChanged) {
        await db.insert(productPriceHistory).values({
          productId: id,
          previousPrice: existing.regularPrice || '0',
          newPrice: core.regularPrice || '0',
          discountPrice: core.discountPrice || '',
          currency: core.currency || 'SAR',
          showPrice: core.showPrice,
          changedByUserId: req.dbUser?.id ?? null,
          changedByEmail: req.dbUser?.email || 'system',
          note: priceChangeNote || 'Price configuration updated from Admin CMS',
        });
      }

      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'products',
        entityId: String(id),
        details: `Updated product ${core.sku} (status=${core.status}, price=${core.currency} ${core.regularPrice})`,
        ipAddress: req.ip,
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
        ipAddress: req.ip,
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
        ipAddress: req.ip,
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
        ipAddress: req.ip,
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
        ipAddress: req.ip,
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
  clientName: z.string().default(''),
  category: z.string().min(2),
  division: z.string().default('contracting'),
  status: z.enum(['completed', 'in_progress', 'upcoming']).default('completed'),
  locationEn: z.string().default(''),
  locationAr: z.string().default(''),
  completionYear: z.string().default(''),
  imageUrl: z.string().default('/images/sector-utilities.jpg'),
  galleryImagesJson: z.array(z.string()).default([]),
  videoUrl: z.string().default(''),
  seoTitleEn: z.string().default(''),
  seoTitleAr: z.string().default(''),
  seoDescEn: z.string().default(''),
  seoDescAr: z.string().default(''),
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
        ipAddress: req.ip,
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
        ipAddress: req.ip,
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
        ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }
);

// Admin: Services CRUD
const serviceSchema = z.object({
  slug: z.string().min(2).optional(),
  iconName: z.string().default('Droplets'),
  imageUrl: z.string().default(''),
  division: z.string().default('pumps'),
  sortOrder: z.number().int().default(0),
  isFeatured: z.boolean().default(true),
  isPublished: z.boolean().default(true),
  en: z.object({
    title: z.string().min(2),
    shortDescription: z.string().min(2),
    fullDescription: z.string().default(''),
    featuresJson: z.array(z.string()).default([]),
  }),
  ar: z.object({
    title: z.string().min(2),
    shortDescription: z.string().min(2),
    fullDescription: z.string().default(''),
    featuresJson: z.array(z.string()).default([]),
  }),
});

app.post(
  '/api/admin/services',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.slug) {
      return res.status(400).json({ error: 'Invalid service payload (slug required)' });
    }
    try {
      const { en, ar, ...core } = parsed.data;
      const [created] = await db
        .insert(services)
        .values({ ...core, slug: parsed.data.slug })
        .returning();
      await db.insert(serviceTranslations).values([
        { serviceId: created.id, locale: 'en', ...en },
        { serviceId: created.id, locale: 'ar', ...ar },
      ]);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'services',
        entityId: String(created.id),
        details: `Created service ${en.title}`,
        ipAddress: req.ip,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json({ error: 'Failed to create service' });
    }
  }
);

app.put(
  '/api/admin/services/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid service update' });
    }
    try {
      const { en, ar, slug: _slug, ...core } = parsed.data;
      await db
        .update(services)
        .set({ ...core, updatedAt: new Date() })
        .where(eq(services.id, id));
      await db.delete(serviceTranslations).where(eq(serviceTranslations.serviceId, id));
      await db.insert(serviceTranslations).values([
        { serviceId: id, locale: 'en', ...en },
        { serviceId: id, locale: 'ar', ...ar },
      ]);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'services',
        entityId: String(id),
        details: `Updated service ${en.title}`,
        ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Update service error:', error);
      res.status(500).json({ error: 'Failed to update service' });
    }
  }
);

app.delete(
  '/api/admin/services/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(services).where(eq(services.id, id));
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DELETE',
        entityType: 'services',
        entityId: String(id),
        details: `Deleted service #${id}`,
        ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete service error:', error);
      res.status(500).json({ error: 'Failed to delete service' });
    }
  }
);

// Admin: Banners & Homepage Sections
const bannerSchema = z.object({
  placement: z.enum(['hero', 'promo', 'sector_banner']).default('hero'),
  titleEn: z.string().min(2),
  titleAr: z.string().min(2),
  subtitleEn: z.string().default(''),
  subtitleAr: z.string().default(''),
  ctaTextEn: z.string().default(''),
  ctaTextAr: z.string().default(''),
  ctaUrl: z.string().default('/quote'),
  imageUrl: z.string().default('/images/hero-pumps.jpg'),
  mobileImageUrl: z.string().default('/images/hero-pumps.jpg'),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});

app.post(
  '/api/admin/banners',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const parsed = bannerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid banner payload' });
    try {
      const [created] = await db.insert(banners).values(parsed.data).returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'banners',
        entityId: String(created.id),
        details: `Created banner ${created.titleEn}`,
        ipAddress: req.ip,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Create banner error:', error);
      res.status(500).json({ error: 'Failed to create banner' });
    }
  }
);

app.put(
  '/api/admin/banners/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const parsed = bannerSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid banner update' });
    }
    try {
      const [updated] = await db
        .update(banners)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(banners.id, id))
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'banners',
        entityId: String(id),
        details: `Updated banner #${id}`,
        ipAddress: req.ip,
      });
      res.json(updated);
    } catch (error) {
      console.error('Update banner error:', error);
      res.status(500).json({ error: 'Failed to update banner' });
    }
  }
);

app.delete(
  '/api/admin/banners/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(banners).where(eq(banners.id, id));
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DELETE',
        entityType: 'banners',
        entityId: String(id),
        details: `Deleted banner #${id}`,
        ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete banner error:', error);
      res.status(500).json({ error: 'Failed to delete banner' });
    }
  }
);

app.put(
  '/api/admin/homepage-sections/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const schema = z.object({
      titleEn: z.string().min(1),
      titleAr: z.string().min(1),
      subtitleEn: z.string().default(''),
      subtitleAr: z.string().default(''),
      sortOrder: z.number().int(),
      isVisible: z.boolean(),
      configJson: z.record(z.string(), z.unknown()).default({}),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid homepage section payload' });
    }
    try {
      const [updated] = await db
        .update(homepageSections)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(homepageSections.id, id))
        .returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'UPDATE',
        entityType: 'homepage_sections',
        entityId: String(id),
        details: `Updated homepage section ${updated.sectionKey}`,
        ipAddress: req.ip,
      });
      res.json(updated);
    } catch (error) {
      console.error('Update homepage section error:', error);
      res.status(500).json({ error: 'Failed to update homepage section' });
    }
  }
);

// Admin: Testimonials CRUD
const testimonialSchema = z.object({
  authorName: z.string().min(2),
  authorRoleEn: z.string().default(''),
  authorRoleAr: z.string().default(''),
  companyName: z.string().min(2),
  quoteEn: z.string().min(5),
  quoteAr: z.string().min(5),
  isPublished: z.boolean().default(true),
  isPlaceholder: z.boolean().default(false),
});

app.post(
  '/api/admin/testimonials',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid testimonial payload' });
    try {
      const [created] = await db.insert(testimonials).values(parsed.data).returning();
      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: 'Failed to create testimonial' });
    }
  }
);

app.put(
  '/api/admin/testimonials/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid testimonial update' });
    }
    try {
      const [updated] = await db
        .update(testimonials)
        .set(parsed.data)
        .where(eq(testimonials.id, id))
        .returning();
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update testimonial' });
    }
  }
);

app.delete(
  '/api/admin/testimonials/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(testimonials).where(eq(testimonials.id, id));
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to delete testimonial' });
    }
  }
);

// Admin: Blog Posts CRUD
const blogSchema = z.object({
  slug: z.string().min(2),
  categoryEn: z.string().min(2),
  categoryAr: z.string().min(2),
  tagsJson: z.array(z.string()).default([]),
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
  seoTitleEn: z.string().default(''),
  seoTitleAr: z.string().default(''),
  seoDescEn: z.string().default(''),
  seoDescAr: z.string().default(''),
});

app.post(
  '/api/admin/blog',
  requireAuth,
  requirePermission(['content:write', 'seo:write']),
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
        details: `Created article ${created.titleEn}`,
        ipAddress: req.ip,
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
  requirePermission(['content:write', 'seo:write']),
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
        ipAddress: req.ip,
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
        ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete blog error:', error);
      res.status(500).json({ error: 'Failed to delete article' });
    }
  }
);

// Admin: Media Library (single/multi upload, folders, metadata update, replace, delete)
app.post(
  '/api/admin/media',
  requireAuth,
  requirePermission(['media:write', 'content:write', 'catalog:write']),
  mediaUpload.array('files', 10),
  async (req: AuthRequest, res) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files attached' });
    }
    try {
      const folder = typeof req.body.folder === 'string' && req.body.folder ? req.body.folder : 'general';
      const uploadedAssets = [];

      for (const file of files) {
        const safeBuffer =
          file.mimetype === 'image/svg+xml' ? sanitizeSvgBuffer(file.buffer) : file.buffer;
        const dims = extractImageDimensions(safeBuffer, file.mimetype);
        const asset = await createMediaAsset({
          filename: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: safeBuffer.length,
          width: dims.width,
          height: dims.height,
          dataBase64: safeBuffer.toString('base64'),
          storageProvider: 'postgresql',
          titleEn: typeof req.body.titleEn === 'string' && req.body.titleEn ? req.body.titleEn : file.originalname,
          titleAr: typeof req.body.titleAr === 'string' && req.body.titleAr ? req.body.titleAr : file.originalname,
          altEn: typeof req.body.altEn === 'string' && req.body.altEn ? req.body.altEn : file.originalname,
          altAr: typeof req.body.altAr === 'string' && req.body.altAr ? req.body.altAr : file.originalname,
          descriptionEn: typeof req.body.descriptionEn === 'string' ? req.body.descriptionEn : '',
          descriptionAr: typeof req.body.descriptionAr === 'string' ? req.body.descriptionAr : '',
          folder,
          uploadedByUserId: req.dbUser?.id ?? null,
        });
        uploadedAssets.push(asset);

        await logActivity({
          userId: req.dbUser?.id,
          userEmail: req.dbUser?.email,
          action: 'UPLOAD',
          entityType: 'media_assets',
          entityId: String(asset.id),
          details: `Uploaded ${asset.filename} into ${folder}`,
          ipAddress: req.ip,
        });
      }

      res.status(201).json(uploadedAssets.length === 1 ? uploadedAssets[0] : { items: uploadedAssets });
    } catch (error) {
      console.error('Media upload failed:', error);
      res.status(500).json({ error: 'Failed to upload media file(s)' });
    }
  }
);

app.put(
  '/api/admin/media/:id',
  requireAuth,
  requirePermission(['media:write', 'content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const schema = z.object({
      titleEn: z.string().default(''),
      titleAr: z.string().default(''),
      altEn: z.string().default(''),
      altAr: z.string().default(''),
      descriptionEn: z.string().default(''),
      descriptionAr: z.string().default(''),
      folder: z.string().default('general'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid media metadata payload' });
    }
    try {
      const [updated] = await db
        .update(mediaAssets)
        .set(parsed.data)
        .where(eq(mediaAssets.id, id))
        .returning({
          id: mediaAssets.id,
          filename: mediaAssets.filename,
          mimeType: mediaAssets.mimeType,
          sizeBytes: mediaAssets.sizeBytes,
          width: mediaAssets.width,
          height: mediaAssets.height,
          url: mediaAssets.url,
          titleEn: mediaAssets.titleEn,
          titleAr: mediaAssets.titleAr,
          altEn: mediaAssets.altEn,
          altAr: mediaAssets.altAr,
          descriptionEn: mediaAssets.descriptionEn,
          descriptionAr: mediaAssets.descriptionAr,
          folder: mediaAssets.folder,
        });
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update media metadata' });
    }
  }
);

app.post(
  '/api/admin/media/:id/replace',
  requireAuth,
  requirePermission(['media:write']),
  mediaUpload.single('file'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!req.file || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Replacement file and valid ID required' });
    }
    try {
      const safeBuffer =
        req.file.mimetype === 'image/svg+xml' ? sanitizeSvgBuffer(req.file.buffer) : req.file.buffer;
      const dims = extractImageDimensions(safeBuffer, req.file.mimetype);
      const [updated] = await db
        .update(mediaAssets)
        .set({
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: safeBuffer.length,
          width: dims.width,
          height: dims.height,
          dataBase64: safeBuffer.toString('base64'),
        })
        .where(eq(mediaAssets.id, id))
        .returning({
          id: mediaAssets.id,
          filename: mediaAssets.filename,
          mimeType: mediaAssets.mimeType,
          sizeBytes: mediaAssets.sizeBytes,
          width: mediaAssets.width,
          height: mediaAssets.height,
          url: mediaAssets.url,
        });
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'REPLACE',
        entityType: 'media_assets',
        entityId: String(id),
        details: `Replaced media #${id} with ${req.file.originalname}`,
        ipAddress: req.ip,
      });
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to replace media file' });
    }
  }
);

app.delete(
  '/api/admin/media/:id',
  requireAuth,
  requirePermission(['media:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'DELETE',
        entityType: 'media_assets',
        entityId: String(id),
        details: `Deleted media asset #${id}`,
        ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to delete media asset' });
    }
  }
);

app.post(
  '/api/admin/media-folders',
  requireAuth,
  requirePermission(['media:write']),
  async (req: AuthRequest, res) => {
    const schema = z.object({
      name: z.string().min(2),
      slug: z.string().min(2),
      description: z.string().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid folder payload' });
    try {
      const [created] = await db.insert(mediaFolders).values(parsed.data).returning();
      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: 'Failed to create folder (slug must be unique)' });
    }
  }
);

// Admin: Lead Management (Quotes, Contact Messages & CSV Export)
app.put(
  '/api/admin/quotes/:id',
  requireAuth,
  requirePermission(['leads:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const schema = z.object({
      status: z.enum(['new', 'in_progress', 'in_review', 'quoted', 'completed', 'archived']),
      adminNotes: z.string().default(''),
      assignedToUserId: z.number().int().nullable().optional(),
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
        ipAddress: req.ip,
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
      status: z.enum(['new', 'in_progress', 'responded', 'completed', 'archived']),
      adminNotes: z.string().default(''),
      assignedToUserId: z.number().int().nullable().optional(),
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
        ipAddress: req.ip,
      });
      res.json(updated);
    } catch (error) {
      console.error('Contact update error:', error);
      res.status(500).json({ error: 'Failed to update contact message' });
    }
  }
);

app.get(
  '/api/admin/leads/export',
  requireAuth,
  requirePermission(['leads:read']),
  async (req: AuthRequest, res) => {
    const type = req.query.type === 'contacts' ? 'contacts' : 'quotes';
    try {
      let csv = '';
      if (type === 'quotes') {
        const rows = await db.select().from(quoteRequests);
        csv = [
          ['ID', 'Company', 'Contact Name', 'Email', 'Phone', 'Product/Service', 'Quantity', 'Status', 'Created At']
            .map(escapeCsvCell)
            .join(','),
          ...rows.map((r) =>
            [
              r.id,
              r.companyName,
              r.fullName,
              r.businessEmail,
              r.phone,
              r.productOrService,
              r.estimatedQuantity,
              r.status,
              r.createdAt,
            ]
              .map(escapeCsvCell)
              .join(',')
          ),
        ].join('\n');
      } else {
        const rows = await db.select().from(contactMessages);
        csv = [
          ['ID', 'Full Name', 'Company', 'Email', 'Phone', 'Subject', 'Status', 'Created At']
            .map(escapeCsvCell)
            .join(','),
          ...rows.map((r) =>
            [r.id, r.fullName, r.company, r.email, r.phone, r.subject, r.status, r.createdAt]
              .map(escapeCsvCell)
              .join(',')
          ),
        ].join('\n');
      }

      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'EXPORT',
        entityType: type === 'quotes' ? 'quote_requests' : 'contact_messages',
        details: `Exported ${type} CSV`,
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="upg-${type}-export.csv"`);
      res.send(`\uFEFF${csv}`);
    } catch {
      res.status(500).json({ error: 'Failed to export leads CSV' });
    }
  }
);

// Admin: SEO Metadata & Redirects
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
      ogImageUrl: z.string().default(''),
      ogType: z.string().default('website'),
      schemaType: z.string().default('WebPage'),
      keywords: z.string().default(''),
      noIndex: z.boolean().default(false),
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
        ipAddress: req.ip,
      });
      res.json(saved);
    } catch (error) {
      console.error('SEO update error:', error);
      res.status(500).json({ error: 'Failed to save SEO metadata' });
    }
  }
);

const redirectSchema = z.object({
  fromPath: z.string().min(1),
  toPath: z.string().min(1),
  statusCode: z.number().int().default(301),
  isActive: z.boolean().default(true),
});

app.post(
  '/api/admin/redirects',
  requireAuth,
  requirePermission(['seo:write']),
  async (req: AuthRequest, res) => {
    const parsed = redirectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid redirect payload' });
    try {
      const [created] = await db.insert(redirects).values(parsed.data).returning();
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'CREATE',
        entityType: 'redirects',
        entityId: String(created.id),
        details: `Redirect ${created.fromPath} -> ${created.toPath}`,
        ipAddress: req.ip,
      });
      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: 'Failed to create redirect (fromPath must be unique)' });
    }
  }
);

app.put(
  '/api/admin/redirects/:id',
  requireAuth,
  requirePermission(['seo:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const parsed = redirectSchema.safeParse(req.body);
    if (!parsed.success || !Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid redirect update' });
    }
    try {
      const [updated] = await db
        .update(redirects)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(redirects.id, id))
        .returning();
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update redirect' });
    }
  }
);

app.delete(
  '/api/admin/redirects/:id',
  requireAuth,
  requirePermission(['seo:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(redirects).where(eq(redirects.id, id));
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to delete redirect' });
    }
  }
);

// Admin: Navigation Menu Items CRUD & Social Links
app.post(
  '/api/admin/menu-items',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const schema = z.object({
      menuId: z.number().int(),
      labelEn: z.string().min(1),
      labelAr: z.string().min(1),
      url: z.string().min(1),
      sortOrder: z.number().int().default(0),
      isVisible: z.boolean().default(true),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid menu item payload' });
    try {
      const [created] = await db.insert(navigationItems).values(parsed.data).returning();
      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: 'Failed to create menu item' });
    }
  }
);

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
        ipAddress: req.ip,
      });
      res.json(updated);
    } catch (error) {
      console.error('Menu item update error:', error);
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  }
);

app.delete(
  '/api/admin/menu-items/:id',
  requireAuth,
  requirePermission(['content:write']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      await db.delete(navigationItems).where(eq(navigationItems.id, id));
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to delete menu item' });
    }
  }
);

app.put(
  '/api/admin/social-links/:id',
  requireAuth,
  requirePermission(['content:write', 'settings:manage']),
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
        ipAddress: req.ip,
      });
      res.json(updated);
    } catch (error) {
      console.error('Social link update error:', error);
      res.status(500).json({ error: 'Failed to update social link' });
    }
  }
);

// Admin: User Role Management & Account Password Reset Link (Super Admin only)
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
        ipAddress: req.ip,
      });
      res.json(updated);
    } catch (error) {
      console.error('User role update error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }
);

app.post(
  '/api/admin/users/:id/reset-link',
  requireAuth,
  requirePermission(['*']),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });
    try {
      const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!target) return res.status(404).json({ error: 'User not found' });
      const resetLink = await adminAuth.generatePasswordResetLink(target.email);
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'SECURITY',
        entityType: 'users',
        entityId: String(id),
        details: `Generated Firebase password reset link for ${target.email}`,
        ipAddress: req.ip,
      });
      res.json({ resetLink, email: target.email });
    } catch (error) {
      console.error('Password reset link generation error:', error);
      res.status(400).json({
        error:
          'Password reset link requires Firebase Admin service-account credentials or email/password auth provider enabled in Firebase Console.',
      });
    }
  }
);

// Admin: Database Logical Snapshot Export & Backup Audit (Super Admin only)
app.post(
  '/api/admin/backups/snapshot',
  requireAuth,
  requirePermission(['*']),
  async (req: AuthRequest, res) => {
    try {
      const { fileName, jsonStr, record } = await createLogicalSnapshotPayload(
        req.dbUser?.id,
        req.dbUser?.email
      );
      await logActivity({
        userId: req.dbUser?.id,
        userEmail: req.dbUser?.email,
        action: 'BACKUP',
        entityType: 'system_backups',
        entityId: String(record.id),
        details: `Exported verified PostgreSQL snapshot ${fileName} (${record.totalRows} rows across ${record.tableCount} tables)`,
        ipAddress: req.ip,
      });

      res.json({
        record,
        fileName,
        snapshotJson: jsonStr,
      });
    } catch (error) {
      console.error('Database snapshot failed:', error);
      res.status(500).json({ error: 'Failed to generate verified PostgreSQL snapshot' });
    }
  }
);

// Global error handler
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

import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  activityLogs,
  adminRoles,
  blogPosts,
  clients,
  contactMessages,
  mediaAssets,
  navigationItems,
  navigationMenus,
  pages,
  pageTranslations,
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
  testimonials,
  users,
  websiteSettings,
} from './schema.ts';
import { ensureSeeded } from './seed.ts';

export type Locale = 'en' | 'ar';

function sanitizeDbError(context: string, error: unknown): Error {
  console.error(`Database query failed [${context}]:`, error);
  return new Error('Database operation failed. Please try again shortly.', { cause: error });
}

export async function getPublicBootstrap(locale: Locale) {
  try {
    await ensureSeeded();

    const [
      settingsRows,
      menusRows,
      menuItemsRows,
      socialRows,
      pageRows,
      pageTransRows,
      serviceRows,
      serviceTransRows,
      partnerRows,
      partnerTransRows,
      categoryRows,
      productRows,
      productTransRows,
      projectRows,
      projectTransRows,
      clientRows,
      testimonialRows,
      blogRows,
      seoRows,
    ] = await Promise.all([
      db.select().from(websiteSettings).limit(1),
      db.select().from(navigationMenus),
      db.select().from(navigationItems).where(eq(navigationItems.isVisible, true)).orderBy(asc(navigationItems.sortOrder)),
      db.select().from(socialLinks).where(eq(socialLinks.isVisible, true)).orderBy(asc(socialLinks.sortOrder)),
      db.select().from(pages).where(eq(pages.isPublished, true)).orderBy(asc(pages.sortOrder)),
      db.select().from(pageTranslations).where(eq(pageTranslations.locale, locale)),
      db.select().from(services).where(eq(services.isPublished, true)).orderBy(asc(services.sortOrder)),
      db.select().from(serviceTranslations).where(eq(serviceTranslations.locale, locale)),
      db.select().from(partners).where(eq(partners.isPublished, true)).orderBy(asc(partners.sortOrder)),
      db.select().from(partnerTranslations).where(eq(partnerTranslations.locale, locale)),
      db.select().from(productCategories).orderBy(asc(productCategories.sortOrder)),
      db.select().from(products).where(eq(products.isPublished, true)).orderBy(asc(products.sortOrder)),
      db.select().from(productTranslations).where(eq(productTranslations.locale, locale)),
      db.select().from(projects).where(eq(projects.isPublished, true)).orderBy(desc(projects.isFeatured), asc(projects.id)),
      db.select().from(projectTranslations).where(eq(projectTranslations.locale, locale)),
      db.select().from(clients).orderBy(asc(clients.sortOrder)),
      db.select().from(testimonials).where(eq(testimonials.isPublished, true)),
      db.select().from(blogPosts).where(eq(blogPosts.isPublished, true)).orderBy(desc(blogPosts.publishedAt)),
      db.select().from(seoMetadata).where(eq(seoMetadata.locale, locale)),
    ]);

    const menusByLocation: Record<string, typeof menuItemsRows> = {};
    for (const m of menusRows) {
      menusByLocation[m.location] = menuItemsRows.filter((item) => item.menuId === m.id);
    }

    const localizedPages = pageRows.map((p) => {
      const tr = pageTransRows.find((t) => t.pageId === p.id);
      return { ...p, translation: tr || null };
    });

    const localizedServices = serviceRows.map((s) => {
      const tr = serviceTransRows.find((t) => t.serviceId === s.id);
      return { ...s, translation: tr || null };
    });

    const localizedPartners = partnerRows.map((pt) => {
      const tr = partnerTransRows.find((t) => t.partnerId === pt.id);
      return { ...pt, translation: tr || null };
    });

    const localizedProducts = productRows.map((pr) => {
      const tr = productTransRows.find((t) => t.productId === pr.id);
      return { ...pr, translation: tr || null };
    });

    const localizedProjects = projectRows.map((prj) => {
      const tr = projectTransRows.find((t) => t.projectId === prj.id);
      return { ...prj, translation: tr || null };
    });

    return {
      locale,
      settings: settingsRows[0] || null,
      menus: menusByLocation,
      socialLinks: socialRows,
      pages: localizedPages,
      services: localizedServices,
      partners: localizedPartners,
      categories: categoryRows,
      products: localizedProducts,
      projects: localizedProjects,
      clients: clientRows,
      testimonials: testimonialRows,
      blogPosts: blogRows,
      seo: seoRows,
    };
  } catch (error) {
    throw sanitizeDbError('getPublicBootstrap', error);
  }
}

export async function getSitemapEntities() {
  try {
    await ensureSeeded();
    const [pageRows, productRows, partnerRows, projectRows, blogRows] = await Promise.all([
      db.select({ slug: pages.slug, updatedAt: pages.updatedAt }).from(pages).where(eq(pages.isPublished, true)),
      db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.isPublished, true)),
      db.select({ slug: partners.slug, updatedAt: partners.updatedAt }).from(partners).where(eq(partners.isPublished, true)),
      db.select({ slug: projects.slug, updatedAt: projects.updatedAt }).from(projects).where(eq(projects.isPublished, true)),
      db.select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt }).from(blogPosts).where(eq(blogPosts.isPublished, true)),
    ]);
    return { pageRows, productRows, partnerRows, projectRows, blogRows };
  } catch (error) {
    throw sanitizeDbError('getSitemapEntities', error);
  }
}

export async function createContactMessage(input: {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  locale: string;
}) {
  try {
    const [created] = await db
      .insert(contactMessages)
      .values({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        company: input.company,
        subject: input.subject,
        message: input.message,
        locale: input.locale,
        status: 'new',
      })
      .returning();
    return created;
  } catch (error) {
    throw sanitizeDbError('createContactMessage', error);
  }
}

export async function createMediaAsset(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  dataBase64: string;
  altEn?: string;
  altAr?: string;
  folder?: string;
  uploadedByUserId?: number | null;
}) {
  try {
    const [inserted] = await db
      .insert(mediaAssets)
      .values({
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        url: '',
        dataBase64: input.dataBase64,
        altEn: input.altEn || input.filename,
        altAr: input.altAr || input.filename,
        folder: input.folder || 'general',
        uploadedByUserId: input.uploadedByUserId ?? null,
      })
      .returning();

    const finalUrl = `/api/media/${inserted.id}`;
    const [updated] = await db
      .update(mediaAssets)
      .set({ url: finalUrl })
      .where(eq(mediaAssets.id, inserted.id))
      .returning({
        id: mediaAssets.id,
        filename: mediaAssets.filename,
        mimeType: mediaAssets.mimeType,
        sizeBytes: mediaAssets.sizeBytes,
        url: mediaAssets.url,
        altEn: mediaAssets.altEn,
        altAr: mediaAssets.altAr,
        folder: mediaAssets.folder,
        createdAt: mediaAssets.createdAt,
      });

    return updated;
  } catch (error) {
    throw sanitizeDbError('createMediaAsset', error);
  }
}

export async function getMediaAssetById(id: number) {
  try {
    const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
    return rows[0] || null;
  } catch (error) {
    throw sanitizeDbError('getMediaAssetById', error);
  }
}

export async function createQuoteRequest(input: {
  fullName: string;
  companyName: string;
  businessEmail: string;
  phone: string;
  productOrService: string;
  productId?: number | null;
  estimatedQuantity: string;
  projectDescription: string;
  preferredContactMethod: string;
  attachmentAssetId?: number | null;
  attachmentName?: string;
  locale: string;
}) {
  try {
    const [created] = await db
      .insert(quoteRequests)
      .values({
        fullName: input.fullName,
        companyName: input.companyName,
        businessEmail: input.businessEmail,
        phone: input.phone,
        productOrService: input.productOrService,
        productId: input.productId ?? null,
        estimatedQuantity: input.estimatedQuantity,
        projectDescription: input.projectDescription,
        preferredContactMethod: input.preferredContactMethod,
        attachmentAssetId: input.attachmentAssetId ?? null,
        attachmentName: input.attachmentName || '',
        locale: input.locale,
        status: 'new',
      })
      .returning();
    return created;
  } catch (error) {
    throw sanitizeDbError('createQuoteRequest', error);
  }
}

export async function logActivity(input: {
  userId?: number | null;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await db.insert(activityLogs).values({
      userId: input.userId ?? null,
      userEmail: input.userEmail || 'system',
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || '',
      details: input.details || '',
      ipAddress: input.ipAddress || '',
    });
  } catch (error) {
    console.error('Activity log insert failed:', error);
  }
}

export async function getAdminOverviewData() {
  try {
    await ensureSeeded();
    const [
      settingsRows,
      allPages,
      allPageTrans,
      allServices,
      allServiceTrans,
      allPartners,
      allPartnerTrans,
      allCategories,
      allProducts,
      allProductTrans,
      allProjects,
      allProjectTrans,
      allBlogPosts,
      allMenus,
      allMenuItems,
      allSocials,
      allSeo,
      allContacts,
      allQuotes,
      allMedia,
      allLogs,
      allUsers,
      allRoles,
    ] = await Promise.all([
      db.select().from(websiteSettings).limit(1),
      db.select().from(pages).orderBy(asc(pages.sortOrder)),
      db.select().from(pageTranslations),
      db.select().from(services).orderBy(asc(services.sortOrder)),
      db.select().from(serviceTranslations),
      db.select().from(partners).orderBy(asc(partners.sortOrder)),
      db.select().from(partnerTranslations),
      db.select().from(productCategories).orderBy(asc(productCategories.sortOrder)),
      db.select().from(products).orderBy(asc(products.sortOrder)),
      db.select().from(productTranslations),
      db.select().from(projects).orderBy(asc(projects.id)),
      db.select().from(projectTranslations),
      db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt)),
      db.select().from(navigationMenus),
      db.select().from(navigationItems).orderBy(asc(navigationItems.sortOrder)),
      db.select().from(socialLinks).orderBy(asc(socialLinks.sortOrder)),
      db.select().from(seoMetadata).orderBy(asc(seoMetadata.routeKey), asc(seoMetadata.locale)),
      db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)),
      db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt)),
      db
        .select({
          id: mediaAssets.id,
          filename: mediaAssets.filename,
          mimeType: mediaAssets.mimeType,
          sizeBytes: mediaAssets.sizeBytes,
          url: mediaAssets.url,
          altEn: mediaAssets.altEn,
          altAr: mediaAssets.altAr,
          folder: mediaAssets.folder,
          createdAt: mediaAssets.createdAt,
        })
        .from(mediaAssets)
        .orderBy(desc(mediaAssets.createdAt)),
      db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(100),
      db
        .select({
          id: users.id,
          uid: users.uid,
          email: users.email,
          displayName: users.displayName,
          roleId: users.roleId,
          isActive: users.isActive,
          lastLoginAt: users.lastLoginAt,
        })
        .from(users)
        .orderBy(asc(users.id)),
      db.select().from(adminRoles).orderBy(asc(adminRoles.id)),
    ]);

    return {
      settings: settingsRows[0] || null,
      pages: allPages.map((p) => ({
        ...p,
        en: allPageTrans.find((t) => t.pageId === p.id && t.locale === 'en') || null,
        ar: allPageTrans.find((t) => t.pageId === p.id && t.locale === 'ar') || null,
      })),
      services: allServices.map((s) => ({
        ...s,
        en: allServiceTrans.find((t) => t.serviceId === s.id && t.locale === 'en') || null,
        ar: allServiceTrans.find((t) => t.serviceId === s.id && t.locale === 'ar') || null,
      })),
      partners: allPartners.map((pt) => ({
        ...pt,
        en: allPartnerTrans.find((t) => t.partnerId === pt.id && t.locale === 'en') || null,
        ar: allPartnerTrans.find((t) => t.partnerId === pt.id && t.locale === 'ar') || null,
      })),
      categories: allCategories,
      products: allProducts.map((pr) => ({
        ...pr,
        en: allProductTrans.find((t) => t.productId === pr.id && t.locale === 'en') || null,
        ar: allProductTrans.find((t) => t.productId === pr.id && t.locale === 'ar') || null,
      })),
      projects: allProjects.map((prj) => ({
        ...prj,
        en: allProjectTrans.find((t) => t.projectId === prj.id && t.locale === 'en') || null,
        ar: allProjectTrans.find((t) => t.projectId === prj.id && t.locale === 'ar') || null,
      })),
      blogPosts: allBlogPosts,
      menus: allMenus.map((m) => ({
        ...m,
        items: allMenuItems.filter((i) => i.menuId === m.id),
      })),
      socialLinks: allSocials,
      seoMetadata: allSeo,
      contactMessages: allContacts,
      quoteRequests: allQuotes,
      mediaAssets: allMedia,
      activityLogs: allLogs,
      users: allUsers,
      roles: allRoles,
    };
  } catch (error) {
    throw sanitizeDbError('getAdminOverviewData', error);
  }
}

export async function upsertPageTranslation(
  pageId: number,
  locale: Locale,
  data: {
    title: string;
    heroHeading: string;
    heroSubheading: string;
    heroCtaText: string;
    heroCtaUrl: string;
    introBannerText: string;
    introBannerCtaText: string;
    bodyContent: string;
  }
) {
  try {
    const existing = await db
      .select()
      .from(pageTranslations)
      .where(and(eq(pageTranslations.pageId, pageId), eq(pageTranslations.locale, locale)))
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(pageTranslations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(pageTranslations.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(pageTranslations)
      .values({ pageId, locale, ...data })
      .returning();
    return created;
  } catch (error) {
    throw sanitizeDbError('upsertPageTranslation', error);
  }
}

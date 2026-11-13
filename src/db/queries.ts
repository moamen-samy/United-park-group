import crypto from 'crypto';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  activityLogs,
  adminRoles,
  banners,
  blogPosts,
  clients,
  contactMessages,
  homepageSections,
  mediaAssets,
  mediaFolders,
  navigationItems,
  navigationMenus,
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
    const now = new Date();

    const [
      settingsRows,
      menusRows,
      menuItemsRows,
      socialRows,
      pageRows,
      pageTransRows,
      pageSectionRows,
      sectorRows,
      sectorTransRows,
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
      bannerRows,
      homepageSectionRows,
      blogRows,
      seoRows,
      redirectRows,
    ] = await Promise.all([
      db.select().from(websiteSettings).limit(1),
      db.select().from(navigationMenus),
      db
        .select()
        .from(navigationItems)
        .where(eq(navigationItems.isVisible, true))
        .orderBy(asc(navigationItems.sortOrder)),
      db
        .select()
        .from(socialLinks)
        .where(eq(socialLinks.isVisible, true))
        .orderBy(asc(socialLinks.sortOrder)),
      db.select().from(pages).where(eq(pages.isPublished, true)).orderBy(asc(pages.sortOrder)),
      db.select().from(pageTranslations).where(eq(pageTranslations.locale, locale)),
      db
        .select()
        .from(pageSections)
        .where(eq(pageSections.isVisible, true))
        .orderBy(asc(pageSections.sortOrder)),
      db.select().from(sectors).where(eq(sectors.isPublished, true)).orderBy(asc(sectors.sortOrder)),
      db.select().from(sectorTranslations).where(eq(sectorTranslations.locale, locale)),
      db
        .select()
        .from(services)
        .where(eq(services.isPublished, true))
        .orderBy(asc(services.sortOrder)),
      db.select().from(serviceTranslations).where(eq(serviceTranslations.locale, locale)),
      db
        .select()
        .from(partners)
        .where(eq(partners.isPublished, true))
        .orderBy(asc(partners.sortOrder)),
      db.select().from(partnerTranslations).where(eq(partnerTranslations.locale, locale)),
      db.select().from(productCategories).orderBy(asc(productCategories.sortOrder)),
      db
        .select()
        .from(products)
        .where(and(eq(products.isPublished, true), eq(products.status, 'published')))
        .orderBy(asc(products.sortOrder)),
      db.select().from(productTranslations).where(eq(productTranslations.locale, locale)),
      db
        .select()
        .from(projects)
        .where(eq(projects.isPublished, true))
        .orderBy(desc(projects.isFeatured), asc(projects.id)),
      db.select().from(projectTranslations).where(eq(projectTranslations.locale, locale)),
      db.select().from(clients).orderBy(asc(clients.sortOrder)),
      db.select().from(testimonials).where(eq(testimonials.isPublished, true)),
      db.select().from(banners).where(eq(banners.isPublished, true)).orderBy(asc(banners.sortOrder)),
      db.select().from(homepageSections).orderBy(asc(homepageSections.sortOrder)),
      db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.isPublished, true))
        .orderBy(desc(blogPosts.publishedAt)),
      db.select().from(seoMetadata).where(eq(seoMetadata.locale, locale)),
      db.select().from(redirects).where(eq(redirects.isActive, true)),
    ]);

    const menusByLocation: Record<string, typeof menuItemsRows> = {};
    for (const m of menusRows) {
      menusByLocation[m.location] = menuItemsRows.filter((item) => item.menuId === m.id);
    }

    const activePages = pageRows.filter((p) => {
      if (!p.isVisible || p.status !== 'published') return false;
      if (p.scheduledAt && new Date(p.scheduledAt) > now) return false;
      return true;
    });

    const localizedPages = activePages.map((p) => {
      const tr = pageTransRows.find((t) => t.pageId === p.id);
      const secs = pageSectionRows.filter((s) => s.pageId === p.id);
      return { ...p, translation: tr || null, sections: secs };
    });

    const localizedSectors = sectorRows.map((sec) => {
      const tr = sectorTransRows.find((t) => t.sectorId === sec.id);
      return { ...sec, translation: tr || null };
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

    const activeBanners = bannerRows.filter((b) => {
      if (b.startsAt && new Date(b.startsAt) > now) return false;
      if (b.endsAt && new Date(b.endsAt) < now) return false;
      return true;
    });

    return {
      locale,
      settings: settingsRows[0] || null,
      menus: menusByLocation,
      socialLinks: socialRows,
      pages: localizedPages,
      sectors: localizedSectors,
      services: localizedServices,
      partners: localizedPartners,
      categories: categoryRows,
      products: localizedProducts,
      projects: localizedProjects,
      clients: clientRows,
      testimonials: testimonialRows,
      banners: activeBanners,
      homepageSections: homepageSectionRows,
      blogPosts: blogRows,
      seo: seoRows,
      redirects: redirectRows,
    };
  } catch (error) {
    throw sanitizeDbError('getPublicBootstrap', error);
  }
}

export async function getPublicSettings() {
  await ensureSeeded();
  const rows = await db.select().from(websiteSettings).limit(1);
  return rows[0] || null;
}

export async function getSitemapEntities() {
  try {
    await ensureSeeded();
    const [pageRows, productRows, partnerRows, projectRows, blogRows, sectorRows] = await Promise.all([
      db
        .select({ slug: pages.slug, updatedAt: pages.updatedAt })
        .from(pages)
        .where(and(eq(pages.isPublished, true), eq(pages.isVisible, true))),
      db
        .select({ slug: products.slug, updatedAt: products.updatedAt })
        .from(products)
        .where(and(eq(products.isPublished, true), eq(products.status, 'published'))),
      db
        .select({ slug: partners.slug, updatedAt: partners.updatedAt })
        .from(partners)
        .where(eq(partners.isPublished, true)),
      db
        .select({ slug: projects.slug, updatedAt: projects.updatedAt })
        .from(projects)
        .where(eq(projects.isPublished, true)),
      db
        .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
        .from(blogPosts)
        .where(eq(blogPosts.isPublished, true)),
      db
        .select({ routePath: sectors.routePath, updatedAt: sectors.updatedAt })
        .from(sectors)
        .where(eq(sectors.isPublished, true)),
    ]);
    return { pageRows, productRows, partnerRows, projectRows, blogRows, sectorRows };
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
  width?: number;
  height?: number;
  dataBase64: string;
  storageProvider?: string;
  storagePath?: string;
  externalUrl?: string;
  titleEn?: string;
  titleAr?: string;
  altEn?: string;
  altAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
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
        width: input.width ?? 0,
        height: input.height ?? 0,
        url: input.externalUrl || '',
        dataBase64: input.dataBase64,
        storageProvider: input.storageProvider || 'postgresql',
        storagePath: input.storagePath || '',
        titleEn: input.titleEn || input.filename,
        titleAr: input.titleAr || input.filename,
        altEn: input.altEn || input.filename,
        altAr: input.altAr || input.filename,
        descriptionEn: input.descriptionEn || '',
        descriptionAr: input.descriptionAr || '',
        folder: input.folder || 'general',
        uploadedByUserId: input.uploadedByUserId ?? null,
      })
      .returning();

    const finalUrl = input.externalUrl || `/api/media/${inserted.id}`;
    const [updated] = await db
      .update(mediaAssets)
      .set({ url: finalUrl })
      .where(eq(mediaAssets.id, inserted.id))
      .returning({
        id: mediaAssets.id,
        filename: mediaAssets.filename,
        mimeType: mediaAssets.mimeType,
        sizeBytes: mediaAssets.sizeBytes,
        width: mediaAssets.width,
        height: mediaAssets.height,
        url: mediaAssets.url,
        storageProvider: mediaAssets.storageProvider,
        storagePath: mediaAssets.storagePath,
        titleEn: mediaAssets.titleEn,
        titleAr: mediaAssets.titleAr,
        altEn: mediaAssets.altEn,
        altAr: mediaAssets.altAr,
        descriptionEn: mediaAssets.descriptionEn,
        descriptionAr: mediaAssets.descriptionAr,
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

export async function getDatabaseHealthDiagnostics() {
  try {
    const versionRes = await db.execute(sql`SELECT version() AS version, pg_database_size(current_database())::bigint AS size_bytes, current_database() AS db_name`);
    const tableCountsRes = await db.execute(sql`
      SELECT relname AS table_name, n_live_tup::int AS approx_rows
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY relname ASC
    `);

    const vRow = (versionRes.rows?.[0] || {}) as Record<string, unknown>;
    return {
      databaseName: String(vRow.db_name || ''),
      postgresVersion: String(vRow.version || '').split(',')[0],
      sizeBytes: Number(vRow.size_bytes || 0),
      tables: (tableCountsRes.rows || []).map((r) => ({
        tableName: String((r as Record<string, unknown>).table_name || ''),
        rowCount: Number((r as Record<string, unknown>).approx_rows || 0),
      })),
    };
  } catch (error) {
    throw sanitizeDbError('getDatabaseHealthDiagnostics', error);
  }
}

export async function createLogicalSnapshotPayload(userId?: number | null, userEmail?: string) {
  await ensureSeeded();
  const [
    settingsData,
    pagesData,
    pageTransData,
    pageSecData,
    sectorsData,
    sectorTransData,
    servicesData,
    serviceTransData,
    partnersData,
    partnerTransData,
    categoriesData,
    productsData,
    productTransData,
    priceHistoryData,
    clientsData,
    projectsData,
    projectTransData,
    testimonialsData,
    bannersData,
    homepageSecsData,
    menusData,
    menuItemsData,
    socialData,
    seoData,
    redirectsData,
    blogData,
    contactsData,
    quotesData,
    mediaMetaData,
    rolesData,
    usersData,
  ] = await Promise.all([
    db.select().from(websiteSettings),
    db.select().from(pages),
    db.select().from(pageTranslations),
    db.select().from(pageSections),
    db.select().from(sectors),
    db.select().from(sectorTranslations),
    db.select().from(services),
    db.select().from(serviceTranslations),
    db.select().from(partners),
    db.select().from(partnerTranslations),
    db.select().from(productCategories),
    db.select().from(products),
    db.select().from(productTranslations),
    db.select().from(productPriceHistory),
    db.select().from(clients),
    db.select().from(projects),
    db.select().from(projectTranslations),
    db.select().from(testimonials),
    db.select().from(banners),
    db.select().from(homepageSections),
    db.select().from(navigationMenus),
    db.select().from(navigationItems),
    db.select().from(socialLinks),
    db.select().from(seoMetadata),
    db.select().from(redirects),
    db.select().from(blogPosts),
    db.select().from(contactMessages),
    db.select().from(quoteRequests),
    db
      .select({
        id: mediaAssets.id,
        filename: mediaAssets.filename,
        mimeType: mediaAssets.mimeType,
        sizeBytes: mediaAssets.sizeBytes,
        url: mediaAssets.url,
        folder: mediaAssets.folder,
        storageProvider: mediaAssets.storageProvider,
        storagePath: mediaAssets.storagePath,
        altEn: mediaAssets.altEn,
        altAr: mediaAssets.altAr,
        createdAt: mediaAssets.createdAt,
      })
      .from(mediaAssets),
    db.select().from(adminRoles),
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        roleId: users.roleId,
        isActive: users.isActive,
      })
      .from(users),
  ]);

  const tablesMap = {
    websiteSettings: settingsData,
    pages: pagesData,
    pageTranslations: pageTransData,
    pageSections: pageSecData,
    sectors: sectorsData,
    sectorTranslations: sectorTransData,
    services: servicesData,
    serviceTranslations: serviceTransData,
    partners: partnersData,
    partnerTranslations: partnerTransData,
    productCategories: categoriesData,
    products: productsData,
    productTranslations: productTransData,
    productPriceHistory: priceHistoryData,
    clients: clientsData,
    projects: projectsData,
    projectTranslations: projectTransData,
    testimonials: testimonialsData,
    banners: bannersData,
    homepageSections: homepageSecsData,
    navigationMenus: menusData,
    navigationItems: menuItemsData,
    socialLinks: socialData,
    seoMetadata: seoData,
    redirects: redirectsData,
    blogPosts: blogData,
    contactMessages: contactsData,
    quoteRequests: quotesData,
    mediaAssetsMetadata: mediaMetaData,
    adminRoles: rolesData,
    users: usersData,
  };

  const totalRows = Object.values(tablesMap).reduce((sum, arr) => sum + arr.length, 0);
  const tableCount = Object.keys(tablesMap).length;
  const payload = {
    format: 'upg-postgresql-logical-snapshot-v1',
    exportedAt: new Date().toISOString(),
    exportedBy: userEmail || 'system',
    tableCount,
    totalRows,
    tables: tablesMap,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');
  const checksumSha256 = crypto.createHash('sha256').update(jsonStr).digest('hex');
  const fileName = `upg-cms-snapshot-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

  const [record] = await db
    .insert(systemBackups)
    .values({
      backupType: 'logical_json',
      fileName,
      sizeBytes,
      tableCount,
      totalRows,
      checksumSha256,
      createdByUserId: userId ?? null,
      createdByEmail: userEmail || 'system',
      status: 'completed',
      notes: 'Verified logical JSON snapshot exported from Cloud SQL PostgreSQL',
    })
    .returning();

  return { fileName, jsonStr, record };
}

export async function getAdminOverviewData() {
  try {
    await ensureSeeded();
    const [
      settingsRows,
      allPages,
      allPageTrans,
      allPageSections,
      allSectors,
      allSectorTrans,
      allServices,
      allServiceTrans,
      allPartners,
      allPartnerTrans,
      allCategories,
      allProducts,
      allProductTrans,
      allPriceHistory,
      allProjects,
      allProjectTrans,
      allTestimonials,
      allBlogPosts,
      allBanners,
      allHomepageSections,
      allMenus,
      allMenuItems,
      allSocials,
      allSeo,
      allRedirects,
      allContacts,
      allQuotes,
      allMediaFolders,
      allMedia,
      allLogs,
      allBackups,
      allUsers,
      allRoles,
      dbHealth,
    ] = await Promise.all([
      db.select().from(websiteSettings).limit(1),
      db.select().from(pages).orderBy(asc(pages.sortOrder)),
      db.select().from(pageTranslations),
      db.select().from(pageSections).orderBy(asc(pageSections.sortOrder)),
      db.select().from(sectors).orderBy(asc(sectors.sortOrder)),
      db.select().from(sectorTranslations),
      db.select().from(services).orderBy(asc(services.sortOrder)),
      db.select().from(serviceTranslations),
      db.select().from(partners).orderBy(asc(partners.sortOrder)),
      db.select().from(partnerTranslations),
      db.select().from(productCategories).orderBy(asc(productCategories.sortOrder)),
      db.select().from(products).orderBy(asc(products.sortOrder)),
      db.select().from(productTranslations),
      db.select().from(productPriceHistory).orderBy(desc(productPriceHistory.createdAt)).limit(200),
      db.select().from(projects).orderBy(asc(projects.id)),
      db.select().from(projectTranslations),
      db.select().from(testimonials).orderBy(asc(testimonials.id)),
      db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt)),
      db.select().from(banners).orderBy(asc(banners.sortOrder)),
      db.select().from(homepageSections).orderBy(asc(homepageSections.sortOrder)),
      db.select().from(navigationMenus),
      db.select().from(navigationItems).orderBy(asc(navigationItems.sortOrder)),
      db.select().from(socialLinks).orderBy(asc(socialLinks.sortOrder)),
      db.select().from(seoMetadata).orderBy(asc(seoMetadata.routeKey), asc(seoMetadata.locale)),
      db.select().from(redirects).orderBy(desc(redirects.id)),
      db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)),
      db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt)),
      db.select().from(mediaFolders).orderBy(asc(mediaFolders.name)),
      db
        .select({
          id: mediaAssets.id,
          filename: mediaAssets.filename,
          mimeType: mediaAssets.mimeType,
          sizeBytes: mediaAssets.sizeBytes,
          width: mediaAssets.width,
          height: mediaAssets.height,
          url: mediaAssets.url,
          storageProvider: mediaAssets.storageProvider,
          storagePath: mediaAssets.storagePath,
          titleEn: mediaAssets.titleEn,
          titleAr: mediaAssets.titleAr,
          altEn: mediaAssets.altEn,
          altAr: mediaAssets.altAr,
          descriptionEn: mediaAssets.descriptionEn,
          descriptionAr: mediaAssets.descriptionAr,
          folder: mediaAssets.folder,
          createdAt: mediaAssets.createdAt,
        })
        .from(mediaAssets)
        .orderBy(desc(mediaAssets.createdAt)),
      db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(150),
      db.select().from(systemBackups).orderBy(desc(systemBackups.createdAt)).limit(30),
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
      getDatabaseHealthDiagnostics(),
    ]);

    return {
      settings: settingsRows[0] || null,
      pages: allPages.map((p) => ({
        ...p,
        en: allPageTrans.find((t) => t.pageId === p.id && t.locale === 'en') || null,
        ar: allPageTrans.find((t) => t.pageId === p.id && t.locale === 'ar') || null,
        sections: allPageSections.filter((s) => s.pageId === p.id),
      })),
      sectors: allSectors.map((sec) => ({
        ...sec,
        en: allSectorTrans.find((t) => t.sectorId === sec.id && t.locale === 'en') || null,
        ar: allSectorTrans.find((t) => t.sectorId === sec.id && t.locale === 'ar') || null,
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
        priceHistory: allPriceHistory.filter((h) => h.productId === pr.id),
      })),
      projects: allProjects.map((prj) => ({
        ...prj,
        en: allProjectTrans.find((t) => t.projectId === prj.id && t.locale === 'en') || null,
        ar: allProjectTrans.find((t) => t.projectId === prj.id && t.locale === 'ar') || null,
      })),
      testimonials: allTestimonials,
      blogPosts: allBlogPosts,
      banners: allBanners,
      homepageSections: allHomepageSections,
      menus: allMenus.map((m) => ({
        ...m,
        items: allMenuItems.filter((i) => i.menuId === m.id),
      })),
      socialLinks: allSocials,
      seoMetadata: allSeo,
      redirects: allRedirects,
      contactMessages: allContacts,
      quoteRequests: allQuotes,
      mediaFolders: allMediaFolders,
      mediaAssets: allMedia,
      activityLogs: allLogs,
      systemBackups: allBackups,
      users: allUsers,
      roles: allRoles,
      dbHealth,
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

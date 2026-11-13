import type { AdminOverviewPayload } from '../components/admin/AdminTypes';
import type {
  Locale,
  NavigationItem,
  PageTranslation,
  PublicBootstrapData,
  SocialLinkItem,
} from '../types/cms';
import { INITIAL_STATIC_CMS_DATA, STATIC_CLIENTS } from './staticCorporateData';

const STORAGE_KEY = 'upg_static_cms_v2';

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val)) as T;
}

function loadStore(): AdminOverviewPayload {
  if (typeof window === 'undefined') {
    return deepClone(INITIAL_STATIC_CMS_DATA);
  }
  try {
    if (window.localStorage.getItem('upg_static_cms_v1')) {
      window.localStorage.removeItem('upg_static_cms_v1');
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return deepClone(INITIAL_STATIC_CMS_DATA);
    }
    const parsed = JSON.parse(raw) as Partial<AdminOverviewPayload>;
    if (!parsed || !Array.isArray(parsed.sectors) || !Array.isArray(parsed.products)) {
      return deepClone(INITIAL_STATIC_CMS_DATA);
    }
    return {
      ...deepClone(INITIAL_STATIC_CMS_DATA),
      ...parsed,
    };
  } catch {
    return deepClone(INITIAL_STATIC_CMS_DATA);
  }
}

function saveStore(state: AdminOverviewPayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

function nextId(items: Array<{ id: number }>): number {
  return items.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function getPublicBootstrap(locale: Locale): PublicBootstrapData {
  const store = loadStore();
  const isAr = locale === 'ar';

  const menusMap: Record<string, NavigationItem[]> = {};
  for (const menu of store.menus) {
    menusMap[menu.location] = menu.items
      .filter((item) => item.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.id,
        menuId: item.menuId,
        parentId: null,
        url: item.url,
        labelEn: item.labelEn,
        labelAr: item.labelAr,
        sortOrder: item.sortOrder,
        isVisible: item.isVisible,
      }));
  }

  const socialLinks: SocialLinkItem[] = store.socialLinks
    .filter((s) => s.isVisible)
    .map((s, idx) => ({
      id: s.id,
      platform: s.platform,
      label: s.label,
      url: s.url,
      iconName: s.platform,
      sortOrder: idx + 1,
      isVisible: s.isVisible,
    }));

  const pages = store.pages
    .filter((p) => p.isPublished && p.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      const tr = (isAr ? p.ar || p.en : p.en || p.ar) as PageTranslation | null;
      return {
        id: p.id,
        slug: p.slug,
        template: p.template,
        heroImageUrl: p.heroImageUrl,
        status: p.status,
        isVisible: p.isVisible,
        isPublished: p.isPublished,
        scheduledAt: p.scheduledAt,
        sortOrder: p.sortOrder,
        translation: tr
          ? {
              ...tr,
              locale,
            }
          : null,
        sections: p.sections || [],
      };
    });

  const sectors = store.sectors
    .filter((s) => s.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => {
      const tr = isAr ? s.ar || s.en : s.en || s.ar;
      return {
        id: s.id,
        slug: s.slug,
        routePath: s.routePath,
        iconName: s.iconName,
        imageUrl: s.imageUrl,
        accentColor: s.accentColor,
        sortOrder: s.sortOrder,
        isFeatured: s.isFeatured,
        isPublished: s.isPublished,
        translation: tr
          ? {
              id: s.id * 10 + (isAr ? 2 : 1),
              sectorId: s.id,
              locale,
              ...tr,
            }
          : null,
      };
    });

  const services = store.services
    .filter((s) => s.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => {
      const tr = isAr ? s.ar || s.en : s.en || s.ar;
      return {
        id: s.id,
        slug: s.slug,
        iconName: s.iconName,
        imageUrl: s.imageUrl,
        division: s.division,
        sortOrder: s.sortOrder,
        isFeatured: s.isFeatured,
        isPublished: s.isPublished,
        translation: tr
          ? {
              id: s.id * 10 + (isAr ? 2 : 1),
              serviceId: s.id,
              locale,
              ...tr,
            }
          : null,
      };
    });

  const partners = store.partners
    .filter((p) => p.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      const tr = isAr ? p.ar || p.en : p.en || p.ar;
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        logoUrl: p.logoUrl,
        websiteUrl: p.websiteUrl,
        country: p.country,
        categoryLabelEn: p.categoryLabelEn,
        categoryLabelAr: p.categoryLabelAr,
        sortOrder: p.sortOrder,
        isFeatured: p.isFeatured,
        isPublished: p.isPublished,
        translation: tr
          ? {
              id: p.id * 10 + (isAr ? 2 : 1),
              partnerId: p.id,
              locale,
              ...tr,
            }
          : null,
      };
    });

  const categories = [...store.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({ ...c }));

  const products = store.products
    .filter((p) => p.isPublished && p.status !== 'archived')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      const tr = isAr ? p.ar || p.en : p.en || p.ar;
      return {
        id: p.id,
        sku: p.sku,
        slug: p.slug,
        categoryId: p.categoryId,
        partnerId: p.partnerId,
        imageUrl: p.imageUrl,
        galleryImagesJson: p.galleryImagesJson || [],
        datasheetUrl: p.datasheetUrl,
        division: p.division,
        brand: p.brand,
        modelNumber: p.modelNumber,
        stockStatus: p.stockStatus,
        regularPrice: p.regularPrice,
        discountPrice: p.discountPrice,
        currency: p.currency,
        taxRate: p.taxRate,
        showPrice: p.showPrice,
        status: p.status,
        seoTitleEn: p.seoTitleEn,
        seoTitleAr: p.seoTitleAr,
        seoDescEn: p.seoDescEn,
        seoDescAr: p.seoDescAr,
        isFeatured: p.isFeatured,
        isPublished: p.isPublished,
        sortOrder: p.sortOrder,
        translation: tr
          ? {
              id: p.id * 10 + (isAr ? 2 : 1),
              productId: p.id,
              locale,
              ...tr,
            }
          : null,
      };
    });

  const projects = store.projects
    .filter((p) => p.isPublished)
    .map((p) => {
      const tr = isAr ? p.ar || p.en : p.en || p.ar;
      return {
        id: p.id,
        slug: p.slug,
        clientId: null,
        clientName: p.clientName,
        category: p.category,
        division: p.division,
        status: p.status,
        locationEn: p.locationEn,
        locationAr: p.locationAr,
        completionYear: p.completionYear,
        imageUrl: p.imageUrl,
        galleryImagesJson: p.galleryImagesJson || [],
        videoUrl: p.videoUrl,
        seoTitleEn: p.seoTitleEn,
        seoTitleAr: p.seoTitleAr,
        seoDescEn: p.seoDescEn,
        seoDescAr: p.seoDescAr,
        isFeatured: p.isFeatured,
        isPublished: p.isPublished,
        isPlaceholder: false,
        translation: tr
          ? {
              id: p.id * 10 + (isAr ? 2 : 1),
              projectId: p.id,
              locale,
              ...tr,
            }
          : null,
      };
    });

  return {
    locale,
    settings: store.settings ? { ...store.settings } : null,
    menus: menusMap,
    socialLinks,
    pages,
    sectors,
    services,
    partners,
    categories,
    products,
    projects,
    clients: STATIC_CLIENTS,
    testimonials: store.testimonials.filter((t) => t.isPublished),
    banners: store.banners
      .filter((b) => b.isPublished)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((b) => ({ ...b, startsAt: null, endsAt: null })),
    homepageSections: [...store.homepageSections].sort((a, b) => a.sortOrder - b.sortOrder),
    blogPosts: store.blogPosts
      .filter((bp) => bp.isPublished)
      .map((bp) => ({ ...bp, isPlaceholder: false })),
    seo: store.seoMetadata.filter((s) => s.locale === locale),
    redirects: store.redirects.filter((r) => r.isActive),
  };
}

export function recordRedirectHit(redirectId: number): void {
  const store = loadStore();
  const target = store.redirects.find((r) => r.id === redirectId);
  if (target) {
    target.hits += 1;
    saveStore(store);
  }
}

export function submitStaticContactMessage(input: {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  websiteTrap?: string;
}): { ok: boolean; id: number } {
  const store = loadStore();
  if (input.websiteTrap) {
    return { ok: true, id: 0 };
  }
  const id = nextId(store.contactMessages);
  store.contactMessages.unshift({
    id,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    company: input.company.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: 'new',
    adminNotes: '',
    assignedToUserId: null,
    createdAt: new Date().toISOString(),
  });
  saveStore(store);
  return { ok: true, id };
}

export function submitStaticQuoteRequest(input: {
  fullName: string;
  companyName: string;
  businessEmail: string;
  phone: string;
  productOrService: string;
  estimatedQuantity: string;
  projectDescription: string;
  preferredContactMethod: string;
  attachmentName?: string;
  websiteTrap?: string;
}): { ok: boolean; id: number } {
  const store = loadStore();
  if (input.websiteTrap) {
    return { ok: true, id: 0 };
  }
  const id = nextId(store.quoteRequests);
  store.quoteRequests.unshift({
    id,
    fullName: input.fullName.trim(),
    companyName: input.companyName.trim(),
    businessEmail: input.businessEmail.trim(),
    phone: input.phone.trim(),
    productOrService: input.productOrService.trim(),
    estimatedQuantity: input.estimatedQuantity.trim(),
    projectDescription: input.projectDescription.trim(),
    preferredContactMethod: input.preferredContactMethod,
    attachmentAssetId: null,
    attachmentName: input.attachmentName || '',
    status: 'new',
    adminNotes: '',
    assignedToUserId: null,
    createdAt: new Date().toISOString(),
  });
  saveStore(store);
  return { ok: true, id };
}

export function getClientAdminOverview(): AdminOverviewPayload {
  return loadStore();
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadClientMediaFiles(
  files: FileList,
  folder = 'general'
): Promise<{ ok: boolean; url: string }> {
  const store = loadStore();
  let lastUrl = '';
  for (const file of Array.from(files)) {
    const dataUrl = await fileToDataUrl(file);
    const id = nextId(store.mediaAssets);
    lastUrl = dataUrl;
    store.mediaAssets.unshift({
      id,
      filename: file.name,
      mimeType: file.type || 'image/jpeg',
      sizeBytes: file.size,
      width: 0,
      height: 0,
      url: dataUrl,
      storageProvider: 'browser-local',
      storagePath: file.name,
      titleEn: file.name,
      titleAr: file.name,
      altEn: file.name,
      altAr: file.name,
      descriptionEn: '',
      descriptionAr: '',
      folder,
      createdAt: new Date().toISOString(),
    });
  }
  saveStore(store);
  return { ok: true, url: lastUrl };
}

export async function replaceClientMediaFile(id: number, file: File): Promise<boolean> {
  const store = loadStore();
  const asset = store.mediaAssets.find((m) => m.id === id);
  if (!asset) return false;
  const dataUrl = await fileToDataUrl(file);
  asset.url = dataUrl;
  asset.filename = file.name;
  asset.mimeType = file.type || asset.mimeType;
  asset.sizeBytes = file.size;
  saveStore(store);
  return true;
}

export function exportClientLeadsCsv(type: 'quotes' | 'contacts'): Blob {
  const store = loadStore();
  const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  if (type === 'quotes') {
    const headers = ['ID', 'Full Name', 'Company', 'Email', 'Phone', 'Product/Service', 'Qty', 'Status', 'Created At'];
    const rows = store.quoteRequests.map((q) =>
      [q.id, q.fullName, q.companyName, q.businessEmail, q.phone, q.productOrService, q.estimatedQuantity, q.status, q.createdAt]
        .map((v) => escapeCsv(String(v)))
        .join(',')
    );
    return new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  }

  const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Company', 'Subject', 'Status', 'Created At'];
  const rows = store.contactMessages.map((c) =>
    [c.id, c.fullName, c.email, c.phone, c.company, c.subject, c.status, c.createdAt]
      .map((v) => escapeCsv(String(v)))
      .join(',')
  );
  return new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
}

export async function handleClientAdminRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const store = loadStore();
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : {};
  const now = new Date().toISOString();

  const logAction = (action: string, entityType: string, entityId: string, details: string) => {
    store.activityLogs.unshift({
      id: nextId(store.activityLogs),
      userEmail: 'admin@park.com.sa',
      action,
      entityType,
      entityId,
      details,
      ipAddress: 'client',
      createdAt: now,
    });
  };

  // Settings
  if (url === '/api/admin/settings' && method === 'PUT') {
    store.settings = { ...(store.settings || INITIAL_STATIC_CMS_DATA.settings!), ...body };
    logAction('update', 'settings', 'default', 'Updated website settings');
    saveStore(store);
    return jsonResponse({ ok: true, settings: store.settings });
  }

  // Pages
  if (url === '/api/admin/pages' && method === 'POST') {
    const id = nextId(store.pages);
    const newPage = {
      id,
      slug: body.slug || `page-${id}`,
      template: body.template || 'standard',
      heroImageUrl: body.heroImageUrl || '/images/hero-pumps.jpg',
      status: body.status || 'draft',
      isVisible: body.isVisible ?? true,
      isPublished: body.status === 'published' || Boolean(body.isPublished),
      scheduledAt: body.scheduledAt || null,
      sortOrder: body.sortOrder ?? id,
      updatedAt: now,
      sections: [],
      en: {
        id: id * 2 - 1,
        pageId: id,
        locale: 'en',
        title: body.titleEn || body.slug || 'New Page',
        heroHeading: body.titleEn || 'New Page',
        heroSubheading: '',
        heroCtaText: '',
        heroCtaUrl: '',
        introBannerText: '',
        introBannerCtaText: '',
        bodyContent: '',
        sectionsJson: {},
      },
      ar: {
        id: id * 2,
        pageId: id,
        locale: 'ar',
        title: body.titleAr || body.slug || 'صفحة جديدة',
        heroHeading: body.titleAr || 'صفحة جديدة',
        heroSubheading: '',
        heroCtaText: '',
        heroCtaUrl: '',
        introBannerText: '',
        introBannerCtaText: '',
        bodyContent: '',
        sectionsJson: {},
      },
    };
    store.pages.push(newPage);
    saveStore(store);
    return jsonResponse(newPage, 201);
  }

  const pageTrMatch = url.match(/^\/api\/admin\/pages\/(\d+)\/translations\/(en|ar)$/);
  if (pageTrMatch && method === 'PUT') {
    const id = Number(pageTrMatch[1]);
    const loc = pageTrMatch[2] as 'en' | 'ar';
    const page = store.pages.find((p) => p.id === id);
    if (!page) return jsonResponse({ error: 'Page not found' }, 404);
    page[loc] = { ...(page[loc] || {}), ...body, pageId: id, locale: loc };
    page.updatedAt = now;
    saveStore(store);
    return jsonResponse({ ok: true });
  }

  const pageSecCreateMatch = url.match(/^\/api\/admin\/pages\/(\d+)\/sections$/);
  if (pageSecCreateMatch && method === 'POST') {
    const pageId = Number(pageSecCreateMatch[1]);
    const page = store.pages.find((p) => p.id === pageId);
    if (!page) return jsonResponse({ error: 'Page not found' }, 404);
    const id = nextId(page.sections);
    page.sections.push({
      id,
      pageId,
      sectionType: body.sectionType || 'image_text',
      sortOrder: body.sortOrder ?? page.sections.length + 1,
      isVisible: body.isVisible ?? true,
      contentEnJson: body.contentEnJson || {},
      contentArJson: body.contentArJson || {},
      settingsJson: body.settingsJson || {},
    });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }

  const pageSecMatch = url.match(/^\/api\/admin\/page-sections\/(\d+)$/);
  if (pageSecMatch) {
    const secId = Number(pageSecMatch[1]);
    for (const p of store.pages) {
      const idx = p.sections.findIndex((s) => s.id === secId);
      if (idx !== -1) {
        if (method === 'PUT') p.sections[idx] = { ...p.sections[idx], ...body };
        if (method === 'DELETE') p.sections.splice(idx, 1);
        saveStore(store);
        return jsonResponse({ ok: true });
      }
    }
    return jsonResponse({ error: 'Section not found' }, 404);
  }

  const pageDupMatch = url.match(/^\/api\/admin\/pages\/(\d+)\/duplicate$/);
  if (pageDupMatch && method === 'POST') {
    const id = Number(pageDupMatch[1]);
    const orig = store.pages.find((p) => p.id === id);
    if (!orig) return jsonResponse({ error: 'Page not found' }, 404);
    const newId = nextId(store.pages);
    store.pages.push({
      ...deepClone(orig),
      id: newId,
      slug: `${orig.slug}-copy-${newId}`,
      status: 'draft',
      isPublished: false,
      updatedAt: now,
    });
    saveStore(store);
    return jsonResponse({ ok: true, id: newId }, 201);
  }

  const pageMatch = url.match(/^\/api\/admin\/pages\/(\d+)$/);
  if (pageMatch) {
    const id = Number(pageMatch[1]);
    const idx = store.pages.findIndex((p) => p.id === id);
    if (idx === -1) return jsonResponse({ error: 'Not found' }, 404);
    if (method === 'PUT') {
      store.pages[idx] = { ...store.pages[idx], ...body, updatedAt: now };
    } else if (method === 'DELETE') {
      store.pages.splice(idx, 1);
    }
    saveStore(store);
    return jsonResponse({ ok: true });
  }

  // Sectors
  if (url === '/api/admin/sectors' && method === 'POST') {
    const id = nextId(store.sectors);
    store.sectors.push({ ...body, id, updatedAt: now });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }
  const sectorMatch = url.match(/^\/api\/admin\/sectors\/(\d+)$/);
  if (sectorMatch) {
    const id = Number(sectorMatch[1]);
    const idx = store.sectors.findIndex((s) => s.id === id);
    if (idx !== -1) {
      if (method === 'PUT') store.sectors[idx] = { ...store.sectors[idx], ...body, updatedAt: now };
      if (method === 'DELETE') store.sectors.splice(idx, 1);
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  // Banners & Homepage Sections
  if (url === '/api/admin/banners' && method === 'POST') {
    const id = nextId(store.banners);
    store.banners.push({ ...body, id });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }
  const bannerMatch = url.match(/^\/api\/admin\/banners\/(\d+)$/);
  if (bannerMatch) {
    const id = Number(bannerMatch[1]);
    const idx = store.banners.findIndex((b) => b.id === id);
    if (idx !== -1) {
      if (method === 'PUT') store.banners[idx] = { ...store.banners[idx], ...body };
      if (method === 'DELETE') store.banners.splice(idx, 1);
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  const hpSecMatch = url.match(/^\/api\/admin\/homepage-sections\/(\d+)$/);
  if (hpSecMatch && method === 'PUT') {
    const id = Number(hpSecMatch[1]);
    const idx = store.homepageSections.findIndex((h) => h.id === id);
    if (idx !== -1) {
      store.homepageSections[idx] = { ...store.homepageSections[idx], ...body };
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  // Testimonials
  if (url === '/api/admin/testimonials' && method === 'POST') {
    const id = nextId(store.testimonials);
    store.testimonials.push({ ...body, id });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }
  const testMatch = url.match(/^\/api\/admin\/testimonials\/(\d+)$/);
  if (testMatch) {
    const id = Number(testMatch[1]);
    const idx = store.testimonials.findIndex((t) => t.id === id);
    if (idx !== -1) {
      if (method === 'PUT') store.testimonials[idx] = { ...store.testimonials[idx], ...body };
      if (method === 'DELETE') store.testimonials.splice(idx, 1);
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  // Services
  if (url === '/api/admin/services' && method === 'POST') {
    const id = nextId(store.services);
    store.services.push({ ...body, id, updatedAt: now });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }
  const serviceMatch = url.match(/^\/api\/admin\/services\/(\d+)$/);
  if (serviceMatch) {
    const id = Number(serviceMatch[1]);
    const idx = store.services.findIndex((s) => s.id === id);
    if (idx !== -1) {
      if (method === 'PUT') store.services[idx] = { ...store.services[idx], ...body, updatedAt: now };
      if (method === 'DELETE') store.services.splice(idx, 1);
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  // Blog
  if (url === '/api/admin/blog' && method === 'POST') {
    const id = nextId(store.blogPosts);
    store.blogPosts.unshift({ ...body, id, publishedAt: now, updatedAt: now });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }
  const blogMatch = url.match(/^\/api\/admin\/blog\/(\d+)$/);
  if (blogMatch) {
    const id = Number(blogMatch[1]);
    const idx = store.blogPosts.findIndex((b) => b.id === id);
    if (idx !== -1) {
      if (method === 'PUT') store.blogPosts[idx] = { ...store.blogPosts[idx], ...body, updatedAt: now };
      if (method === 'DELETE') store.blogPosts.splice(idx, 1);
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  // Products
  if (url === '/api/admin/products' && method === 'POST') {
    const id = nextId(store.products);
    store.products.push({ ...body, id, priceHistory: [], updatedAt: now });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }
  const prodMatch = url.match(/^\/api\/admin\/products\/(\d+)$/);
  if (prodMatch) {
    const id = Number(prodMatch[1]);
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      if (method === 'PUT') store.products[idx] = { ...store.products[idx], ...body, updatedAt: now };
      if (method === 'DELETE') store.products.splice(idx, 1);
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  // Categories
  if (url === '/api/admin/categories' && method === 'POST') {
    const id = nextId(store.categories);
    store.categories.push({ ...body, id });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }
  const catMatch = url.match(/^\/api\/admin\/categories\/(\d+)$/);
  if (catMatch) {
    const id = Number(catMatch[1]);
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      if (method === 'PUT') store.categories[idx] = { ...store.categories[idx], ...body };
      if (method === 'DELETE') store.categories.splice(idx, 1);
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  // Projects
  if (url === '/api/admin/projects' && method === 'POST') {
    const id = nextId(store.projects);
    store.projects.push({ ...body, id, updatedAt: now });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }
  const projMatch = url.match(/^\/api\/admin\/projects\/(\d+)$/);
  if (projMatch) {
    const id = Number(projMatch[1]);
    const idx = store.projects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      if (method === 'PUT') store.projects[idx] = { ...store.projects[idx], ...body, updatedAt: now };
      if (method === 'DELETE') store.projects.splice(idx, 1);
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  // Media folders & metadata
  if (url === '/api/admin/media-folders' && method === 'POST') {
    const id = nextId(store.mediaFolders);
    store.mediaFolders.push({ ...body, id });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }
  const mediaMatch = url.match(/^\/api\/admin\/media\/(\d+)$/);
  if (mediaMatch) {
    const id = Number(mediaMatch[1]);
    const idx = store.mediaAssets.findIndex((m) => m.id === id);
    if (idx !== -1) {
      if (method === 'PUT') store.mediaAssets[idx] = { ...store.mediaAssets[idx], ...body };
      if (method === 'DELETE') store.mediaAssets.splice(idx, 1);
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  // Quotes & Contacts
  const quoteMatch = url.match(/^\/api\/admin\/quotes\/(\d+)$/);
  if (quoteMatch && method === 'PUT') {
    const id = Number(quoteMatch[1]);
    const idx = store.quoteRequests.findIndex((q) => q.id === id);
    if (idx !== -1) {
      store.quoteRequests[idx] = { ...store.quoteRequests[idx], ...body };
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }
  const contactMatch = url.match(/^\/api\/admin\/contacts\/(\d+)$/);
  if (contactMatch && method === 'PUT') {
    const id = Number(contactMatch[1]);
    const idx = store.contactMessages.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.contactMessages[idx] = { ...store.contactMessages[idx], ...body };
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  // SEO & Redirects
  if (url === '/api/admin/seo' && method === 'PUT') {
    const idx = store.seoMetadata.findIndex(
      (s) => s.routeKey === body.routeKey && s.locale === body.locale
    );
    if (idx !== -1) {
      store.seoMetadata[idx] = { ...store.seoMetadata[idx], ...body };
    } else {
      store.seoMetadata.push({ ...body, id: nextId(store.seoMetadata) });
    }
    saveStore(store);
    return jsonResponse({ ok: true });
  }
  if (url === '/api/admin/redirects' && method === 'POST') {
    const id = nextId(store.redirects);
    store.redirects.push({ ...body, id, hits: 0 });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }
  const redirMatch = url.match(/^\/api\/admin\/redirects\/(\d+)$/);
  if (redirMatch && method === 'DELETE') {
    const id = Number(redirMatch[1]);
    store.redirects = store.redirects.filter((r) => r.id !== id);
    saveStore(store);
    return jsonResponse({ ok: true });
  }

  // Menu items & social links
  if (url === '/api/admin/menu-items' && method === 'POST') {
    const menu = store.menus.find((m) => m.id === Number(body.menuId)) || store.menus[0];
    if (menu) {
      const allItems = store.menus.flatMap((m) => m.items);
      menu.items.push({ ...body, id: nextId(allItems), menuId: menu.id });
      saveStore(store);
    }
    return jsonResponse({ ok: true }, 201);
  }
  const menuItemMatch = url.match(/^\/api\/admin\/menu-items\/(\d+)$/);
  if (menuItemMatch) {
    const id = Number(menuItemMatch[1]);
    for (const m of store.menus) {
      const idx = m.items.findIndex((i) => i.id === id);
      if (idx !== -1) {
        if (method === 'PUT') m.items[idx] = { ...m.items[idx], ...body };
        if (method === 'DELETE') m.items.splice(idx, 1);
        saveStore(store);
        break;
      }
    }
    return jsonResponse({ ok: true });
  }
  const socMatch = url.match(/^\/api\/admin\/social-links\/(\d+)$/);
  if (socMatch && method === 'PUT') {
    const id = Number(socMatch[1]);
    const idx = store.socialLinks.findIndex((s) => s.id === id);
    if (idx !== -1) {
      store.socialLinks[idx] = { ...store.socialLinks[idx], ...body };
      saveStore(store);
    }
    return jsonResponse({ ok: true });
  }

  // Backups
  if (url === '/api/admin/backups/snapshot' && method === 'POST') {
    const id = nextId(store.systemBackups);
    store.systemBackups.unshift({
      id,
      backupType: 'manual-local',
      fileName: `upg-static-snapshot-${id}.json`,
      sizeBytes: JSON.stringify(store).length,
      tableCount: 14,
      totalRows: store.products.length + store.pages.length + store.sectors.length,
      checksumSha256: 'local-snapshot',
      createdByEmail: 'admin@park.com.sa',
      status: 'completed',
      notes: 'Browser LocalStorage Snapshot',
      createdAt: now,
    });
    saveStore(store);
    return jsonResponse({ ok: true, id }, 201);
  }

  return jsonResponse({ ok: true });
}

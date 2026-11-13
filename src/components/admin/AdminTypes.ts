export type AdminTab =
  | 'overview'
  | 'content'
  | 'pages'
  | 'products'
  | 'categories'
  | 'services'
  | 'sectors'
  | 'projects'
  | 'media'
  | 'homepage'
  | 'blog'
  | 'seo'
  | 'navigation'
  | 'leads'
  | 'users'
  | 'settings'
  | 'backups'
  | 'logs';

export type AdminLang = 'ar' | 'en';
export type AdminTheme = 'light' | 'dark';

export interface AdminPageSection {
  id: number;
  pageId: number;
  sectionType:
    | 'hero'
    | 'image_text'
    | 'two_column'
    | 'gallery'
    | 'features'
    | 'stats'
    | 'testimonials'
    | 'cta'
    | 'product_showcase'
    | 'project_showcase'
    | 'contact';
  sortOrder: number;
  isVisible: boolean;
  contentEnJson: Record<string, unknown>;
  contentArJson: Record<string, unknown>;
  settingsJson: Record<string, unknown>;
}

export interface AdminOverviewPayload {
  settings: {
    id: number;
    siteKey: string;
    companyNameEn: string;
    companyNameAr: string;
    taglineEn: string;
    taglineAr: string;
    addressEn: string;
    addressAr: string;
    phone: string;
    whatsapp: string;
    email: string;
    logoUrl: string;
    primaryColor: string;
    accentColor: string;
    mapEmbedUrl: string;
    copyrightEn: string;
    copyrightAr: string;
    defaultCurrency: string;
    supportedCurrenciesJson: string[];
    defaultTaxRate: string;
    analyticsMeasurementId: string;
    robotsTxt: string;
    footerAboutEn: string;
    footerAboutAr: string;
  } | null;
  pages: Array<{
    id: number;
    slug: string;
    template: string;
    heroImageUrl: string;
    status: 'draft' | 'published' | 'archived' | 'scheduled';
    isVisible: boolean;
    isPublished: boolean;
    scheduledAt: string | null;
    sortOrder: number;
    updatedAt: string;
    en: Record<string, unknown> | null;
    ar: Record<string, unknown> | null;
    sections: AdminPageSection[];
  }>;
  sectors: Array<{
    id: number;
    slug: string;
    routePath: string;
    iconName: string;
    imageUrl: string;
    accentColor: string;
    sortOrder: number;
    isFeatured: boolean;
    isPublished: boolean;
    updatedAt: string;
    en: {
      title: string;
      shortTitle: string;
      tagline: string;
      summary: string;
      description: string;
      highlightsJson: string[];
    } | null;
    ar: {
      title: string;
      shortTitle: string;
      tagline: string;
      summary: string;
      description: string;
      highlightsJson: string[];
    } | null;
  }>;
  services: Array<{
    id: number;
    slug: string;
    iconName: string;
    imageUrl: string;
    division: string;
    sortOrder: number;
    isFeatured: boolean;
    isPublished: boolean;
    updatedAt: string;
    en: { title: string; shortDescription: string; fullDescription: string; featuresJson: string[] } | null;
    ar: { title: string; shortDescription: string; fullDescription: string; featuresJson: string[] } | null;
  }>;
  partners: Array<{
    id: number;
    slug: string;
    name: string;
    logoUrl: string;
    websiteUrl: string;
    country: string;
    categoryLabelEn: string;
    categoryLabelAr: string;
    sortOrder: number;
    isFeatured: boolean;
    isPublished: boolean;
    en: { displayName: string; tagline: string; description: string; highlightsJson: string[] } | null;
    ar: { displayName: string; tagline: string; description: string; highlightsJson: string[] } | null;
  }>;
  categories: Array<{
    id: number;
    slug: string;
    parentId: number | null;
    imageUrl: string;
    sortOrder: number;
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
  }>;
  products: Array<{
    id: number;
    sku: string;
    slug: string;
    categoryId: number | null;
    partnerId: number | null;
    imageUrl: string;
    galleryImagesJson: string[];
    datasheetUrl: string;
    division: string;
    brand: string;
    modelNumber: string;
    stockStatus: 'in_stock' | 'made_to_order' | 'out_of_stock';
    regularPrice: string;
    discountPrice: string;
    currency: string;
    taxRate: string;
    showPrice: boolean;
    status: 'draft' | 'published' | 'archived';
    seoTitleEn: string;
    seoTitleAr: string;
    seoDescEn: string;
    seoDescAr: string;
    isFeatured: boolean;
    isPublished: boolean;
    sortOrder: number;
    updatedAt: string;
    en: {
      name: string;
      summary: string;
      description: string;
      specificationsJson: Array<{ label: string; value: string; unit?: string }>;
      applicationsJson: string[];
      featuresJson: string[];
    } | null;
    ar: {
      name: string;
      summary: string;
      description: string;
      specificationsJson: Array<{ label: string; value: string; unit?: string }>;
      applicationsJson: string[];
      featuresJson: string[];
    } | null;
    priceHistory: Array<{
      id: number;
      previousPrice: string;
      newPrice: string;
      discountPrice: string;
      currency: string;
      showPrice: boolean;
      changedByEmail: string;
      note: string;
      createdAt: string;
    }>;
  }>;
  projects: Array<{
    id: number;
    slug: string;
    clientName: string;
    category: string;
    division: string;
    status: 'completed' | 'in_progress' | 'upcoming';
    locationEn: string;
    locationAr: string;
    completionYear: string;
    imageUrl: string;
    galleryImagesJson: string[];
    videoUrl: string;
    seoTitleEn: string;
    seoTitleAr: string;
    seoDescEn: string;
    seoDescAr: string;
    isFeatured: boolean;
    isPublished: boolean;
    updatedAt: string;
    en: { title: string; summary: string; scopeOfWork: string; outcomeNotes: string } | null;
    ar: { title: string; summary: string; scopeOfWork: string; outcomeNotes: string } | null;
  }>;
  testimonials: Array<{
    id: number;
    authorName: string;
    authorRoleEn: string;
    authorRoleAr: string;
    companyName: string;
    quoteEn: string;
    quoteAr: string;
    isPublished: boolean;
    isPlaceholder: boolean;
  }>;
  blogPosts: Array<{
    id: number;
    slug: string;
    categoryEn: string;
    categoryAr: string;
    tagsJson: string[];
    coverImageUrl: string;
    authorName: string;
    readTimeMinutes: number;
    isPublished: boolean;
    publishedAt: string;
    updatedAt: string;
    titleEn: string;
    titleAr: string;
    excerptEn: string;
    excerptAr: string;
    contentEn: string;
    contentAr: string;
    seoTitleEn: string;
    seoTitleAr: string;
    seoDescEn: string;
    seoDescAr: string;
  }>;
  banners: Array<{
    id: number;
    placement: 'hero' | 'promo' | 'sector_banner';
    titleEn: string;
    titleAr: string;
    subtitleEn: string;
    subtitleAr: string;
    ctaTextEn: string;
    ctaTextAr: string;
    ctaUrl: string;
    imageUrl: string;
    mobileImageUrl: string;
    sortOrder: number;
    isPublished: boolean;
  }>;
  homepageSections: Array<{
    id: number;
    sectionKey: string;
    sectionType: string;
    titleEn: string;
    titleAr: string;
    subtitleEn: string;
    subtitleAr: string;
    sortOrder: number;
    isVisible: boolean;
    configJson: Record<string, unknown>;
  }>;
  menus: Array<{
    id: number;
    location: string;
    name: string;
    items: Array<{
      id: number;
      menuId: number;
      url: string;
      labelEn: string;
      labelAr: string;
      sortOrder: number;
      isVisible: boolean;
    }>;
  }>;
  socialLinks: Array<{
    id: number;
    platform: string;
    label: string;
    url: string;
    isVisible: boolean;
  }>;
  seoMetadata: Array<{
    id: number;
    routeKey: string;
    locale: 'en' | 'ar';
    metaTitle: string;
    metaDescription: string;
    canonicalPath: string;
    ogTitle: string;
    ogDescription: string;
    ogImageUrl: string;
    ogType: string;
    schemaType: string;
    keywords: string;
    noIndex: boolean;
  }>;
  redirects: Array<{
    id: number;
    fromPath: string;
    toPath: string;
    statusCode: number;
    isActive: boolean;
    hits: number;
  }>;
  contactMessages: Array<{
    id: number;
    fullName: string;
    email: string;
    phone: string;
    company: string;
    subject: string;
    message: string;
    status: string;
    adminNotes: string;
    assignedToUserId: number | null;
    createdAt: string;
  }>;
  quoteRequests: Array<{
    id: number;
    fullName: string;
    companyName: string;
    businessEmail: string;
    phone: string;
    productOrService: string;
    estimatedQuantity: string;
    projectDescription: string;
    preferredContactMethod: string;
    attachmentAssetId: number | null;
    attachmentName: string;
    status: string;
    adminNotes: string;
    assignedToUserId: number | null;
    createdAt: string;
  }>;
  mediaFolders: Array<{
    id: number;
    name: string;
    slug: string;
    description: string;
  }>;
  mediaAssets: Array<{
    id: number;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    width: number;
    height: number;
    url: string;
    storageProvider: string;
    storagePath: string;
    titleEn: string;
    titleAr: string;
    altEn: string;
    altAr: string;
    descriptionEn: string;
    descriptionAr: string;
    folder: string;
    createdAt: string;
  }>;
  activityLogs: Array<{
    id: number;
    userEmail: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
    ipAddress: string;
    createdAt: string;
  }>;
  systemBackups: Array<{
    id: number;
    backupType: string;
    fileName: string;
    sizeBytes: number;
    tableCount: number;
    totalRows: number;
    checksumSha256: string;
    createdByEmail: string;
    status: string;
    notes: string;
    createdAt: string;
  }>;
  users: Array<{
    id: number;
    email: string;
    displayName: string;
    roleId: number | null;
    isActive: boolean;
    lastLoginAt: string;
  }>;
  roles: Array<{
    id: number;
    slug: string;
    name: string;
    description: string;
    permissions: string[];
  }>;
  dbHealth: {
    databaseName: string;
    postgresVersion: string;
    sizeBytes: number;
    tables: Array<{ tableName: string; rowCount: number }>;
  };
}

export interface AdminModuleProps {
  data: AdminOverviewPayload;
  adminLang: AdminLang;
  apiRequest: (url: string, options?: RequestInit) => Promise<Response>;
  authToken: string | null;
  showToast: (type: 'success' | 'error', text: string) => void;
  reloadData: () => Promise<void>;
  openMediaPicker: (onSelect: (url: string) => void) => void;
  setActiveTab: (tab: AdminTab) => void;
  navigate: (to: string) => void;
  markDirty?: (dirty: boolean) => void;
}

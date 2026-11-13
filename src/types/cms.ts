export type Locale = 'en' | 'ar';

export interface WebsiteSettings {
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
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  mapEmbedUrl: string | null;
  copyrightEn: string;
  copyrightAr: string;
  defaultCurrency: string;
  supportedCurrenciesJson: string[];
  defaultTaxRate: string;
  analyticsMeasurementId: string;
  robotsTxt: string;
  footerAboutEn: string;
  footerAboutAr: string;
}

export interface NavigationItem {
  id: number;
  menuId: number;
  parentId: number | null;
  url: string;
  labelEn: string;
  labelAr: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface SocialLinkItem {
  id: number;
  platform: string;
  label: string;
  url: string;
  iconName: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface PageTranslation {
  id: number;
  pageId: number;
  locale: Locale;
  title: string;
  heroHeading: string;
  heroSubheading: string;
  heroCtaText: string;
  heroCtaUrl: string;
  introBannerText: string;
  introBannerCtaText: string;
  bodyContent: string;
  sectionsJson: Record<string, unknown> | null;
}

export type PageSectionType =
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

export interface PageSectionItem {
  id: number;
  pageId: number;
  sectionType: PageSectionType;
  sortOrder: number;
  isVisible: boolean;
  contentEnJson: Record<string, unknown>;
  contentArJson: Record<string, unknown>;
  settingsJson: Record<string, unknown>;
}

export interface LocalizedPage {
  id: number;
  slug: string;
  template: string;
  heroImageUrl: string;
  status: string;
  isVisible: boolean;
  isPublished: boolean;
  scheduledAt: string | null;
  sortOrder: number;
  translation: PageTranslation | null;
  sections?: PageSectionItem[];
}

export interface SectorTranslation {
  id: number;
  sectorId: number;
  locale: Locale;
  title: string;
  shortTitle: string;
  tagline: string;
  summary: string;
  description: string;
  highlightsJson: string[];
}

export interface LocalizedSector {
  id: number;
  slug: string;
  routePath: string;
  iconName: string;
  imageUrl: string;
  accentColor: string;
  sortOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  translation: SectorTranslation | null;
}

export interface ServiceTranslation {
  id: number;
  serviceId: number;
  locale: Locale;
  title: string;
  shortDescription: string;
  fullDescription: string;
  featuresJson: string[];
}

export interface LocalizedService {
  id: number;
  slug: string;
  iconName: string;
  imageUrl: string;
  division: string;
  sortOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  translation: ServiceTranslation | null;
}

export interface PartnerTranslation {
  id: number;
  partnerId: number;
  locale: Locale;
  displayName: string;
  tagline: string;
  description: string;
  highlightsJson: string[];
}

export interface LocalizedPartner {
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
  translation: PartnerTranslation | null;
}

export interface ProductCategory {
  id: number;
  slug: string;
  parentId: number | null;
  imageUrl: string;
  sortOrder: number;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface ProductSpec {
  label: string;
  value: string;
  unit?: string;
}

export interface ProductTranslation {
  id: number;
  productId: number;
  locale: Locale;
  name: string;
  summary: string;
  description: string;
  specificationsJson: ProductSpec[];
  applicationsJson: string[];
  featuresJson?: string[];
}

export interface LocalizedProduct {
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
  stockStatus: string;
  regularPrice: string;
  discountPrice: string;
  currency: string;
  taxRate: string;
  showPrice: boolean;
  status: string;
  seoTitleEn: string;
  seoTitleAr: string;
  seoDescEn: string;
  seoDescAr: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  translation: ProductTranslation | null;
}

export interface ProjectTranslation {
  id: number;
  projectId: number;
  locale: Locale;
  title: string;
  summary: string;
  scopeOfWork: string;
  outcomeNotes: string;
}

export interface LocalizedProject {
  id: number;
  slug: string;
  clientId: number | null;
  clientName: string;
  category: string;
  division: string;
  status: string;
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
  isPlaceholder: boolean;
  translation: ProjectTranslation | null;
}

export interface ClientItem {
  id: number;
  nameEn: string;
  nameAr: string;
  sector: string;
  logoUrl: string;
  websiteUrl: string;
  isFeatured: boolean;
  isPlaceholder: boolean;
}

export interface BannerItem {
  id: number;
  placement: string;
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
  startsAt: string | null;
  endsAt: string | null;
}

export interface HomepageSectionItem {
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
}

export interface TestimonialItem {
  id: number;
  authorName: string;
  authorRoleEn: string;
  authorRoleAr: string;
  companyName: string;
  quoteEn: string;
  quoteAr: string;
  isPublished: boolean;
  isPlaceholder: boolean;
}

export interface BlogPostItem {
  id: number;
  slug: string;
  categoryEn: string;
  categoryAr: string;
  tagsJson: string[];
  coverImageUrl: string;
  authorName: string;
  readTimeMinutes: number;
  isPublished: boolean;
  isPlaceholder: boolean;
  publishedAt: string;
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
}

export interface SeoMetadataItem {
  id: number;
  routeKey: string;
  locale: Locale;
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
}

export interface RedirectItem {
  id: number;
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
  hits: number;
}

export interface PublicBootstrapData {
  locale: Locale;
  settings: WebsiteSettings | null;
  menus: Record<string, NavigationItem[]>;
  socialLinks: SocialLinkItem[];
  pages: LocalizedPage[];
  sectors: LocalizedSector[];
  services: LocalizedService[];
  partners: LocalizedPartner[];
  categories: ProductCategory[];
  products: LocalizedProduct[];
  projects: LocalizedProject[];
  clients: ClientItem[];
  testimonials: TestimonialItem[];
  banners: BannerItem[];
  homepageSections: HomepageSectionItem[];
  blogPosts: BlogPostItem[];
  seo: SeoMetadataItem[];
  redirects: RedirectItem[];
}

export interface DbUser {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  roleSlug: string;
  roleName: string;
  permissions: string[];
  isActive: boolean;
}

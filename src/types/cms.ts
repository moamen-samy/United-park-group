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

export interface LocalizedPage {
  id: number;
  slug: string;
  template: string;
  heroImageUrl: string;
  isPublished: boolean;
  sortOrder: number;
  translation: PageTranslation | null;
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
}

export interface LocalizedProduct {
  id: number;
  sku: string;
  slug: string;
  categoryId: number | null;
  partnerId: number | null;
  imageUrl: string;
  datasheetUrl: string;
  division: string;
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
  category: string;
  division: string;
  locationEn: string;
  locationAr: string;
  completionYear: string;
  imageUrl: string;
  videoUrl: string;
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

export interface BlogPostItem {
  id: number;
  slug: string;
  categoryEn: string;
  categoryAr: string;
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
  schemaType: string;
  keywords: string;
}

export interface PublicBootstrapData {
  locale: Locale;
  settings: WebsiteSettings | null;
  menus: Record<string, NavigationItem[]>;
  socialLinks: SocialLinkItem[];
  pages: LocalizedPage[];
  services: LocalizedService[];
  partners: LocalizedPartner[];
  categories: ProductCategory[];
  products: LocalizedProduct[];
  projects: LocalizedProject[];
  clients: ClientItem[];
  blogPosts: BlogPostItem[];
  seo: SeoMetadataItem[];
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

import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// 1. admin_roles
export const adminRoles = pgTable('admin_roles', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').default(''),
  permissions: jsonb('permissions').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. users
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(),
    email: text('email').notNull(),
    displayName: text('display_name').default(''),
    photoUrl: text('photo_url').default(''),
    roleId: integer('role_id').references(() => adminRoles.id),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('users_email_idx').on(table.email)]
);

// 3. website_settings
export const websiteSettings = pgTable('website_settings', {
  id: serial('id').primaryKey(),
  siteKey: text('site_key').notNull().unique().default('default'),
  companyNameEn: text('company_name_en').notNull(),
  companyNameAr: text('company_name_ar').notNull(),
  taglineEn: text('tagline_en').notNull(),
  taglineAr: text('tagline_ar').notNull(),
  addressEn: text('address_en').notNull(),
  addressAr: text('address_ar').notNull(),
  phone: text('phone').notNull(),
  whatsapp: text('whatsapp').notNull(),
  email: text('email').notNull(),
  logoUrl: text('logo_url').default(''),
  primaryColor: text('primary_color').notNull().default('#133D68'),
  accentColor: text('accent_color').notNull().default('#D93829'),
  mapEmbedUrl: text('map_embed_url').default(''),
  copyrightEn: text('copyright_en').notNull(),
  copyrightAr: text('copyright_ar').notNull(),
  defaultCurrency: text('default_currency').notNull().default('SAR'),
  supportedCurrenciesJson: jsonb('supported_currencies_json')
    .$type<string[]>()
    .notNull()
    .default(['SAR', 'USD', 'AED', 'EUR']),
  defaultTaxRate: text('default_tax_rate').notNull().default('15'),
  analyticsMeasurementId: text('analytics_measurement_id').default(''),
  robotsTxt: text('robots_txt').default(
    'User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: /sitemap.xml'
  ),
  footerAboutEn: text('footer_about_en').default(''),
  footerAboutAr: text('footer_about_ar').default(''),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. pages
export const pages = pgTable('pages', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  template: text('template').notNull().default('standard'),
  heroImageUrl: text('hero_image_url').default(''),
  status: text('status').notNull().default('published'),
  isVisible: boolean('is_visible').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(true),
  scheduledAt: timestamp('scheduled_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. page_translations
export const pageTranslations = pgTable(
  'page_translations',
  {
    id: serial('id').primaryKey(),
    pageId: integer('page_id')
      .references(() => pages.id, { onDelete: 'cascade' })
      .notNull(),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    heroHeading: text('hero_heading').default(''),
    heroSubheading: text('hero_subheading').default(''),
    heroCtaText: text('hero_cta_text').default(''),
    heroCtaUrl: text('hero_cta_url').default('/quote'),
    introBannerText: text('intro_banner_text').default(''),
    introBannerCtaText: text('intro_banner_cta_text').default(''),
    bodyContent: text('body_content').default(''),
    sectionsJson: jsonb('sections_json').$type<Record<string, unknown>>().default({}),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('page_translations_page_locale_idx').on(table.pageId, table.locale)]
);

// 5b. page_sections (Reusable Section Builder)
export const pageSections = pgTable(
  'page_sections',
  {
    id: serial('id').primaryKey(),
    pageId: integer('page_id')
      .references(() => pages.id, { onDelete: 'cascade' })
      .notNull(),
    sectionType: text('section_type').notNull().default('image_text'),
    sortOrder: integer('sort_order').notNull().default(0),
    isVisible: boolean('is_visible').notNull().default(true),
    contentEnJson: jsonb('content_en_json').$type<Record<string, unknown>>().notNull().default({}),
    contentArJson: jsonb('content_ar_json').$type<Record<string, unknown>>().notNull().default({}),
    settingsJson: jsonb('settings_json').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('page_sections_page_idx').on(table.pageId)]
);

// 5c. sectors & sector_translations (Business Sectors Module)
export const sectors = pgTable('sectors', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  routePath: text('route_path').notNull(),
  iconName: text('icon_name').notNull().default('Droplets'),
  imageUrl: text('image_url').default(''),
  accentColor: text('accent_color').notNull().default('#133D68'),
  sortOrder: integer('sort_order').notNull().default(0),
  isFeatured: boolean('is_featured').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sectorTranslations = pgTable(
  'sector_translations',
  {
    id: serial('id').primaryKey(),
    sectorId: integer('sector_id')
      .references(() => sectors.id, { onDelete: 'cascade' })
      .notNull(),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    shortTitle: text('short_title').notNull(),
    tagline: text('tagline').default(''),
    summary: text('summary').notNull(),
    description: text('description').default(''),
    highlightsJson: jsonb('highlights_json').$type<string[]>().default([]),
  },
  (table) => [uniqueIndex('sector_translations_sector_locale_idx').on(table.sectorId, table.locale)]
);

// 6. navigation_menus
export const navigationMenus = pgTable('navigation_menus', {
  id: serial('id').primaryKey(),
  location: text('location').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. navigation_items
export const navigationItems = pgTable(
  'navigation_items',
  {
    id: serial('id').primaryKey(),
    menuId: integer('menu_id')
      .references(() => navigationMenus.id, { onDelete: 'cascade' })
      .notNull(),
    parentId: integer('parent_id'),
    url: text('url').notNull(),
    labelEn: text('label_en').notNull(),
    labelAr: text('label_ar').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isVisible: boolean('is_visible').notNull().default(true),
  },
  (table) => [index('navigation_items_menu_idx').on(table.menuId)]
);

// 8. services
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  iconName: text('icon_name').notNull().default('Droplets'),
  imageUrl: text('image_url').default(''),
  division: text('division').notNull().default('pumps'),
  sortOrder: integer('sort_order').notNull().default(0),
  isFeatured: boolean('is_featured').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. service_translations
export const serviceTranslations = pgTable(
  'service_translations',
  {
    id: serial('id').primaryKey(),
    serviceId: integer('service_id')
      .references(() => services.id, { onDelete: 'cascade' })
      .notNull(),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    shortDescription: text('short_description').notNull(),
    fullDescription: text('full_description').default(''),
    featuresJson: jsonb('features_json').$type<string[]>().default([]),
  },
  (table) => [uniqueIndex('service_translations_service_locale_idx').on(table.serviceId, table.locale)]
);

// 10. partners
export const partners = pgTable('partners', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  logoUrl: text('logo_url').default(''),
  websiteUrl: text('website_url').default(''),
  country: text('country').default(''),
  categoryLabelEn: text('category_label_en').default(''),
  categoryLabelAr: text('category_label_ar').default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isFeatured: boolean('is_featured').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 11. partner_translations
export const partnerTranslations = pgTable(
  'partner_translations',
  {
    id: serial('id').primaryKey(),
    partnerId: integer('partner_id')
      .references(() => partners.id, { onDelete: 'cascade' })
      .notNull(),
    locale: text('locale').notNull(),
    displayName: text('display_name').notNull(),
    tagline: text('tagline').default(''),
    description: text('description').notNull(),
    highlightsJson: jsonb('highlights_json').$type<string[]>().default([]),
  },
  (table) => [uniqueIndex('partner_translations_partner_locale_idx').on(table.partnerId, table.locale)]
);

// 12. product_categories
export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  parentId: integer('parent_id'),
  imageUrl: text('image_url').default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  descriptionEn: text('description_en').default(''),
  descriptionAr: text('description_ar').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. products
export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    sku: text('sku').notNull().unique(),
    slug: text('slug').notNull().unique(),
    categoryId: integer('category_id')
      .references(() => productCategories.id, { onDelete: 'set null' }),
    partnerId: integer('partner_id')
      .references(() => partners.id, { onDelete: 'set null' }),
    imageUrl: text('image_url').default(''),
    galleryImagesJson: jsonb('gallery_images_json').$type<string[]>().notNull().default([]),
    datasheetUrl: text('datasheet_url').default(''),
    division: text('division').notNull().default('pumps'),
    brand: text('brand').default(''),
    modelNumber: text('model_number').default(''),
    stockStatus: text('stock_status').notNull().default('in_stock'),
    regularPrice: text('regular_price').default('0'),
    discountPrice: text('discount_price').default(''),
    currency: text('currency').notNull().default('SAR'),
    taxRate: text('tax_rate').notNull().default('15'),
    showPrice: boolean('show_price').notNull().default(false),
    status: text('status').notNull().default('published'),
    seoTitleEn: text('seo_title_en').default(''),
    seoTitleAr: text('seo_title_ar').default(''),
    seoDescEn: text('seo_desc_en').default(''),
    seoDescAr: text('seo_desc_ar').default(''),
    isFeatured: boolean('is_featured').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('products_category_idx').on(table.categoryId),
    index('products_partner_idx').on(table.partnerId),
  ]
);

// 14. product_translations
export const productTranslations = pgTable(
  'product_translations',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    summary: text('summary').notNull(),
    description: text('description').default(''),
    specificationsJson: jsonb('specifications_json')
      .$type<Array<{ label: string; value: string; unit?: string }>>()
      .default([]),
    applicationsJson: jsonb('applications_json').$type<string[]>().default([]),
    featuresJson: jsonb('features_json').$type<string[]>().default([]),
  },
  (table) => [uniqueIndex('product_translations_product_locale_idx').on(table.productId, table.locale)]
);

// 14b. product_price_history
export const productPriceHistory = pgTable(
  'product_price_history',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    previousPrice: text('previous_price').default('0'),
    newPrice: text('new_price').notNull(),
    discountPrice: text('discount_price').default(''),
    currency: text('currency').notNull().default('SAR'),
    showPrice: boolean('show_price').notNull().default(false),
    changedByUserId: integer('changed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    changedByEmail: text('changed_by_email').default('system'),
    note: text('note').default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('product_price_history_product_idx').on(table.productId)]
);

// 15. clients
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  sector: text('sector').default(''),
  logoUrl: text('logo_url').default(''),
  websiteUrl: text('website_url').default(''),
  isFeatured: boolean('is_featured').notNull().default(true),
  isPlaceholder: boolean('is_placeholder').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 16. projects
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),
  clientName: text('client_name').default(''),
  category: text('category').notNull().default('Water Infrastructure'),
  division: text('division').notNull().default('contracting'),
  status: text('status').notNull().default('completed'),
  locationEn: text('location_en').default('Jeddah, Saudi Arabia'),
  locationAr: text('location_ar').default('جدة، المملكة العربية السعودية'),
  completionYear: text('completion_year').default(''),
  imageUrl: text('image_url').default(''),
  galleryImagesJson: jsonb('gallery_images_json').$type<string[]>().notNull().default([]),
  videoUrl: text('video_url').default(''),
  seoTitleEn: text('seo_title_en').default(''),
  seoTitleAr: text('seo_title_ar').default(''),
  seoDescEn: text('seo_desc_en').default(''),
  seoDescAr: text('seo_desc_ar').default(''),
  isFeatured: boolean('is_featured').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(true),
  isPlaceholder: boolean('is_placeholder').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 17. project_translations
export const projectTranslations = pgTable(
  'project_translations',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    scopeOfWork: text('scope_of_work').default(''),
    outcomeNotes: text('outcome_notes').default(''),
  },
  (table) => [uniqueIndex('project_translations_project_locale_idx').on(table.projectId, table.locale)]
);

// 18. testimonials
export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  authorName: text('author_name').notNull(),
  authorRoleEn: text('author_role_en').default(''),
  authorRoleAr: text('author_role_ar').default(''),
  companyName: text('company_name').notNull(),
  quoteEn: text('quote_en').notNull(),
  quoteAr: text('quote_ar').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  isPlaceholder: boolean('is_placeholder').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 19. media_folders & media_assets
export const mediaFolders = pgTable('media_folders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mediaAssets = pgTable('media_assets', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull().default(0),
  width: integer('width').default(0),
  height: integer('height').default(0),
  url: text('url').notNull(),
  dataBase64: text('data_base64').default(''),
  storageProvider: text('storage_provider').notNull().default('postgresql'),
  storagePath: text('storage_path').default(''),
  titleEn: text('title_en').default(''),
  titleAr: text('title_ar').default(''),
  altEn: text('alt_en').default(''),
  altAr: text('alt_ar').default(''),
  descriptionEn: text('description_en').default(''),
  descriptionAr: text('description_ar').default(''),
  folder: text('folder').notNull().default('general'),
  uploadedByUserId: integer('uploaded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 19b. banners & homepage_sections
export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  placement: text('placement').notNull().default('hero'),
  titleEn: text('title_en').notNull(),
  titleAr: text('title_ar').notNull(),
  subtitleEn: text('subtitle_en').default(''),
  subtitleAr: text('subtitle_ar').default(''),
  ctaTextEn: text('cta_text_en').default(''),
  ctaTextAr: text('cta_text_ar').default(''),
  ctaUrl: text('cta_url').default('/quote'),
  imageUrl: text('image_url').default(''),
  mobileImageUrl: text('mobile_image_url').default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const homepageSections = pgTable('homepage_sections', {
  id: serial('id').primaryKey(),
  sectionKey: text('section_key').notNull().unique(),
  sectionType: text('section_type').notNull(),
  titleEn: text('title_en').notNull(),
  titleAr: text('title_ar').notNull(),
  subtitleEn: text('subtitle_en').default(''),
  subtitleAr: text('subtitle_ar').default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isVisible: boolean('is_visible').notNull().default(true),
  configJson: jsonb('config_json').$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 20. contact_messages
export const contactMessages = pgTable(
  'contact_messages',
  {
    id: serial('id').primaryKey(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').default(''),
    company: text('company').default(''),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    locale: text('locale').notNull().default('en'),
    status: text('status').notNull().default('new'),
    adminNotes: text('admin_notes').default(''),
    assignedToUserId: integer('assigned_to_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('contact_messages_status_idx').on(table.status)]
);

// 21. quote_requests
export const quoteRequests = pgTable(
  'quote_requests',
  {
    id: serial('id').primaryKey(),
    fullName: text('full_name').notNull(),
    companyName: text('company_name').notNull(),
    businessEmail: text('business_email').notNull(),
    phone: text('phone').notNull(),
    productOrService: text('product_or_service').notNull(),
    productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
    estimatedQuantity: text('estimated_quantity').default(''),
    projectDescription: text('project_description').notNull(),
    preferredContactMethod: text('preferred_contact_method').notNull().default('email'),
    attachmentAssetId: integer('attachment_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    attachmentName: text('attachment_name').default(''),
    locale: text('locale').notNull().default('en'),
    status: text('status').notNull().default('new'),
    adminNotes: text('admin_notes').default(''),
    assignedToUserId: integer('assigned_to_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('quote_requests_status_idx').on(table.status)]
);

// 22. social_links
export const socialLinks = pgTable('social_links', {
  id: serial('id').primaryKey(),
  platform: text('platform').notNull().unique(),
  label: text('label').notNull(),
  url: text('url').notNull(),
  iconName: text('icon_name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isVisible: boolean('is_visible').notNull().default(true),
});

// 23. seo_metadata & redirects
export const seoMetadata = pgTable(
  'seo_metadata',
  {
    id: serial('id').primaryKey(),
    routeKey: text('route_key').notNull(),
    locale: text('locale').notNull(),
    metaTitle: text('meta_title').notNull(),
    metaDescription: text('meta_description').notNull(),
    canonicalPath: text('canonical_path').notNull(),
    ogTitle: text('og_title').default(''),
    ogDescription: text('og_description').default(''),
    ogImageUrl: text('og_image_url').default(''),
    ogType: text('og_type').default('website'),
    schemaType: text('schema_type').default('WebPage'),
    keywords: text('keywords').default(''),
    noIndex: boolean('no_index').notNull().default(false),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('seo_metadata_route_locale_idx').on(table.routeKey, table.locale)]
);

export const redirects = pgTable('redirects', {
  id: serial('id').primaryKey(),
  fromPath: text('from_path').notNull().unique(),
  toPath: text('to_path').notNull(),
  statusCode: integer('status_code').notNull().default(301),
  isActive: boolean('is_active').notNull().default(true),
  hits: integer('hits').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 24. blog_posts
export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  categoryEn: text('category_en').notNull().default('Industry Insights'),
  categoryAr: text('category_ar').notNull().default('رؤى صناعية'),
  tagsJson: jsonb('tags_json').$type<string[]>().notNull().default([]),
  coverImageUrl: text('cover_image_url').default(''),
  authorName: text('author_name').default('United Park Editorial Team'),
  readTimeMinutes: integer('read_time_minutes').notNull().default(4),
  isPublished: boolean('is_published').notNull().default(true),
  isPlaceholder: boolean('is_placeholder').notNull().default(false),
  publishedAt: timestamp('published_at').defaultNow().notNull(),
  titleEn: text('title_en').notNull(),
  titleAr: text('title_ar').notNull(),
  excerptEn: text('excerpt_en').notNull(),
  excerptAr: text('excerpt_ar').notNull(),
  contentEn: text('content_en').notNull(),
  contentAr: text('content_ar').notNull(),
  seoTitleEn: text('seo_title_en').default(''),
  seoTitleAr: text('seo_title_ar').default(''),
  seoDescEn: text('seo_desc_en').default(''),
  seoDescAr: text('seo_desc_ar').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 25. activity_logs
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    userEmail: text('user_email').default('system'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').default(''),
    details: text('details').default(''),
    ipAddress: text('ip_address').default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('activity_logs_created_idx').on(table.createdAt)]
);

// 26. system_backups
export const systemBackups = pgTable('system_backups', {
  id: serial('id').primaryKey(),
  backupType: text('backup_type').notNull().default('logical_json'),
  fileName: text('file_name').notNull(),
  sizeBytes: integer('size_bytes').notNull().default(0),
  tableCount: integer('table_count').notNull().default(0),
  totalRows: integer('total_rows').notNull().default(0),
  checksumSha256: text('checksum_sha256').default(''),
  createdByUserId: integer('created_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdByEmail: text('created_by_email').default('system'),
  status: text('status').notNull().default('completed'),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  role: one(adminRoles, {
    fields: [users.roleId],
    references: [adminRoles.id],
  }),
}));

export const pagesRelations = relations(pages, ({ many }) => ({
  translations: many(pageTranslations),
  sections: many(pageSections),
}));

export const pageTranslationsRelations = relations(pageTranslations, ({ one }) => ({
  page: one(pages, {
    fields: [pageTranslations.pageId],
    references: [pages.id],
  }),
}));

export const pageSectionsRelations = relations(pageSections, ({ one }) => ({
  page: one(pages, {
    fields: [pageSections.pageId],
    references: [pages.id],
  }),
}));

export const sectorsRelations = relations(sectors, ({ many }) => ({
  translations: many(sectorTranslations),
}));

export const sectorTranslationsRelations = relations(sectorTranslations, ({ one }) => ({
  sector: one(sectors, {
    fields: [sectorTranslations.sectorId],
    references: [sectors.id],
  }),
}));

export const navigationMenusRelations = relations(navigationMenus, ({ many }) => ({
  items: many(navigationItems),
}));

export const navigationItemsRelations = relations(navigationItems, ({ one }) => ({
  menu: one(navigationMenus, {
    fields: [navigationItems.menuId],
    references: [navigationMenus.id],
  }),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  translations: many(serviceTranslations),
}));

export const serviceTranslationsRelations = relations(serviceTranslations, ({ one }) => ({
  service: one(services, {
    fields: [serviceTranslations.serviceId],
    references: [services.id],
  }),
}));

export const partnersRelations = relations(partners, ({ many }) => ({
  translations: many(partnerTranslations),
  products: many(products),
}));

export const partnerTranslationsRelations = relations(partnerTranslations, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerTranslations.partnerId],
    references: [partners.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  partner: one(partners, {
    fields: [products.partnerId],
    references: [partners.id],
  }),
  translations: many(productTranslations),
  priceHistory: many(productPriceHistory),
}));

export const productTranslationsRelations = relations(productTranslations, ({ one }) => ({
  product: one(products, {
    fields: [productTranslations.productId],
    references: [products.id],
  }),
}));

export const productPriceHistoryRelations = relations(productPriceHistory, ({ one }) => ({
  product: one(products, {
    fields: [productPriceHistory.productId],
    references: [products.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  translations: many(projectTranslations),
}));

export const projectTranslationsRelations = relations(projectTranslations, ({ one }) => ({
  project: one(projects, {
    fields: [projectTranslations.projectId],
    references: [projects.id],
  }),
}));

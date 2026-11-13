import { and, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adminRoles,
  blogPosts,
  clients,
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
  seoMetadata,
  services,
  serviceTranslations,
  socialLinks,
  testimonials,
  websiteSettings,
} from './schema.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      await runSeedIfEmpty();
      await ensureHoldingGroupUpgraded();
    })().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function runSeedIfEmpty(): Promise<void> {
  const existingSettings = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(websiteSettings);

  if ((existingSettings[0]?.count ?? 0) > 0) {
    return;
  }

  console.log('Seeding United Park Group (PARK) PostgreSQL database...');

  // 1. Admin roles
  await db
    .insert(adminRoles)
    .values([
      {
        slug: 'super_admin',
        name: 'Super Administrator',
        description: 'Full access across bilingual CMS, product catalog, partners, leads, and RBAC.',
        permissions: ['*'],
      },
      {
        slug: 'editor',
        name: 'Content & Catalog Editor',
        description: 'Manage pages, bilingual copy, products, partners, projects, news, and SEO.',
        permissions: ['content:write', 'catalog:write', 'media:write', 'seo:write'],
      },
      {
        slug: 'sales_manager',
        name: 'Sales & RFQ Manager',
        description: 'Review and process quote requests and contact submissions.',
        permissions: ['leads:read', 'leads:write'],
      },
      {
        slug: 'viewer',
        name: 'Authenticated Viewer',
        description: 'Read-only access awaiting administrator role assignment.',
        permissions: ['profile:read'],
      },
    ])
    .onConflictDoNothing();

  // 2. Website settings (verified PARK facts)
  await db
    .insert(websiteSettings)
    .values({
      siteKey: 'default',
      companyNameEn: 'United Park Group (PARK)',
      companyNameAr: 'مجموعة بارك المتحدة (PARK)',
      taglineEn: 'Integrated Water, Pumping & Industrial Engineering Solutions Since 1989',
      taglineAr: 'حلول متكاملة لأنظمة المياه والمضخات والهندسة الصناعية منذ عام ١٩٨٩',
      addressEn: 'Hammouri Buildings, Azizeyyah District, Al-Baliyah Street, Jeddah, Saudi Arabia',
      addressAr: 'مباني الحموري، حي العزيزية، شارع البلية، جدة، المملكة العربية السعودية',
      phone: '+966 12 6604411',
      whatsapp: '+966126604411',
      email: 'info@park.com.sa',
      logoUrl: '',
      primaryColor: '#133D68',
      accentColor: '#D93829',
      mapEmbedUrl:
        'https://maps.google.com/maps?q=Azizeyyah%20District%20Jeddah%20Saudi%20Arabia&t=&z=13&ie=UTF8&iwloc=&output=embed',
      copyrightEn: 'Copyright © 2026 United Park Co. Ltd. (PARK). All rights reserved.',
      copyrightAr: 'جميع الحقوق محفوظة © ٢٠٢٦ شركة بارك المتحدة المحدودة.',
    })
    .onConflictDoNothing();

  // 3. Navigation menus & items
  const [headerMenu] = await db
    .insert(navigationMenus)
    .values({ location: 'header', name: 'Primary Header Navigation' })
    .onConflictDoNothing()
    .returning();
  const [footerCompanyMenu] = await db
    .insert(navigationMenus)
    .values({ location: 'footer_company', name: 'Footer Company Divisions' })
    .onConflictDoNothing()
    .returning();
  const [footerQuickMenu] = await db
    .insert(navigationMenus)
    .values({ location: 'footer_quick', name: 'Footer Quick Links' })
    .onConflictDoNothing()
    .returning();

  if (headerMenu) {
    await db.insert(navigationItems).values([
      { menuId: headerMenu.id, url: '/', labelEn: 'Home', labelAr: 'الرئيسية', sortOrder: 1, isVisible: true },
      { menuId: headerMenu.id, url: '/products', labelEn: 'Products', labelAr: 'المنتجات', sortOrder: 2, isVisible: true },
      { menuId: headerMenu.id, url: '/services', labelEn: 'Services', labelAr: 'الخدمات', sortOrder: 3, isVisible: true },
      { menuId: headerMenu.id, url: '/partners', labelEn: 'Our Partners', labelAr: 'شركاؤنا', sortOrder: 4, isVisible: true },
      { menuId: headerMenu.id, url: '/projects', labelEn: 'Projects', labelAr: 'المشاريع', sortOrder: 5, isVisible: true },
      { menuId: headerMenu.id, url: '/about', labelEn: 'About Us', labelAr: 'من نحن', sortOrder: 6, isVisible: true },
      { menuId: headerMenu.id, url: '/contact', labelEn: 'Contact Us', labelAr: 'اتصل بنا', sortOrder: 7, isVisible: true },
    ]);
  }
  if (footerCompanyMenu) {
    await db.insert(navigationItems).values([
      { menuId: footerCompanyMenu.id, url: '/divisions/pumps', labelEn: 'Park Pumps', labelAr: 'بارك للمضخات', sortOrder: 1, isVisible: true },
      { menuId: footerCompanyMenu.id, url: '/divisions/contracting', labelEn: 'Park Contracting', labelAr: 'بارك للمقاولات', sortOrder: 2, isVisible: true },
      { menuId: footerCompanyMenu.id, url: '/divisions/real-estate', labelEn: 'Park Real Estate', labelAr: 'بارك العقارية', sortOrder: 3, isVisible: true },
      { menuId: footerCompanyMenu.id, url: '/quote', labelEn: 'Request a Quote', labelAr: 'اطلب عرض سعر', sortOrder: 4, isVisible: true },
    ]);
  }
  if (footerQuickMenu) {
    await db.insert(navigationItems).values([
      { menuId: footerQuickMenu.id, url: '/', labelEn: 'Home', labelAr: 'الرئيسية', sortOrder: 1, isVisible: true },
      { menuId: footerQuickMenu.id, url: '/about', labelEn: 'About Us', labelAr: 'من نحن', sortOrder: 2, isVisible: true },
      { menuId: footerQuickMenu.id, url: '/about#chairman', labelEn: "Chairman's Message", labelAr: 'كلمة رئيس مجلس الإدارة', sortOrder: 3, isVisible: true },
      { menuId: footerQuickMenu.id, url: '/products', labelEn: 'Products', labelAr: 'المنتجات', sortOrder: 4, isVisible: true },
      { menuId: footerQuickMenu.id, url: '/services', labelEn: 'Services', labelAr: 'الخدمات', sortOrder: 5, isVisible: true },
      { menuId: footerQuickMenu.id, url: '/partners', labelEn: 'Our Partners', labelAr: 'شركاؤنا', sortOrder: 6, isVisible: true },
      { menuId: footerQuickMenu.id, url: '/news', labelEn: 'News & Insights', labelAr: 'الأخبار والرؤى', sortOrder: 7, isVisible: true },
      { menuId: footerQuickMenu.id, url: '/contact', labelEn: 'Contact Us', labelAr: 'اتصل بنا', sortOrder: 8, isVisible: true },
    ]);
  }

  // 4. Social links
  await db
    .insert(socialLinks)
    .values([
      { platform: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com', iconName: 'Linkedin', sortOrder: 1, isVisible: true },
      { platform: 'x', label: 'X', url: 'https://x.com', iconName: 'Twitter', sortOrder: 2, isVisible: true },
      { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com', iconName: 'Instagram', sortOrder: 3, isVisible: true },
      { platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com', iconName: 'Youtube', sortOrder: 4, isVisible: true },
      { platform: 'facebook', label: 'Facebook', url: 'https://www.facebook.com', iconName: 'Facebook', sortOrder: 5, isVisible: true },
      { platform: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com', iconName: 'Share2', sortOrder: 6, isVisible: true },
    ])
    .onConflictDoNothing();

  // 5. Pages & Translations
  const pageSeeds = [
    {
      slug: 'home',
      template: 'home',
      heroImageUrl: '/images/hero-pumps.jpg',
      sortOrder: 1,
      en: {
        title: 'Home',
        heroHeading: 'MORE THAN A GROUP.\nA VISION THAT CONNECTS INDUSTRIES.',
        heroSubheading:
          'UNITED PARK GROUP brings together diverse businesses across industrial engineering, contracting, real estate development, healthcare, and renewable energy — creating integrated opportunities for sustainable growth and a stronger future.',
        heroCtaText: 'EXPLORE OUR GROUP',
        heroCtaUrl: '/divisions/industrial-engineering',
        introBannerText:
          'Founded in Jeddah in 1989 — uniting global industrial partnerships, contracting execution, urban real estate, healthcare, and clean energy.',
        introBannerCtaText: 'Request Group Inquiry',
        bodyContent:
          'Since establishing the company on the west coast of Saudi Arabia in 1989 in Jeddah, United Park Group has grown from a trusted industrial and water-engineering partner into a diversified holding group spanning Industrial & Engineering Solutions, Contracting & Construction, Real Estate Development, Medical Clinics & Healthcare, and Solar Energy Systems across the Kingdom.',
        sectionsJson: {
          quoteText:
            'United Park Group unites global engineering partnerships, contracting execution, urban real estate, healthcare facilities, and solar energy under one accountable corporate umbrella.',
          storeBannerText: 'Explore our technical catalog to view industrial systems, pumps, motors, and solar solutions.',
          storeBannerCta: 'Browse Catalog',
          facilityImageUrl: '/images/facility-pump-room.jpg',
          utilitiesImageUrl: '/images/sector-utilities.jpg',
        },
      },
      ar: {
        title: 'الرئيسية',
        heroHeading: 'أكثر من مجرد مجموعة...\nرؤية تجمع قطاعات متعددة.',
        heroSubheading:
          'تجمع مجموعة يونايتد بارك قطاعات متنوعة تشمل الحلول الصناعية والهندسية، والمقاولات، والتطوير العقاري، والرعاية الصحية، والطاقة المتجددة، ضمن رؤية موحدة للنمو والاستدامة.',
        heroCtaText: 'استكشف قطاعات المجموعة',
        heroCtaUrl: '/divisions/industrial-engineering',
        introBannerText:
          'منذ عام ١٩٨٩ في جدة، نربط قطاعات الصناعة والمقاولات والعقار والرعاية الصحية والطاقة المتجددة بشراكات عالمية موثوقة.',
        introBannerCtaText: 'اطلب عرض سعر',
        bodyContent:
          'منذ تأسيس الشركة على الساحل الغربي للمملكة العربية السعودية عام ١٩٨٩ في جدة، توسعت مجموعة بارك المتحدة لتصبح مجموعة قابضة متعددة القطاعات تجمع بين الحلول الصناعية والهندسية، والمقاولات والإنشاءات، والتطوير العقاري، والعيادات الطبية والرعاية الصحية، وأنظمة الطاقة الشمسية في مختلف مناطق المملكة.',
        sectionsJson: {
          quoteText:
            'تعمل مجموعة بارك المتحدة على بناء منظومة متكاملة تجمع الحلول الصناعية والمقاولات والتطوير العقاري والرعاية الصحية والطاقة المتجددة تحت رؤية واحدة.',
          storeBannerText: 'تصفح كتالوج المنتجات للاطلاع على الأنظمة الصناعية والمضخات وحلول الطاقة.',
          storeBannerCta: 'عرض الكتالوج',
          facilityImageUrl: '/images/facility-pump-room.jpg',
          utilitiesImageUrl: '/images/sector-utilities.jpg',
        },
      },
    },
    {
      slug: 'about',
      template: 'about',
      heroImageUrl: '/images/facility-pump-room.jpg',
      sortOrder: 2,
      en: {
        title: 'About Us',
        heroHeading: 'About United Park Group',
        heroSubheading: 'Established in Jeddah in 1989 — Over three decades of water, pumping, and electromechanical excellence in Saudi Arabia.',
        heroCtaText: 'Request Consultation',
        heroCtaUrl: '/contact',
        introBannerText: 'From initial engineering design to 24-month installation warranty and ongoing maintenance.',
        introBannerCtaText: 'Contact Engineering Team',
        bodyContent:
          'United Park Co. Ltd. (PARK) was founded in Jeddah in 1989 to deliver turnkey water, pumping, and wastewater systems tailored to the Kingdom’s commercial, residential, agricultural, and industrial sectors.',
        sectionsJson: {
          vision:
            'To be Saudi Arabia’s most dependable engineering partner for sustainable water infrastructure, efficient pumping technologies, and integrated contracting.',
          mission:
            'Delivering global fluid-handling equipment backed by local engineering consultations, rapid spare-parts availability, and 24/7 after-sales maintenance.',
          chairmanMessagePlaceholder: true,
          chairmanMessage:
            '[Editable in CMS] Chairman’s Message: Since 1989, United Park Group has stood for engineering reliability and long-term client partnerships across the Kingdom. Update this official executive statement anytime from the Admin CMS.',
          values: [
            'Engineering Integrity & Global OEM Quality',
            'Single-Source Turnkey Responsibility',
            'Water Conservation & Energy Efficiency',
            'Responsive After-Sales Support & Maintenance',
          ],
        },
      },
      ar: {
        title: 'من نحن',
        heroHeading: 'عن مجموعة بارك المتحدة',
        heroSubheading: 'تأسست في جدة عام ١٩٨٩ — أكثر من ثلاثة عقود من الريادة في أنظمة المياه والمضخات والأعمال الكهروميكانيكية بالمملكة.',
        heroCtaText: 'اطلب استشارة هندسية',
        heroCtaUrl: '/contact',
        introBannerText: 'من الاستشارات والتصميم الهندسي الأولي إلى ضمان التركيب لمدة ٢٤ شهراً والصيانة المستمرة.',
        introBannerCtaText: 'تواصل مع الفريق الهندسي',
        bodyContent:
          'تأسست شركة بارك المتحدة المحدودة في مدينة جدة عام ١٩٨٩ لتقديم حلول متكاملة لأنظمة المياه والمضخات ومعالجة الصرف الصحي للقطاعات السكنية والتجارية والزراعية والصناعية في المملكة العربية السعودية.',
        sectionsJson: {
          vision:
            'أن نكون الشريك الهندسي الأكثر موثوقية في المملكة للبنية التحتية المستدامة للمياه وتقنيات الضخ عالية الكفاءة والمقاولات المتكاملة.',
          mission:
            'توفير معدات عالمية لمعالجة ونقل السوائل مدعومة باستشارات هندسية محلية، وتوافر سريع لقطع الغيار، وخدمات صيانة على مدار الساعة.',
          chairmanMessagePlaceholder: true,
          chairmanMessage:
            '[قابل للتعديل من لوحة التحكم] كلمة رئيس مجلس الإدارة: منذ عام ١٩٨٩ تلتزم مجموعة بارك المتحدة بالموثوقية الهندسية وبناء شراكات طويلة الأمد في أنحاء المملكة. يمكن تحديث النص الرسمي هنا مباشرة من لوحة التحكم.',
          values: [
            'النزاهة الهندسية وجودة المصنعين العالميين',
            'المسؤولية المتكاملة من التصميم إلى التشغيل',
            'كفاءة الطاقة والحفاظ على الموارد المائية',
            'خدمة عملاء وصيانة سريعة الاستجابة',
          ],
        },
      },
    },
    {
      slug: 'partners',
      template: 'partners',
      heroImageUrl: '/images/partners-banner.jpg',
      sortOrder: 3,
      en: {
        title: 'Our Partners',
        heroHeading: 'OUR PARTNERS',
        heroSubheading: 'OVERVIEW OF OUR PARTNERS',
        heroCtaText: 'Become a Partner Inquiry',
        heroCtaUrl: '/contact',
        introBannerText: 'We can be your industrial agent, as we are for many well-known global companies.',
        introBannerCtaText: 'Request Product Quote',
        bodyContent:
          'United Park Group serves as an authorized Saudi distributor and technical support partner for leading international fluid-handling, pressure-vessel, and fire-safety manufacturers.',
        sectionsJson: {},
      },
      ar: {
        title: 'شركاؤنا',
        heroHeading: 'شركاؤنا',
        heroSubheading: 'نظرة عامة على شركائنا العالميين',
        heroCtaText: 'استفسار الشراكات',
        heroCtaUrl: '/contact',
        introBannerText: 'يمكننا أن نكون وكيلكم الصناعي المعتمد كما نمثل نخبة من كبرى الشركات العالمية.',
        introBannerCtaText: 'اطلب عرض سعر',
        bodyContent:
          'تعمل مجموعة بارك المتحدة كوكيل وموزع معتمد وشريك دعم فني في المملكة لأبرز المصنعين العالميين في تقنيات المضخات وخزانات الضغط وأنظمة مكافحة الحريق.',
        sectionsJson: {},
      },
    },
    {
      slug: 'park-pumps',
      template: 'division',
      heroImageUrl: '/images/hero-pumps.jpg',
      sortOrder: 4,
      en: {
        title: 'Park Pumps',
        heroHeading: 'PARK PUMPS DIVISION',
        heroSubheading: 'Authorized supply, sizing, commissioning, and maintenance of commercial and industrial pumping systems.',
        heroCtaText: 'Explore Pump Catalog',
        heroCtaUrl: '/products',
        introBannerText: 'Vertical multistage boosters, wastewater stations, solar pumping, and precision control panels.',
        introBannerCtaText: 'Request Pump Sizing',
        bodyContent:
          'Park Pumps supplies comprehensive pumping packages engineered for municipal water networks, high-rise commercial towers, agricultural irrigation, HVAC circulation, and industrial process loops.',
        sectionsJson: {},
      },
      ar: {
        title: 'بارك للمضخات',
        heroHeading: 'قطاع بارك للمضخات',
        heroSubheading: 'توريد واختيار وتشغيل وصيانة أنظمة المضخات التجارية والصناعية المعتمدة.',
        heroCtaText: 'تصفح كتالوج المضخات',
        heroCtaUrl: '/products',
        introBannerText: 'مضخات رفع الضغط متعددة المراحل، محطات الصرف الصحي، المضخات الشمسية، ولوحات التحكم.',
        introBannerCtaText: 'اطلب دراسة واختيار مضخة',
        bodyContent:
          'يوفر قطاع بارك للمضخات حزم ضخ متكاملة مصممة لشبكات المياه البلدية والأبراج التجارية والري الزراعي وأنظمة التكييف والعمليات الصناعية.',
        sectionsJson: {},
      },
    },
    {
      slug: 'park-contracting',
      template: 'division',
      heroImageUrl: '/images/sector-utilities.jpg',
      sortOrder: 5,
      en: {
        title: 'Park Contracting',
        heroHeading: 'PARK CONTRACTING DIVISION',
        heroSubheading: 'Specialized electromechanical contracting for water distribution networks, pumping stations, and drainage infrastructure.',
        heroCtaText: 'Request Contracting Bid',
        heroCtaUrl: '/quote',
        introBannerText: 'Turnkey installation, pipework fabrication, testing, commissioning, and 24-month installation warranty.',
        introBannerCtaText: 'Contact Contracting Desk',
        bodyContent:
          'Park Contracting executes specialized water and sewage infrastructure scopes including pumping station builds, sanitary and plumbing networks, hydro-pneumatic installations, and preventive maintenance contracts.',
        sectionsJson: {},
      },
      ar: {
        title: 'بارك للمقاولات',
        heroHeading: 'قطاع بارك للمقاولات',
        heroSubheading: 'مقاولات كهروميكانيكية متخصصة لشبكات توزيع المياه ومحطات الضخ والبنية التحتية للصرف.',
        heroCtaText: 'اطلب تسعير مشروع',
        heroCtaUrl: '/quote',
        introBannerText: 'تركيب متكامل، شبكات أنابيب، فحص وتشغيل تجريبي، وضمان تركيب لمدة ٢٤ شهراً.',
        introBannerCtaText: 'تواصل مع قسم المقاولات',
        bodyContent:
          'ينفذ قطاع بارك للمقاولات أعمال البنية التحتية للمياه والصرف الصحي بما في ذلك إنشاء وتجهيز محطات الضخ وشبكات التغذية والصرف وعقود الصيانة الوقائية.',
        sectionsJson: {},
      },
    },
    {
      slug: 'park-real-estate',
      template: 'division',
      heroImageUrl: '/images/partners-banner.jpg',
      sortOrder: 6,
      en: {
        title: 'Park Real Estate',
        heroHeading: 'PARK REAL ESTATE DIVISION',
        heroSubheading: 'Commercial and residential real estate development and property management aligned with Saudi urban growth.',
        heroCtaText: 'Inquire With Real Estate',
        heroCtaUrl: '/contact',
        introBannerText: 'Property development, facility infrastructure readiness, and long-term asset stewardship.',
        introBannerCtaText: 'Get In Touch',
        bodyContent:
          '[Editable in CMS] Park Real Estate complements United Park Group’s engineering heritage by supporting property development, commercial facilities, and asset operations across the Kingdom. Update specific portfolio properties and offerings in the CMS.',
        sectionsJson: { isPlaceholder: true },
      },
      ar: {
        title: 'بارك العقارية',
        heroHeading: 'قطاع بارك العقارية',
        heroSubheading: 'تطوير وإدارة الأصول العقارية التجارية والسكنية بما يواكب النمو العمراني في المملكة.',
        heroCtaText: 'استفسار عقاري',
        heroCtaUrl: '/contact',
        introBannerText: 'تطوير عقاري ببنية تحتية هندسية متكاملة وإدارة مستدامة للمرافق.',
        introBannerCtaText: 'تواصل معنا',
        bodyContent:
          '[قابل للتعديل من لوحة التحكم] يكمل قطاع بارك العقارية مسيرة مجموعة بارك المتحدة الهندسية من خلال تطوير وإدارة العقارات والمرافق التجارية في المملكة. يمكن إضافة تفاصيل المحفظة العقارية من لوحة التحكم.',
        sectionsJson: { isPlaceholder: true },
      },
    },
  ];

  for (const p of pageSeeds) {
    const [insertedPage] = await db
      .insert(pages)
      .values({
        slug: p.slug,
        template: p.template,
        heroImageUrl: p.heroImageUrl,
        isPublished: true,
        sortOrder: p.sortOrder,
      })
      .returning();

    await db.insert(pageTranslations).values([
      { pageId: insertedPage.id, locale: 'en', ...p.en },
      { pageId: insertedPage.id, locale: 'ar', ...p.ar },
    ]);
  }

  // 6. Services (6 core circular solutions from reference screenshots)
  const serviceSeeds = [
    {
      slug: 'irrigation-agriculture',
      iconName: 'Sprout',
      division: 'pumps',
      sortOrder: 1,
      en: {
        title: 'IRRIGATION & AGRICULTURE',
        shortDescription: 'With the growing demand for smart plantations, United Park supplies high-efficiency agricultural pumping systems.',
        fullDescription: 'Engineered submersible, borehole, and surface centrifugal pump packages designed for pivot irrigation, drip networks, and agricultural water transfer across Saudi climates.',
        featuresJson: ['Deep-well submersible solutions', 'Solar-ready DC/AC drive compatibility', 'Corrosion-resistant stainless steel hydraulics'],
      },
      ar: {
        title: 'الري والزراعة',
        shortDescription: 'مع تنامي الحاجة للمشاريع الزراعية الذكية، توفر بارك المتحدة مضخات عالية الكفاءة للري والزراعة.',
        fullDescription: 'حزم مضخات غاطسة وأفقية مصممة لأنظمة الري المحوري والتنقيط ونقل المياه الزراعية بكفاءة عالية في مختلف مناطق المملكة.',
        featuresJson: ['مضخات غاطسة للآبار العميقة', 'توافق مع أنظمة الطاقة الشمسية', 'مكونات مقاومة للتآكل والملوحة'],
      },
    },
    {
      slug: 'pressure-boosting',
      iconName: 'Gauge',
      division: 'pumps',
      sortOrder: 2,
      en: {
        title: 'PRESSURE BOOSTING',
        shortDescription: 'We deliver reliable variable-speed pressure boosting packages built for rapid urbanization and modern buildings.',
        fullDescription: 'Packaged multi-pump booster sets with variable frequency drives (VFDs) maintaining constant water pressure across residential compounds, hospitals, hotels, and commercial towers.',
        featuresJson: ['Constant-pressure VFD control', 'Low acoustic operation & energy savings', 'Pre-assembled stainless manifolds'],
      },
      ar: {
        title: 'تعزيز الضخ والضغط',
        shortDescription: 'نقدم حلولاً هندسية موثوقة لرفع وتعزيز ضغط المياه لمواكبة التوسع العمراني والمباني الحديثة.',
        fullDescription: 'مجموعات ضخ متعددة المضخات مزودة بمحركات متغيرة السرعة للحفاظ على ضغط مياه مستقر في المجمعات السكنية والمستشفيات والأبراج التجارية.',
        featuresJson: ['تحكم إلكتروني متغير السرعة', 'توفير في استهلاك الطاقة وتشغيل هادئ', 'مجمعات أنابيب من الفولاذ المقاوم للصدأ'],
      },
    },
    {
      slug: 'wastewater-experts',
      iconName: 'Waves',
      division: 'pumps',
      sortOrder: 3,
      en: {
        title: 'WASTEWATER EXPERTS',
        shortDescription: 'We simplify complex drainage challenges with proven heavy-duty wastewater pumping and lifting technology.',
        fullDescription: 'Non-clogging submersible sewage pumps, grinder systems, packaged lifting stations, and municipal transfer skids built for continuous operation under demanding solids loads.',
        featuresJson: ['Vortex & channel impeller options', 'Automated level-control panels', 'Turnkey lifting station supply & service'],
      },
      ar: {
        title: 'حلول الصرف الصحي',
        shortDescription: 'نبسّط تحديات الصرف الصحي عبر تقنيات متطورة وموثوقة لضخ ومعالجة مياه الصرف.',
        fullDescription: 'مضخات صرف صحي غاطسة مقاومة للانسداد، ومضخات تقطيع، ومحطات رفع مجمعة للخدمة المستمرة في المشاريع التجارية والبلدية.',
        featuresJson: ['دفاعات مقاومة للانسداد والشوائب', 'لوحات تحكم أوتوماتيكية لمستوى السوائل', 'توريد وصيانة محطات الرفع المتكاملة'],
      },
    },
    {
      slug: 'water-treatment',
      iconName: 'Droplets',
      division: 'pumps',
      sortOrder: 4,
      en: {
        title: 'WATER TREATMENT',
        shortDescription: 'Our precision dosing and circulation pumps form the dependable core of modern water treatment systems.',
        fullDescription: 'Chemical dosing pumps, RO feed multistage boosters, UV/disinfection integration, and automated water quality instrumentation for potable and industrial process water.',
        featuresJson: ['Precision digital dosing control', 'High-pressure RO feed pumps', 'Disinfection & sensor integration'],
      },
      ar: {
        title: 'معالجة المياه',
        shortDescription: 'تشكل مضخاتنا القلب النابض لأنظمة التدوير ومعالجة المياه بدقة واعتمادية عالية.',
        fullDescription: 'مضخات حقن كيميائي دقيقة، ومضخات تغذية محطات التحلية، وأنظمة تعقيم وأجهزة قياس ومراقبة جودة المياه.',
        featuresJson: ['حقن رقمي عالي الدقة للمواد الكيميائية', 'مضخات تغذية عالية الضغط لتحلية المياه', 'تكامل مع أنظمة التعقيم والحساسات'],
      },
    },
    {
      slug: 'cooling-systems',
      iconName: 'Snowflake',
      division: 'pumps',
      sortOrder: 5,
      en: {
        title: 'COOLING SYSTEMS',
        shortDescription: 'United Park supplies chilled-water circulation pumps and system accessories with full engineering support.',
        fullDescription: 'End-suction, inline, and split-case chilled-water pumps paired with expansion vessels, air/dirt separators, and balancing components for district and HVAC cooling plants.',
        featuresJson: ['Chilled-water inline & end-suction pumps', 'Reflex expansion & degassing vessels', 'Complete commissioning support'],
      },
      ar: {
        title: 'أنظمة التبريد',
        shortDescription: 'توفر بارك المتحدة مضخات ومكونات شبكات التبريد عبر مصنعين عالميين مع دعم فني متكامل.',
        fullDescription: 'مضخات تدوير المياه المبردة لأنظمة التكييف المركزي والتبريد المناطقي مع خزانات التمدد وفواصل الهواء والشوائب.',
        featuresJson: ['مضخات تدوير أفقية وخطية للمياه المبردة', 'خزانات تمدد وأنظمة تفريغ الهواء', 'دعم هندسي وفني شامل'],
      },
    },
    {
      slug: 'heating-systems',
      iconName: 'Flame',
      division: 'pumps',
      sortOrder: 6,
      en: {
        title: 'HEATING SYSTEMS',
        shortDescription: 'We analyze and engineer smooth thermal circulation for hot water loops, boilers, and hydronic networks.',
        fullDescription: 'High-temperature wet-rotor circulators, mixing loops, expansion vessels, and thermal sensors ensuring balanced heat transfer in commercial and residential complexes.',
        featuresJson: ['Hot water recirculation loops', 'Mixing valves & temperature sensors', '24-month installation warranty'],
      },
      ar: {
        title: 'أنظمة التدفئة',
        shortDescription: 'نحلل ونصمم حلول التدفق الحراري السلس لشبكات المياه الساخنة والمراجل والتدفئة المركزية.',
        fullDescription: 'مضخات تدوير المياه الساخنة وحلقات الخلط وخزانات التمدد الحرارية لضمان توزيع متوازن وآمن للحرارة في المباني.',
        featuresJson: ['شبكات تدوير المياه الساخنة', 'صمامات خلط وحساسات حرارة دقيقة', 'ضمان تركيب لمدة ٢٤ شهراً'],
      },
    },
  ];

  for (const s of serviceSeeds) {
    const [inserted] = await db
      .insert(services)
      .values({
        slug: s.slug,
        iconName: s.iconName,
        division: s.division,
        sortOrder: s.sortOrder,
        isFeatured: true,
        isPublished: true,
      })
      .returning();

    await db.insert(serviceTranslations).values([
      { serviceId: inserted.id, locale: 'en', ...s.en },
      { serviceId: inserted.id, locale: 'ar', ...s.ar },
    ]);
  }

  // 7. Partners (Verified PARK partners)
  const partnerSeeds = [
    {
      slug: 'grundfos',
      name: 'Grundfos',
      websiteUrl: 'https://www.grundfos.com',
      country: 'Denmark',
      categoryLabelEn: 'Global Pump Manufacturer',
      categoryLabelAr: 'الشركة العالمية الرائدة للمضخات',
      sortOrder: 1,
      en: {
        displayName: 'Grundfos',
        tagline: 'Authorized Agent & Technical Partner',
        description:
          'United Park Group serves as an authorized agent for Grundfos in Saudi Arabia, delivering energy-efficient centrifugal pumps, Hydro MPC booster sets, dosing systems, and certified after-sales support.',
        highlightsJson: ['Booster & Pressure Systems', 'Wastewater & Submersible Pumps', 'Digital Dosing & Controls'],
      },
      ar: {
        displayName: 'جراندفوس (Grundfos)',
        tagline: 'وكيل معتمد وشريك دعم فني',
        description:
          'تعمل مجموعة بارك المتحدة كوكيل معتمد لشركة جراندفوس في المملكة، حيث توفر مضخات عالية الكفاءة وأنظمة رفع الضغط ومضخات الحقن وخدمات الصيانة المعتمدة.',
        highlightsJson: ['أنظمة رفع الضغط والتعزيز', 'مضخات الصرف الصحي والغاطسة', 'أنظمة الحقن والتحكم الرقمي'],
      },
    },
    {
      slug: 'reflex',
      name: 'Reflex Winkelmann',
      websiteUrl: 'https://www.reflex-winkelmann.com',
      country: 'Germany',
      categoryLabelEn: 'Water-Bearing & Pressure Systems',
      categoryLabelAr: 'أنظمة التمدد والتحكم بالضغط',
      sortOrder: 2,
      en: {
        displayName: 'Reflex — Thinking Solutions',
        tagline: 'German Water-Bearing & Expansion Technology',
        description:
          'Partnering with Reflex Winkelmann GmbH, United Park supplies membrane expansion vessels, pressure-maintaining stations, and air/dirt separation systems for HVAC and potable water networks.',
        highlightsJson: ['Membrane Expansion Vessels', 'Pressurization & Degassing Units', 'Air & Dirt Separators'],
      },
      ar: {
        displayName: 'ريفلكس (Reflex)',
        tagline: 'تقنيات ألمانية لأنظمة التمدد والضغط',
        description:
          'بالشراكة مع ريفلكس وينكلمان الألمانية، توفر بارك المتحدة خزانات التمدد الغشائية ووحدات تثبيت الضغط وفواصل الهواء والشوائب لشبكات التكييف والمياه.',
        highlightsJson: ['خزانات التمدد الغشائية', 'وحدات تثبيت الضغط وتفريغ الغازات', 'فواصل الهواء والشوائب'],
      },
    },
    {
      slug: 'global-water-solutions',
      name: 'Global Water Solutions',
      websiteUrl: 'https://www.globalwatersolutions.com',
      country: 'International',
      categoryLabelEn: 'Pressure Vessels & Water Storage',
      categoryLabelAr: 'خزانات الضغط وحفظ المياه',
      sortOrder: 3,
      en: {
        displayName: 'Global Water Solutions (GWS)',
        tagline: 'Potable Pressure Tanks & Water Components',
        description:
          'United Park distributes Global Water Solutions diaphragm pressure tanks and water storage vessels engineered for long service life in residential, commercial, and booster pump stations.',
        highlightsJson: ['PressureWave Diaphragm Tanks', 'High-Temperature Expansion Vessels', 'NSF-Certified Potable Liners'],
      },
      ar: {
        displayName: 'جلوبال ووتر سوليوشنز (GWS)',
        tagline: 'خزانات الضغط ومكونات شبكات المياه',
        description:
          'توفر بارك المتحدة خزانات الضغط الغشائية من جلوبال ووتر سوليوشنز المصممة لعمر تشغيلي طويل في محطات الضخ السكنية والتجارية.',
        highlightsJson: ['خزانات الضغط الغشائية PressureWave', 'خزانات التمدد لدرجات الحرارة المرتفعة', 'بطانات معتمدة لمياه الشرب'],
      },
    },
    {
      slug: 'bristol-fire',
      name: 'Bristol Fire Engineering',
      websiteUrl: 'https://www.bristol-fire.com',
      country: 'UAE / International',
      categoryLabelEn: 'Fire Protection Systems',
      categoryLabelAr: 'أنظمة مكافحة الحريق',
      sortOrder: 4,
      en: {
        displayName: 'Bristol Fire',
        tagline: 'Certified Fire-Fighting Equipment & Safety Integration',
        description:
          'As a trusted distributor for Bristol Fire, United Park integrates UL/FM-compliant fire-fighting pumps, cabinets, and suppression hardware into commercial and industrial developments.',
        highlightsJson: ['Fire Fighting Pump Packages', 'Fire Hose Reels & Cabinets', 'Industrial Safety Compliance'],
      },
      ar: {
        displayName: 'بريستول فاير (Bristol Fire)',
        tagline: 'معدات مكافحة الحريق والسلامة المعتمدة',
        description:
          'بصفتها موزعاً معتمداً لبريستول فاير، تدمج بارك المتحدة مضخات ومعدات مكافحة الحريق المعتمدة ضمن المشاريع التجارية والصناعية.',
        highlightsJson: ['حزم مضخات مكافحة الحريق', 'كبائن وخراطيم الإطفاء المعتمدة', 'توافق مع معايير السلامة الصناعية'],
      },
    },
    {
      slug: 'ameriflo',
      name: 'Ameriflo',
      websiteUrl: 'https://www.ameriflo-usa.com',
      country: 'United States',
      categoryLabelEn: 'Industrial & Fire Pump Skids',
      categoryLabelAr: 'مضخات الحريق والصناعة المجمعة',
      sortOrder: 5,
      en: {
        displayName: 'Ameriflo',
        tagline: 'Integrated Engine-Driven & Skid Pump Systems',
        description:
          'United Park supplies Ameriflo heavy-duty horizontal split-case, vertical turbine, and packaged fire-pump skid assemblies for large-scale industrial utilities.',
        highlightsJson: ['Split-Case & Vertical Turbine Pumps', 'Diesel & Electric Fire Skids', 'Heavy Industrial Applications'],
      },
      ar: {
        displayName: 'أميريفلو (Ameriflo)',
        tagline: 'أنظمة مضخات صناعية ومضخات حريق مجمعة',
        description:
          'توفر بارك المتحدة مضخات أميريفلو الثقيلة ذات الغلاف المنقسم والتوربينية العمودية ووحدات الحريق المجمعة للمنشآت الصناعية الكبرى.',
        highlightsJson: ['مضخات الغلاف المنقسم والتوربينية', 'وحدات حريق ديزل وكهربائية مجمعة', 'تطبيقات صناعية ثقيلة'],
      },
    },
  ];

  const insertedPartners: Array<{ id: number; slug: string }> = [];
  for (const p of partnerSeeds) {
    const [inserted] = await db
      .insert(partners)
      .values({
        slug: p.slug,
        name: p.name,
        websiteUrl: p.websiteUrl,
        country: p.country,
        categoryLabelEn: p.categoryLabelEn,
        categoryLabelAr: p.categoryLabelAr,
        sortOrder: p.sortOrder,
        isFeatured: true,
        isPublished: true,
      })
      .returning();
    insertedPartners.push({ id: inserted.id, slug: inserted.slug });

    await db.insert(partnerTranslations).values([
      { partnerId: inserted.id, locale: 'en', ...p.en },
      { partnerId: inserted.id, locale: 'ar', ...p.ar },
    ]);
  }

  const partnerIdBySlug = (slug: string) =>
    insertedPartners.find((p) => p.slug === slug)?.id ?? null;

  // 8. Product Categories (verified park.com.sa categories)
  const categorySeeds = [
    {
      slug: 'pump-systems',
      sortOrder: 1,
      imageUrl: '/images/product-pump.jpg',
      nameEn: 'Pump Systems & Boosters',
      nameAr: 'أنظمة المضخات ورفع الضغط',
      descriptionEn: 'Vertical multistage boosters, end-suction pumps, and turnkey multi-pump pressure sets.',
      descriptionAr: 'مضخات متعددة المراحل ووحدات رفع الضغط المتكاملة للمباني والمشاريع.',
    },
    {
      slug: 'pump-motors',
      sortOrder: 2,
      imageUrl: '/images/facility-pump-room.jpg',
      nameEn: 'Pump Motors & Drives',
      nameAr: 'محركات المضخات ومغيرات السرعة',
      descriptionEn: 'High-efficiency IE3/IE4 electric motors and variable frequency drives for continuous duty.',
      descriptionAr: 'محركات كهربائية عالية الكفاءة ومغيرات سرعة للتشغيل الصناعي المستمر.',
    },
    {
      slug: 'disinfection-systems',
      sortOrder: 3,
      imageUrl: '/images/facility-pump-room.jpg',
      nameEn: 'Disinfection & Dosing Systems',
      nameAr: 'أنظمة التعقيم والحقن الكيميائي',
      descriptionEn: 'Digital chemical dosing pumps, chlorination skids, and potable water disinfection units.',
      descriptionAr: 'مضخات حقن رقمية ووحدات كلورة وتعقيم لمياه الشرب والمعالجة.',
    },
    {
      slug: 'solar-solutions',
      sortOrder: 4,
      imageUrl: '/images/sector-utilities.jpg',
      nameEn: 'Solar Pumping Solutions',
      nameAr: 'حلول الضخ بالطاقة الشمسية',
      descriptionEn: 'Renewable solar-powered submersible and surface water transfer systems for remote sites.',
      descriptionAr: 'أنظمة ضخ مياه تعمل بالطاقة الشمسية للمزارع والمواقع البعيدة.',
    },
    {
      slug: 'mixing-loops-vessels',
      sortOrder: 5,
      imageUrl: '/images/product-pump.jpg',
      nameEn: 'Expansion Vessels & Mixing Loops',
      nameAr: 'خزانات التمدد وحلقات الخلط',
      descriptionEn: 'Potable diaphragm pressure tanks, thermal expansion vessels, and hydronic mixing accessories.',
      descriptionAr: 'خزانات الضغط والتمدد الحراري ومكونات الدوائر المائية المغلقة.',
    },
    {
      slug: 'measurements-controls',
      sortOrder: 6,
      imageUrl: '/images/hero-pumps.jpg',
      nameEn: 'Measurements & Control Panels',
      nameAr: 'أجهزة القياس ولوحات التحكم',
      descriptionEn: 'Pressure transmitters, level sensors, BMS-ready control panels, and protection relays.',
      descriptionAr: 'حساسات الضغط والمستوى ولوحات التحكم الذكية المتوافقة مع أنظمة إدارة المباني.',
    },
  ];

  const insertedCats: Array<{ id: number; slug: string }> = [];
  for (const cat of categorySeeds) {
    const [inserted] = await db.insert(productCategories).values(cat).returning();
    insertedCats.push({ id: inserted.id, slug: inserted.slug });
  }
  const catIdBySlug = (slug: string) =>
    insertedCats.find((c) => c.slug === slug)?.id ?? null;

  // 9. Products (Grounded in PARK's verified product families & partner brands)
  const productSeeds = [
    {
      sku: 'PRK-CR-250',
      slug: 'vertical-multistage-booster-cr',
      categorySlug: 'pump-systems',
      partnerSlug: 'grundfos',
      imageUrl: '/images/product-pump.jpg',
      division: 'pumps',
      isFeatured: true,
      sortOrder: 1,
      en: {
        name: 'Vertical Multistage Booster Series (VMS / CR)',
        summary: 'Stainless steel inline multistage centrifugal pump engineered for commercial pressure boosting and water treatment.',
        description:
          'Built with corrosion-resistant AISI 304/316 wetted parts and IE3 high-efficiency motors, ideal for RO feed, high-rise boosting, and industrial circulation.',
        specificationsJson: [
          { label: 'Flow Range', value: '1 – 180', unit: 'm³/h' },
          { label: 'Max Head', value: 'Up to 320', unit: 'm' },
          { label: 'Liquid Temp', value: '-20 to +120', unit: '°C' },
          { label: 'Max Operating Pressure', value: '25 / 30', unit: 'bar' },
          { label: 'Motor Efficiency', value: 'IE3 / IE4', unit: '50/60 Hz' },
        ],
        applicationsJson: ['Commercial Pressure Boosting', 'Reverse Osmosis & Filtration', 'HVAC & Industrial Washdown'],
      },
      ar: {
        name: 'مضخات الرفع العمودية متعددة المراحل',
        summary: 'مضخة طرد مركزي عمودية من الفولاذ المقاوم للصدأ مصممة لرفع الضغط ومعالجة المياه.',
        description:
          'مصنعة من الفولاذ المقاوم للصدأ AISI 304/316 مع محركات عالية الكفاءة IE3، مثالية لتغذية محطات التحلية وأنظمة الأبراج التجارية والتطبيقات الصناعية.',
        specificationsJson: [
          { label: 'معدل التدفق', value: '١ – ١٨٠', unit: 'م³/ساعة' },
          { label: 'أقصى ارتفاع ضخ', value: 'حتى ٣٢٠', unit: 'متر' },
          { label: 'درجة حرارة السائل', value: '-٢٠ إلى +١٢٠', unit: 'مئوية' },
          { label: 'أقصى ضغط تشغيل', value: '٢٥ / ٣٠', unit: 'بار' },
          { label: 'كفاءة المحرك', value: 'IE3 / IE4', unit: '٥٠/٦٠ هرتز' },
        ],
        applicationsJson: ['تعزيز الضغط في المباني التجارية', 'محطات التناضح العكسي والتحلية', 'أنظمة التبريد والعمليات الصناعية'],
      },
    },
    {
      sku: 'PRK-HYDRO-VFD',
      slug: 'packaged-vfd-booster-skid',
      categorySlug: 'pump-systems',
      partnerSlug: 'grundfos',
      imageUrl: '/images/facility-pump-room.jpg',
      division: 'pumps',
      isFeatured: true,
      sortOrder: 2,
      en: {
        name: 'Packaged Multi-Pump VFD Booster Station',
        summary: 'Pre-assembled 2-to-4 pump constant-pressure booster skid with PLC cascade control and stainless manifolds.',
        description:
          'Complete plug-and-pump station factory-tested for hospitals, hotels, universities, and municipal water transfer networks.',
        specificationsJson: [
          { label: 'Pump Configuration', value: '2 – 4 Pumps', unit: 'Duty / Standby' },
          { label: 'Control Logic', value: 'VFD Cascade PLC', unit: 'BMS Modbus' },
          { label: 'Manifold Material', value: 'SS 316L', unit: 'PN16 / PN25' },
          { label: 'Warranty', value: '24 Months', unit: 'Upon Commissioning' },
        ],
        applicationsJson: ['Hospitals & Campuses', 'High-Rise Residential Towers', 'Industrial Utility Networks'],
      },
      ar: {
        name: 'محطة رفع ضغط مجمعة متغيرة السرعة (VFD)',
        summary: 'مجموعة ضخ متكاملة من ٢ إلى ٤ مضخات مع لوحة تحكم ذكية ومجمعات ستانلس ستيل.',
        description:
          'محطة ضخ جاهزة للتشغيل ومختبرة مصنعياً للمستشفيات والفنادق والجامعات وشبكات نقل المياه البلدية.',
        specificationsJson: [
          { label: 'تكوين المضخات', value: '٢ – ٤ مضخات', unit: 'تشغيل / احتياط' },
          { label: 'نظام التحكم', value: 'PLC + VFD', unit: 'متوافق مع BMS' },
          { label: 'خامة المجمعات', value: 'SS 316L', unit: 'PN16 / PN25' },
          { label: 'الضمان', value: '٢٤ شهراً', unit: 'بعد التشغيل' },
        ],
        applicationsJson: ['المستشفيات والجامعات', 'الأبراج السكنية والتجارية', 'شبكات المرافق الصناعية'],
      },
    },
    {
      sku: 'PRK-RFX-EXP',
      slug: 'reflex-membrane-expansion-vessel',
      categorySlug: 'mixing-loops-vessels',
      partnerSlug: 'reflex',
      imageUrl: '/images/product-pump.jpg',
      division: 'pumps',
      isFeatured: true,
      sortOrder: 3,
      en: {
        name: 'Reflex Membrane Expansion & Pressure Vessel',
        summary: 'German-engineered closed expansion vessel and pressurization unit for chilled and heating loops.',
        description:
          'Protects HVAC chillers, boilers, and booster lines against pressure surges while maintaining optimal system static pressure.',
        specificationsJson: [
          { label: 'Nominal Volume', value: '50 – 5,000', unit: 'Liters' },
          { label: 'Max Operating Pressure', value: '10 / 16', unit: 'bar' },
          { label: 'Diaphragm Standard', value: 'EN 13831', unit: 'Replaceable Bladder' },
        ],
        applicationsJson: ['District Cooling Plants', 'Chilled & Hot Water Loops', 'Potable Booster Surge Control'],
      },
      ar: {
        name: 'خزان تمدد وضغط غشائي (Reflex)',
        summary: 'خزان تمدد مغلق ووحدة تثبيت ضغط ألمانية الصنع لشبكات التبريد والتدفئة.',
        description:
          'يحمي مبردات التكييف والمراجل وخطوط الضخ من ارتفاعات الضغط المفاجئة ويحافظ على استقرار الشبكة.',
        specificationsJson: [
          { label: 'السعة الاسمية', value: '٥٠ – ٥,٠٠٠', unit: 'لتر' },
          { label: 'أقصى ضغط تشغيل', value: '١٠ / ١٦', unit: 'بار' },
          { label: 'المعيار القياسي', value: 'EN 13831', unit: 'غشاء قابل للاستبدال' },
        ],
        applicationsJson: ['محطات التبريد المركزي', 'شبكات المياه المبردة والساخنة', 'حماية شبكات الرفع من المطرقة المائية'],
      },
    },
    {
      sku: 'PRK-GWS-PW',
      slug: 'gws-pressurewave-potable-tank',
      categorySlug: 'mixing-loops-vessels',
      partnerSlug: 'global-water-solutions',
      imageUrl: '/images/product-pump.jpg',
      division: 'pumps',
      isFeatured: false,
      sortOrder: 4,
      en: {
        name: 'GWS PressureWave Potable Pressure Tank',
        summary: 'Maintenance-free butyl diaphragm pressure vessel designed for clean domestic and commercial water supply.',
        description:
          'Features virgin polypropylene liner, two-part polyurethane finish, and leak-free brass air valve to reduce pump cycling.',
        specificationsJson: [
          { label: 'Capacity Range', value: '24 – 450', unit: 'Liters' },
          { label: 'Max Working Pressure', value: '10', unit: 'bar' },
          { label: 'Certification', value: 'NSF / CE', unit: 'Potable Grade' },
        ],
        applicationsJson: ['Residential Booster Sets', 'Irrigation Pressure Stabilization', 'Thermal Expansion'],
      },
      ar: {
        name: 'خزان ضغط مياه شرب GWS PressureWave',
        summary: 'خزان ضغط غشائي لا يحتاج لصيانة مصمم لتطبيقات مياه الشرب التجارية والسكنية.',
        description:
          'يتميز ببطانة داخلية صحية وطلاء مقاوم للظروف المناخية لتقليل عدد مرات تشغيل وإيقاف المضخة.',
        specificationsJson: [
          { label: 'نطاق السعة', value: '٢٤ – ٤٥٠', unit: 'لتر' },
          { label: 'أقصى ضغط عمل', value: '١٠', unit: 'بار' },
          { label: 'الاعتماد', value: 'NSF / CE', unit: 'صالح لمياه الشرب' },
        ],
        applicationsJson: ['مجموعات الرفع السكنية', 'تثبيت ضغط شبكات الري', 'التمدد الحراري'],
      },
    },
    {
      sku: 'PRK-DOS-DME',
      slug: 'digital-chemical-dosing-skid',
      categorySlug: 'disinfection-systems',
      partnerSlug: 'grundfos',
      imageUrl: '/images/facility-pump-room.jpg',
      division: 'pumps',
      isFeatured: false,
      sortOrder: 5,
      en: {
        name: 'Precision Digital Dosing & Disinfection Skid',
        summary: 'Stepper-motor diaphragm dosing system for accurate water treatment, chlorination, and pH correction.',
        description:
          'Delivers smooth continuous chemical injection with flow-proportional feedback and integrated calibration column.',
        specificationsJson: [
          { label: 'Dosing Flow', value: '0.002 – 940', unit: 'L/h' },
          { label: 'Turndown Ratio', value: '1 : 3000', unit: 'Digital Stepper' },
          { label: 'Enclosure', value: 'IP65', unit: 'Chemical Resistant' },
        ],
        applicationsJson: ['Municipal Water Disinfection', 'Industrial Boiler & Cooling Treatment', 'RO Antiscalant Dosing'],
      },
      ar: {
        name: 'وحدة الحقن الكيميائي والتعقيم الرقمية',
        summary: 'نظام حقن كيميائي دقيق بمحرك خطوي لتطبيقات الكلورة ومعالجة المياه وتعديل الحموضة.',
        description:
          'يوفر حقناً مستمراً ومتناسقاً مع معدل التدفق مع حماية عالية وتوافق مع محطات التحلية والمعالجة.',
        specificationsJson: [
          { label: 'معدل الحقن', value: '٠.٠٠٢ – ٩٤٠', unit: 'لتر/ساعة' },
          { label: 'نسبة الضبط', value: '١ : ٣٠٠٠', unit: 'تحكم رقمي' },
          { label: 'درجة الحماية', value: 'IP65', unit: 'مقاوم للكيماويات' },
        ],
        applicationsJson: ['تعقيم مياه الشرب', 'معالجة مياه المراجل والتبريد', 'حقن مانعات الترسب لمحطات التحلية'],
      },
    },
    {
      sku: 'PRK-AMF-FIRE',
      slug: 'industrial-fire-pump-package',
      categorySlug: 'pump-systems',
      partnerSlug: 'ameriflo',
      imageUrl: '/images/hero-pumps.jpg',
      division: 'pumps',
      isFeatured: true,
      sortOrder: 6,
      en: {
        name: 'Industrial & Fire-Fighting Pump Skid Package',
        summary: 'Heavy-duty electric, diesel, and jockey fire pump package engineered for commercial and industrial protection.',
        description:
          'Integrated skid assemblies combining main horizontal split-case or end-suction fire pumps, listed controllers, and manifold headers.',
        specificationsJson: [
          { label: 'Rated Flow', value: '250 – 2,500', unit: 'GPM' },
          { label: 'Drive Options', value: 'Electric / Diesel', unit: '+ Jockey Pump' },
          { label: 'Standards', value: 'NFPA 20', unit: 'UL / FM Configs' },
        ],
        applicationsJson: ['Warehouses & Industrial Plants', 'Hospitals & Universities', 'Commercial Complexes'],
      },
      ar: {
        name: 'حزمة مضخات مكافحة الحريق والصناعة المجمعة',
        summary: 'نظام متكامل لمضخات الحريق الكهربائية والديزل والمضخة المساعدة لحماية المنشآت.',
        description:
          'وحدة مجمعة على قاعدة فولاذية تضم المضخات الرئيسية ولوحات التحكم المعتمدة ووصلات الاختبار والسلامة.',
        specificationsJson: [
          { label: 'التدفق الاسمي', value: '٢٥٠ – ٢,٥٠٠', unit: 'جالون/دقيقة' },
          { label: 'خيارات التشغيل', value: 'كهربائي / ديزل', unit: '+ مضخة جوكي' },
          { label: 'المعايير', value: 'NFPA 20', unit: 'خيارات UL / FM' },
        ],
        applicationsJson: ['المصانع والمستودعات', 'المستشفيات والجامعات', 'المجمعات التجارية الكبرى'],
      },
    },
  ];

  for (const pr of productSeeds) {
    const [inserted] = await db
      .insert(products)
      .values({
        sku: pr.sku,
        slug: pr.slug,
        categoryId: catIdBySlug(pr.categorySlug),
        partnerId: partnerIdBySlug(pr.partnerSlug),
        imageUrl: pr.imageUrl,
        division: pr.division,
        isFeatured: pr.isFeatured,
        isPublished: true,
        sortOrder: pr.sortOrder,
      })
      .returning();

    await db.insert(productTranslations).values([
      { productId: inserted.id, locale: 'en', ...pr.en },
      { productId: inserted.id, locale: 'ar', ...pr.ar },
    ]);
  }

  // 10. Verified Clients & Projects (using verified PARK client institutions)
  const clientSeeds = [
    { nameEn: 'King Abdulaziz University', nameAr: 'جامعة الملك عبدالعزيز', sector: 'Higher Education', sortOrder: 1, isPlaceholder: false },
    { nameEn: 'King Faisal Specialist Hospital', nameAr: 'مستشفى الملك فيصل التخصصي', sector: 'Healthcare', sortOrder: 2, isPlaceholder: false },
    { nameEn: 'King Abdullah Sport City', nameAr: 'مدينة الملك عبدالله الرياضية', sector: 'Sports & Public Venues', sortOrder: 3, isPlaceholder: false },
    { nameEn: 'Municipal Water & Sewage Utilities', nameAr: 'مرافق المياه والصرف الصحي البلدية', sector: 'Public Infrastructure', sortOrder: 4, isPlaceholder: false },
  ];
  const insertedClients: Array<{ id: number; nameEn: string }> = [];
  for (const c of clientSeeds) {
    const [inserted] = await db.insert(clients).values({ ...c, isFeatured: true }).returning();
    insertedClients.push({ id: inserted.id, nameEn: inserted.nameEn });
  }

  const projectSeeds = [
    {
      slug: 'king-abdulaziz-university-water-systems',
      clientId: insertedClients[0]?.id ?? null,
      category: 'Campus Water & Boosting',
      division: 'pumps',
      locationEn: 'Jeddah, Saudi Arabia',
      locationAr: 'جدة، المملكة العربية السعودية',
      completionYear: 'Verified Reference',
      imageUrl: '/images/facility-pump-room.jpg',
      isFeatured: true,
      isPlaceholder: false,
      en: {
        title: 'King Abdulaziz University — Pumping & Water Distribution',
        summary: 'Supply and engineering support of high-capacity water pumping and boosting systems serving university campus facilities.',
        scopeOfWork: 'Multi-pump booster sets, circulation systems, and technical commissioning support. (Detailed capacity metrics can be edited in CMS.)',
        outcomeNotes: 'Reliable continuous water distribution across academic and residential campus zones.',
      },
      ar: {
        title: 'جامعة الملك عبدالعزيز — أنظمة الضخ وتوزيع المياه',
        summary: 'توريد ودعم هندسي لأنظمة ضخ وتعزيز المياه عالية السعة لخدمة مرافق الحرم الجامعي.',
        scopeOfWork: 'محطات رفع متعددة المضخات وأنظمة تدوير ودعم التشغيل التجريبي. (يمكن تعديل تفاصيل المشروع من لوحة التحكم).',
        outcomeNotes: 'توزيع مستمر ومستقر للمياه في المرافق الأكاديمية والسكنية.',
      },
    },
    {
      slug: 'king-faisal-specialist-hospital-jeddah',
      clientId: insertedClients[1]?.id ?? null,
      category: 'Healthcare Fluid Infrastructure',
      division: 'pumps',
      locationEn: 'Jeddah, Saudi Arabia',
      locationAr: 'جدة، المملكة العربية السعودية',
      completionYear: 'Verified Reference',
      imageUrl: '/images/hero-pumps.jpg',
      isFeatured: true,
      isPlaceholder: false,
      en: {
        title: 'King Faisal Specialist Hospital — Critical Pumping Systems',
        summary: 'Provision of dependable potable water boosting and HVAC circulation equipment for healthcare operations in Jeddah.',
        scopeOfWork: 'Redundant booster skids, hygienic water systems, and after-sales maintenance readiness.',
        outcomeNotes: 'Continuous utility uptime supporting 24/7 hospital facility operations.',
      },
      ar: {
        title: 'مستشفى الملك فيصل التخصصي بجدة — أنظمة الضخ الحرجة',
        summary: 'توريد أنظمة رفع مياه الشرب وتدوير التكييف عالية الاعتمادية لخدمة المرافق الطبية في جدة.',
        scopeOfWork: 'محطات رفع بآلية احتياط أوتوماتيكية وأنظمة مياه صحية وجاهزية صيانة مستمرة.',
        outcomeNotes: 'تشغيل متواصل ومستقر يدعم مرافق المستشفى على مدار الساعة.',
      },
    },
    {
      slug: 'king-abdullah-sport-city-water-network',
      clientId: insertedClients[2]?.id ?? null,
      category: 'Public Venue Infrastructure',
      division: 'contracting',
      locationEn: 'Jeddah, Saudi Arabia',
      locationAr: 'جدة، المملكة العربية السعودية',
      completionYear: 'Verified Reference',
      imageUrl: '/images/sector-utilities.jpg',
      isFeatured: true,
      isPlaceholder: false,
      en: {
        title: 'King Abdullah Sport City — Water & Utility Pumping',
        summary: 'Supply of integrated pumping and pressure-management systems for large-scale stadium and utility infrastructure.',
        scopeOfWork: 'High-flow transfer pumps, pressure vessels, and technical coordination.',
        outcomeNotes: 'Engineered to handle peak event demand efficiently.',
      },
      ar: {
        title: 'مدينة الملك عبدالله الرياضية — شبكات الضخ والمرافق',
        summary: 'توريد أنظمة ضخ وتنظيم ضغط متكاملة للمنشآت الرياضية والمرافق المصاحبة.',
        scopeOfWork: 'مضخات نقل عالية التدفق وخزانات ضغط وتنسيق فني.',
        outcomeNotes: 'تصميم يتحمل ذروة الاستهلاك خلال الفعاليات الكبرى بكفاءة.',
      },
    },
    {
      slug: 'western-region-municipal-sewage-transfer',
      clientId: insertedClients[3]?.id ?? null,
      category: 'Wastewater & Sewage Transfer',
      division: 'contracting',
      locationEn: 'Jeddah, Makkah & Madinah Regions',
      locationAr: 'مناطق جدة ومكة والمدينة المنورة',
      completionYear: 'Ongoing Operations',
      imageUrl: '/images/sector-utilities.jpg',
      isFeatured: true,
      isPlaceholder: false,
      en: {
        title: 'Municipal Water & Sewage Transfer Facilities',
        summary: 'Integrated supply, installation, and maintenance of sewage transfer and water treatment pumping infrastructure across Saudi regions.',
        scopeOfWork: 'Heavy-duty wastewater pumping packages, control panels, and 24-month warranty support.',
        outcomeNotes: 'Supporting municipal water resilience across Jeddah, Madinah, Yanbu, Buraidah, and Qunfudah.',
      },
      ar: {
        title: 'مرافق نقل المياه والصرف الصحي البلدية',
        summary: 'توريد وتركيب وصيانة متكاملة لمعدات ضخ ونقل مياه الصرف الصحي ومعالجة المياه في عدة مناطق بالمملكة.',
        scopeOfWork: 'حزم مضخات صرف صحي ثقيلة ولوحات تحكم وضمان صيانة لمدة ٢٤ شهراً.',
        outcomeNotes: 'دعم كفاءة شبكات المياه في جدة والمدينة وينبع وبريدة والقنفذة.',
      },
    },
  ];

  for (const prj of projectSeeds) {
    const [inserted] = await db
      .insert(projects)
      .values({
        slug: prj.slug,
        clientId: prj.clientId,
        category: prj.category,
        division: prj.division,
        locationEn: prj.locationEn,
        locationAr: prj.locationAr,
        completionYear: prj.completionYear,
        imageUrl: prj.imageUrl,
        isFeatured: prj.isFeatured,
        isPublished: true,
        isPlaceholder: prj.isPlaceholder,
      })
      .returning();

    await db.insert(projectTranslations).values([
      { projectId: inserted.id, locale: 'en', ...prj.en },
      { projectId: inserted.id, locale: 'ar', ...prj.ar },
    ]);
  }

  // 11. Editable Testimonials Placeholder
  await db.insert(testimonials).values({
    authorName: 'Editable Client Reference',
    authorRoleEn: 'Facilities Director (Editable in CMS)',
    authorRoleAr: 'مدير المرافق (قابل للتعديل في لوحة التحكم)',
    companyName: 'Partner Organization Placeholder',
    quoteEn:
      '[CMS Placeholder] Replace with an approved client testimonial and measurable project outcome before publishing.',
    quoteAr:
      '[نموذج قابل للتعديل] استبدل هذا النص بشهادة عميل معتمدة قبل النشر.',
    isPublished: false,
    isPlaceholder: true,
  });

  // 12. Blog / News & Insights (Clearly marked corporate updates / editable technical articles)
  await db.insert(blogPosts).values([
    {
      slug: 'vfd-pressure-boosting-energy-savings',
      categoryEn: 'Engineering Insights',
      categoryAr: 'رؤى هندسية',
      coverImageUrl: '/images/facility-pump-room.jpg',
      authorName: 'United Park Engineering Desk',
      readTimeMinutes: 4,
      isPublished: true,
      isPlaceholder: false,
      titleEn: 'Designing Variable-Speed Pressure Boosting Systems for Commercial Towers',
      titleAr: 'تصميم أنظمة تعزيز الضغط متغيرة السرعة للأبراج التجارية',
      excerptEn:
        'How cascade VFD booster sets stabilize water pressure across multi-zone buildings while reducing power consumption and water hammer.',
      excerptAr:
        'كيف تساهم محطات الضخ المتتابعة متغيرة السرعة في استقرار ضغط المياه وخفض استهلاك الكهرباء وتقليل المطرقة المائية.',
      contentEn:
        'Modern commercial towers and healthcare complexes experience wide fluctuations in hourly water demand. Fixed-speed booster stations waste significant electrical energy during low-demand intervals and expose risers to pressure spikes.\n\nBy combining high-efficiency vertical multistage pumps with PLC-coordinated variable frequency drives (VFDs) and properly sized Reflex membrane expansion vessels, United Park Group engineers booster skids that match flow output precisely to real-time demand.\n\nKey design considerations include duty/standby redundancy, BMS Modbus telemetry integration, and 316L stainless steel manifolds.',
      contentAr:
        'تشهد الأبراج التجارية والمجمعات الصحية تذبذباً كبيراً في الطلب على المياه على مدار اليوم. وتستهلك محطات الرفع ثابتة السرعة طاقة كهربائية مرتفعة خلال فترات انخفاض السحب مع تعريض الشبكات لصدمات الضغط.\n\nمن خلال دمج المضخات العمودية متعددة المراحل مع مغيرات السرعة (VFD) وخزانات التمدد الغشائية من ريفلكس، تصمم مجموعة بارك المتحدة محطات رفع تضبط التدفق بدقة وفق الطلب الفعلي، مع جاهزية الربط بأنظمة إدارة المباني (BMS) وتكوينات تشغيل واحتياط موثوقة.',
    },
    {
      slug: 'united-park-after-sales-maintenance-jeddah',
      categoryEn: 'Corporate News',
      categoryAr: 'أخبار الشركة',
      coverImageUrl: '/images/hero-pumps.jpg',
      authorName: 'United Park Group',
      readTimeMinutes: 3,
      isPublished: true,
      isPlaceholder: false,
      titleEn: 'Single-Source Fluid Engineering & 24-Month Installation Support Across Saudi Arabia',
      titleAr: 'حلول هندسية من مصدر واحد وضمان تركيب ٢٤ شهراً في أنحاء المملكة',
      excerptEn:
        'Since 1989 in Jeddah, United Park Group has unified equipment supply, engineering consultation, installation, and maintenance under one roof.',
      excerptAr:
        'منذ عام ١٩٨٩ في جدة، تجمع مجموعة بارك المتحدة بين التوريد والاستشارات الهندسية والتركيب والصيانة تحت سقف واحد.',
      contentEn:
        'Coordinating separate vendors for pump sizing, procurement, pipework contracting, and long-term maintenance introduces costly delays for project owners.\n\nOperating from Jeddah and serving Makkah, Madinah, Yanbu, Buraidah, Qunfudah, and wider Saudi regions, United Park Group offers free initial technical consultations, authorized OEM equipment from Grundfos, Reflex, Global Water Solutions, Bristol Fire, and Ameriflo, plus 24-month installation warranties.',
      contentAr:
        'يؤدي تعدد الموردين بين اختيار المضخات والتوريد وأعمال المقاولات والصيانة إلى تأخير المشاريع وارتفاع التكاليف التشغيلية.\n\nانطلاقاً من مقرها الرئيسي في جدة وامتداد خدماتها إلى مكة المكرمة والمدينة المنورة وينبع وبريدة والقنفذة، تقدم مجموعة بارك المتحدة استشارات هندسية أولية ومعدات معتمدة من شركائها العالميين مع ضمان تركيب لمدة ٢٤ شهراً ودعم فني متواصل.',
    },
  ]);

  // 13. SEO Metadata (EN & AR)
  const seoSeeds = [
    {
      routeKey: 'home',
      locale: 'en',
      metaTitle: 'United Park Group (PARK) – Industrial Pumps, Contracting & Water Solutions',
      metaDescription:
        'Official website of United Park Group in Jeddah, Saudi Arabia. Authorized agent for Grundfos, Reflex, GWS, Bristol Fire & Ameriflo since 1989.',
      canonicalPath: '/',
      schemaType: 'Organization',
      keywords: 'United Park Group, PARK Saudi Arabia, Grundfos Jeddah, industrial pumps KSA, water treatment Saudi Arabia',
    },
    {
      routeKey: 'home',
      locale: 'ar',
      metaTitle: 'مجموعة بارك المتحدة (PARK) – مضخات صناعية ومقاولات وحلول المياه',
      metaDescription:
        'الموقع الرسمي لمجموعة بارك المتحدة في جدة منذ ١٩٨٩. وكيل معتمد لمضخات جراندفوس وريفلكس وأنظمة المياه والمقاولات في السعودية.',
      canonicalPath: '/ar',
      schemaType: 'Organization',
      keywords: 'شركة بارك المتحدة، مضخات مياه جدة، جراندفوس السعودية، مقاولات مياه وصرف صحي',
    },
    {
      routeKey: 'products',
      locale: 'en',
      metaTitle: 'Industrial Pump Catalog & Fluid Systems | United Park Group (PARK)',
      metaDescription:
        'Browse commercial booster sets, multistage pumps, dosing systems, expansion vessels, and control panels supplied by United Park Group in Saudi Arabia.',
      canonicalPath: '/products',
      schemaType: 'CollectionPage',
      keywords: 'booster pumps KSA, multistage centrifugal pumps, Reflex expansion vessels, dosing skids',
    },
    {
      routeKey: 'products',
      locale: 'ar',
      metaTitle: 'كتالوج المضخات وأنظمة المياه | مجموعة بارك المتحدة',
      metaDescription:
        'استعرض مضخات رفع الضغط، محطات التحلية والحقن، خزانات التمدد ولوحات التحكم من مجموعة بارك المتحدة.',
      canonicalPath: '/ar/products',
      schemaType: 'CollectionPage',
      keywords: 'مضخات رفع الضغط، خزانات تمدد، مضخات حقن كيميائي، بارك للمضخات',
    },
    {
      routeKey: 'partners',
      locale: 'en',
      metaTitle: 'Our Global Partners | Grundfos, Reflex, GWS, Bristol Fire | PARK',
      metaDescription:
        'United Park Group represents world-leading fluid engineering manufacturers including Grundfos, Reflex, Global Water Solutions, Bristol Fire, and Ameriflo.',
      canonicalPath: '/partners',
      schemaType: 'WebPage',
      keywords: 'Grundfos agent Saudi Arabia, Reflex distributor KSA, Global Water Solutions, Bristol Fire',
    },
    {
      routeKey: 'partners',
      locale: 'ar',
      metaTitle: 'شركاؤنا العالميون | جراندفوس، ريفلكس، جلوبال ووتر | بارك المتحدة',
      metaDescription:
        'تمثل مجموعة بارك المتحدة كبرى الشركات العالمية مثل جراندفوس وريفلكس وجلوبال ووتر سوليوشنز وبريستول فاير وأميريفلو.',
      canonicalPath: '/ar/partners',
      schemaType: 'WebPage',
      keywords: 'وكيل جراندفوس جدة، وكيل ريفلكس السعودية، شركاء بارك المتحدة',
    },
  ];

  for (const s of seoSeeds) {
    await db
      .insert(seoMetadata)
      .values({
        ...s,
        ogTitle: s.metaTitle,
        ogDescription: s.metaDescription,
        ogImageUrl: '/images/hero-pumps.jpg',
      })
      .onConflictDoNothing();
  }
}

async function ensureHoldingGroupUpgraded(): Promise<void> {
  // 1. Upgrade legacy pump-only home hero translations if not yet customized by an admin
  const [homePage] = await db.select().from(pages).where(eq(pages.slug, 'home')).limit(1);
  if (homePage) {
    const [homeEn] = await db
      .select()
      .from(pageTranslations)
      .where(and(eq(pageTranslations.pageId, homePage.id), eq(pageTranslations.locale, 'en')))
      .limit(1);

    if (homeEn && homeEn.heroHeading === 'WELCOME TO UNITED PARK GROUP') {
      await db
        .update(pageTranslations)
        .set({
          heroHeading: 'MORE THAN A GROUP.\nA VISION THAT CONNECTS INDUSTRIES.',
          heroSubheading:
            'UNITED PARK GROUP brings together diverse businesses across industrial engineering, contracting, real estate development, healthcare, and renewable energy — creating integrated opportunities for sustainable growth and a stronger future.',
          heroCtaText: 'EXPLORE OUR GROUP',
          introBannerText:
            'Founded in Jeddah in 1989 — uniting global industrial partnerships, contracting execution, urban real estate, healthcare, and clean energy.',
          introBannerCtaText: 'Request Group Inquiry',
          bodyContent:
            'Since establishing the company on the west coast of Saudi Arabia in 1989 in Jeddah, United Park Group has grown into a diversified Saudi holding group spanning Industrial & Engineering Solutions, Contracting & Construction, Real Estate Development, Medical Clinics & Healthcare, and Solar Energy Systems.',
        })
        .where(eq(pageTranslations.id, homeEn.id));
    }

    const [homeAr] = await db
      .select()
      .from(pageTranslations)
      .where(and(eq(pageTranslations.pageId, homePage.id), eq(pageTranslations.locale, 'ar')))
      .limit(1);

    if (homeAr && homeAr.heroHeading === 'مرحباً بكم في مجموعة بارك المتحدة') {
      await db
        .update(pageTranslations)
        .set({
          heroHeading: 'أكثر من مجرد مجموعة...\nرؤية تجمع قطاعات متعددة.',
          heroSubheading:
            'تجمع مجموعة يونايتد بارك قطاعات متنوعة تشمل الحلول الصناعية والهندسية، والمقاولات، والتطوير العقاري، والرعاية الصحية، والطاقة المتجددة، ضمن رؤية موحدة للنمو والاستدامة.',
          heroCtaText: 'استكشف قطاعات المجموعة',
          introBannerText:
            'منذ عام ١٩٨٩ في جدة، نربط قطاعات الصناعة والمقاولات والعقار والرعاية الصحية والطاقة المتجددة بشراكات عالمية موثوقة.',
          introBannerCtaText: 'اطلب عرض سعر',
          bodyContent:
            'منذ تأسيس الشركة عام ١٩٨٩ في جدة، توسعت مجموعة بارك المتحدة لتصبح مجموعة قابضة متعددة القطاعات تجمع بين الحلول الصناعية والهندسية، والمقاولات والإنشاءات، والتطوير العقاري، والعيادات الطبية والرعاية الصحية، وأنظمة الطاقة الشمسية في مختلف مناطق المملكة.',
        })
        .where(eq(pageTranslations.id, homeAr.id));
    }
  }

  // 2. Upgrade websiteSettings tagline if still on legacy pump-only text
  const [settingsRow] = await db.select().from(websiteSettings).limit(1);
  if (
    settingsRow &&
    settingsRow.taglineEn === 'Integrated Water, Pumping & Industrial Engineering Solutions Since 1989'
  ) {
    await db
      .update(websiteSettings)
      .set({
        taglineEn:
          'Diversified Holding Group — Industrial Engineering, Contracting, Real Estate, Healthcare & Solar Energy Since 1989',
        taglineAr:
          'مجموعة قابضة متعددة القطاعات — الحلول الصناعية، المقاولات، التطوير العقاري، الرعاية الصحية، والطاقة المتجددة منذ ١٩٨٩',
      })
      .where(eq(websiteSettings.id, settingsRow.id));
  }

  // 3. Ensure Healthcare and Solar Energy sector pages exist in PostgreSQL & Admin CMS
  const newSectorPages = [
    {
      slug: 'park-healthcare',
      template: 'division',
      heroImageUrl: '/images/facility-pump-room.jpg',
      sortOrder: 7,
      en: {
        title: 'Medical Clinics & Healthcare',
        heroHeading: 'MEDICAL CLINICS & HEALTHCARE',
        heroSubheading:
          'Developing modern outpatient medical clinics and healthcare facilities centered on clinical reliability and contemporary design.',
        heroCtaText: 'Inquire With Healthcare Desk',
        heroCtaUrl: '/contact',
        introBannerText:
          'Patient-centered outpatient architecture, medical facility engineering, and compliant utility infrastructure.',
        introBannerCtaText: 'Contact Healthcare Team',
        bodyContent:
          '[Editable in CMS] United Park Group’s Healthcare sector focuses on developing and supporting modern medical clinics and outpatient healthcare environments across Saudi Arabia. Combining architectural precision with dependable facility infrastructure, this sector advances accessible, high-standard clinical care. Update specific clinic locations, specialties, and milestones anytime in the Admin CMS.',
        sectionsJson: { isPlaceholder: true },
      },
      ar: {
        title: 'العيادات الطبية والرعاية الصحية',
        heroHeading: 'العيادات الطبية والرعاية الصحية',
        heroSubheading:
          'تطوير عيادات طبية ومرافق رعاية صحية حديثة ترتكز على الاعتمادية السريرية والتصميم المعماري المتطور.',
        heroCtaText: 'تواصل مع قطاع الرعاية الصحية',
        heroCtaUrl: '/contact',
        introBannerText:
          'تصميم معماري يركز على راحة المريض، وبنية تحتية هندسية متكاملة للمرافق والعيادات الطبية.',
        introBannerCtaText: 'تواصل معنا',
        bodyContent:
          '[قابل للتعديل من لوحة التحكم] يركز قطاع الرعاية الصحية في مجموعة بارك المتحدة على تطوير ودعم العيادات الطبية الحديثة ومرافق الرعاية المتخصصة في المملكة العربية السعودية، مع دمج جودة البنية التحتية الهندسية ببيئات طبية متقدمة. يمكن تحديث أسماء العيادات والتخصصات والمواقع مباشرة من لوحة التحكم.',
        sectionsJson: { isPlaceholder: true },
      },
    },
    {
      slug: 'park-solar-energy',
      template: 'division',
      heroImageUrl: '/images/sector-utilities.jpg',
      sortOrder: 8,
      en: {
        title: 'Solar Energy Systems',
        heroHeading: 'SOLAR ENERGY & RENEWABLE SYSTEMS',
        heroSubheading:
          'High-efficiency photovoltaic solar arrays, solar water pumping, and clean energy infrastructure built for Saudi irradiance.',
        heroCtaText: 'Request Solar Assessment',
        heroCtaUrl: '/quote',
        introBannerText:
          'Commercial rooftop PV, utility-scale solar fields, and off-grid solar pumping packages.',
        introBannerCtaText: 'Get Solar Quote',
        bodyContent:
          '[Editable in CMS] United Park Group’s Renewable Energy division delivers photovoltaic solar power systems, inverter & storage integration, and solar-powered water pumping solutions for commercial, agricultural, and industrial facilities across Saudi Arabia. Customize capacities, partner modules, and project case studies directly in the Admin CMS.',
        sectionsJson: { isPlaceholder: true },
      },
      ar: {
        title: 'أنظمة الطاقة الشمسية',
        heroHeading: 'أنظمة الطاقة الشمسية والطاقة المتجددة',
        heroSubheading:
          'محطات طاقة شمسية كهروضوئية عالية الكفاءة وأنظمة ضخ بالطاقة الشمسية مصممة لبيئة المملكة.',
        heroCtaText: 'اطلب دراسة طاقة شمسية',
        heroCtaUrl: '/quote',
        introBannerText:
          'ألواح طاقة شمسية للمنشآت التجارية والصناعية، وحزم ضخ المياه بالطاقة الشمسية للمواقع البعيدة.',
        introBannerCtaText: 'اطلب تسعير طاقة شمسية',
        bodyContent:
          '[قابل للتعديل من لوحة التحكم] يقدم قطاع الطاقة المتجددة في مجموعة بارك المتحدة حلول الأنظمة الشمسية الكهروضوئية، وتكامل المحولات والتخزين، وأنظمة الضخ بالطاقة الشمسية للمنشآت التجارية والزراعية والصناعية في المملكة. يمكن تعديل التفاصيل والمشاريع من لوحة التحكم.',
        sectionsJson: { isPlaceholder: true },
      },
    },
  ];

  for (const sp of newSectorPages) {
    const [existing] = await db.select().from(pages).where(eq(pages.slug, sp.slug)).limit(1);
    if (!existing) {
      const [inserted] = await db
        .insert(pages)
        .values({
          slug: sp.slug,
          template: sp.template,
          heroImageUrl: sp.heroImageUrl,
          isPublished: true,
          sortOrder: sp.sortOrder,
        })
        .returning();

      await db.insert(pageTranslations).values([
        { pageId: inserted.id, locale: 'en', ...sp.en },
        { pageId: inserted.id, locale: 'ar', ...sp.ar },
      ]);
    }
  }

  // 4. Ensure footer_company menu lists all 5 holding group sectors
  const [footerCompanyMenu] = await db
    .select()
    .from(navigationMenus)
    .where(eq(navigationMenus.location, 'footer_company'))
    .limit(1);

  if (footerCompanyMenu) {
    const existingItems = await db
      .select()
      .from(navigationItems)
      .where(eq(navigationItems.menuId, footerCompanyMenu.id));

    const hasHealthcare = existingItems.some((item) => item.url === '/divisions/healthcare');
    if (!hasHealthcare) {
      await db.delete(navigationItems).where(eq(navigationItems.menuId, footerCompanyMenu.id));
      await db.insert(navigationItems).values([
        {
          menuId: footerCompanyMenu.id,
          url: '/divisions/industrial-engineering',
          labelEn: 'Industrial & Engineering',
          labelAr: 'الحلول الصناعية والهندسية',
          sortOrder: 1,
          isVisible: true,
        },
        {
          menuId: footerCompanyMenu.id,
          url: '/divisions/contracting',
          labelEn: 'Contracting & Construction',
          labelAr: 'المقاولات والإنشاءات',
          sortOrder: 2,
          isVisible: true,
        },
        {
          menuId: footerCompanyMenu.id,
          url: '/divisions/real-estate',
          labelEn: 'Real Estate Development',
          labelAr: 'التطوير العقاري',
          sortOrder: 3,
          isVisible: true,
        },
        {
          menuId: footerCompanyMenu.id,
          url: '/divisions/healthcare',
          labelEn: 'Medical Clinics & Healthcare',
          labelAr: 'العيادات الطبية والرعاية الصحية',
          sortOrder: 4,
          isVisible: true,
        },
        {
          menuId: footerCompanyMenu.id,
          url: '/divisions/solar-energy',
          labelEn: 'Solar Energy Systems',
          labelAr: 'أنظمة الطاقة الشمسية',
          sortOrder: 5,
          isVisible: true,
        },
        {
          menuId: footerCompanyMenu.id,
          url: '/quote',
          labelEn: 'Request a Quote',
          labelAr: 'اطلب عرض سعر',
          sortOrder: 6,
          isVisible: true,
        },
      ]);
    }
  }

  // 5. Ensure SEO entries exist for new sector pages and update legacy home SEO title
  const [homeSeoEn] = await db
    .select()
    .from(seoMetadata)
    .where(and(eq(seoMetadata.routeKey, 'home'), eq(seoMetadata.locale, 'en')))
    .limit(1);
  if (
    homeSeoEn &&
    homeSeoEn.metaTitle === 'United Park Group (PARK) – Industrial Pumps, Contracting & Water Solutions'
  ) {
    await db
      .update(seoMetadata)
      .set({
        metaTitle: 'United Park Group (PARK) – Diversified Saudi Holding Group',
        metaDescription:
          'Official website of United Park Group (PARK) in Jeddah since 1989. Connecting Industrial Engineering, Contracting, Real Estate, Healthcare & Solar Energy.',
      })
      .where(eq(seoMetadata.id, homeSeoEn.id));
  }

  await db
    .insert(seoMetadata)
    .values([
      {
        routeKey: 'divisions',
        locale: 'en',
        metaTitle: 'Business Sectors | United Park Group (PARK)',
        metaDescription:
          'Explore United Park Group’s five strategic sectors: Industrial & Engineering, Contracting, Real Estate Development, Healthcare, and Solar Energy.',
        canonicalPath: '/divisions/industrial-engineering',
        ogTitle: 'Business Sectors | United Park Group (PARK)',
        ogDescription:
          'One Group. Five Strategic Industries. United Park Group across Saudi Arabia.',
        ogImageUrl: '/images/hero-pumps.jpg',
        schemaType: 'WebPage',
        keywords: 'United Park Group sectors, Saudi holding company, industrial engineering, contracting, real estate, healthcare, solar energy',
      },
      {
        routeKey: 'divisions',
        locale: 'ar',
        metaTitle: 'قطاعات الأعمال | مجموعة بارك المتحدة (PARK)',
        metaDescription:
          'استكشف قطاعات مجموعة بارك المتحدة الخمسة: الحلول الصناعية والهندسية، المقاولات، التطوير العقاري، الرعاية الصحية، والطاقة الشمسية.',
        canonicalPath: '/ar/divisions/industrial-engineering',
        ogTitle: 'قطاعات الأعمال | مجموعة بارك المتحدة (PARK)',
        ogDescription: 'مجموعة واحدة تجمع خمسة قطاعات استراتيجية في المملكة العربية السعودية.',
        ogImageUrl: '/images/hero-pumps.jpg',
        schemaType: 'WebPage',
        keywords: 'مجموعة بارك المتحدة، قطاعات الأعمال، مقاولات، عقار، عيادات طبية، طاقة شمسية',
      },
    ])
    .onConflictDoNothing();
}


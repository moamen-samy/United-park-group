import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightCircle,
  Building2,
  CheckCircle2,
  Cog,
  Droplets,
  Flame,
  Gauge,
  HardHat,
  Shield,
  Snowflake,
  Sprout,
  Stethoscope,
  Sun,
  Waves,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PartnerCarousel } from '../components/PartnerCarousel';
import { ResilientImage } from '../components/ResilientImage';
import { HoldingCompanyHero } from '../components/hero/HoldingCompanyHero';
import { GROUP_SECTORS, SectorDefinition, SectorKey } from '../data/sectors';
import { ProductPriceBadge } from './ProductsPage';
import { SectionBlockRenderer } from './SecondaryPages';

const DEFAULT_HOME_ORDER = [
  'hero',
  'sectors_grid',
  'overview_statement',
  'partners_strip',
  'capabilities',
  'featured_products',
  'projects_showcase',
  'news_insights',
];

export const HomePage: React.FC = () => {
  const { locale, isRtl, navigate, bootstrap, setPreselectedProduct } = useApp();
  const isAr = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const [selectedSector, setSelectedSector] = useState<SectorKey | null>(null);

  const homePage = bootstrap?.pages.find((p) => p.slug === 'home');
  const tr = homePage?.translation;
  const sections = (tr?.sectionsJson || {}) as Record<string, string>;

  const services = bootstrap?.services || [];
  const partners = bootstrap?.partners || [];
  const allProducts = bootstrap?.products || [];
  const allProjects = bootstrap?.projects || [];
  const allNews = bootstrap?.blogPosts || [];
  const dbSectors = bootstrap?.sectors || [];
  const banners = bootstrap?.banners || [];
  const defaultCurrency = bootstrap?.settings?.defaultCurrency || 'SAR';

  const heroBanner = banners.find((b) => b.placement === 'hero' && b.isPublished) || null;
  const promoBanner = banners.find((b) => b.placement === 'promo' && b.isPublished) || null;

  const hpConfig = bootstrap?.homepageSections || [];
  const orderedKeys: string[] = hpConfig.length > 0
    ? [
        ...hpConfig.filter((s) => s.isVisible).map((s) => s.sectionKey),
        ...(!hpConfig.some((s) => s.sectionKey === 'capabilities') ? ['capabilities'] : []),
      ]
    : DEFAULT_HOME_ORDER;

  const findHpSection = (key: string) => hpConfig.find((s) => s.sectionKey === key);

  const renderSectorIcon = (iconName: SectorDefinition['iconName'], className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Cog':
        return <Cog className={className} aria-hidden="true" />;
      case 'HardHat':
        return <HardHat className={className} aria-hidden="true" />;
      case 'Building2':
        return <Building2 className={className} aria-hidden="true" />;
      case 'Stethoscope':
        return <Stethoscope className={className} aria-hidden="true" />;
      case 'Sun':
        return <Sun className={className} aria-hidden="true" />;
    }
  };

  const renderServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sprout':
        return <Sprout className="w-8 h-8 text-white" aria-hidden="true" />;
      case 'Gauge':
        return <Gauge className="w-8 h-8 text-white" aria-hidden="true" />;
      case 'Waves':
        return <Waves className="w-8 h-8 text-white" aria-hidden="true" />;
      case 'Droplets':
        return <Droplets className="w-8 h-8 text-white" aria-hidden="true" />;
      case 'Snowflake':
        return <Snowflake className="w-8 h-8 text-white" aria-hidden="true" />;
      case 'Flame':
        return <Flame className="w-8 h-8 text-white" aria-hidden="true" />;
      default:
        return <Droplets className="w-8 h-8 text-white" aria-hidden="true" />;
    }
  };

  const scrollToSectors = () => {
    document.getElementById('business-sectors')?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderSectionByKey = (key: string) => {
    switch (key) {
      case 'hero':
        return (
          <HoldingCompanyHero
            key="hero"
            heroHeading={tr?.heroHeading}
            heroSubheading={tr?.heroSubheading}
            heroCtaText={tr?.heroCtaText}
            locale={locale}
            isRtl={isRtl}
            sectors={dbSectors}
            heroBanner={heroBanner}
            selectedSector={selectedSector}
            onSectorChange={setSelectedSector}
            onNavigate={navigate}
            onExploreGroup={scrollToSectors}
          />
        );

      case 'sectors_grid': {
        const meta = findHpSection('sectors_grid');
        return (
          <section key="sectors_grid" id="business-sectors" className="bg-white py-16 sm:py-22 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                <div className="max-w-2xl space-y-2.5">
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#D93829]">
                    {isAr ? 'مجموعة واحدة · خمسة قطاعات استراتيجية' : 'ONE GROUP · FIVE STRATEGIC PILLARS'}
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#133D68] tracking-tight">
                    {(meta ? (isAr ? meta.titleAr : meta.titleEn) : '') || (isAr ? 'قطاعات أعمالنا' : 'OUR BUSINESS SECTORS')}
                  </h2>
                  <p className="text-slate-600 text-base leading-relaxed">
                    {(meta ? (isAr ? meta.subtitleAr : meta.subtitleEn) : '') ||
                      (isAr
                        ? 'تعمل مجموعة بارك المتحدة عبر خمسة قطاعات متكاملة تسهم في تطوير البنية التحتية الصناعية والعمرانية والصحية والطاقة المستدامة في المملكة.'
                        : 'United Park Group operates across five diversified industries united by shared corporate governance, engineering rigor, and long-term regional investment.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/about')}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#133D68] hover:underline whitespace-nowrap shrink-0"
                >
                  <span>{isAr ? 'تعرف على المجموعة' : 'Group Corporate Profile'}</span>
                  <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                {GROUP_SECTORS.map((sector, idx) => {
                  const dbSec = dbSectors.find((s) => s.slug === sector.key);
                  const cmsPage = bootstrap?.pages.find((p) => p.slug === sector.pageSlug);
                  const localized = isAr ? sector.ar : sector.en;
                  const title = dbSec?.translation?.title || cmsPage?.translation?.title || localized.title;
                  const subtitle = dbSec?.translation?.tagline || localized.subtitle;
                  const summary = dbSec?.translation?.summary || cmsPage?.translation?.heroSubheading || localized.summary;
                  const highlights =
                    dbSec?.translation?.highlightsJson && dbSec.translation.highlightsJson.length > 0
                      ? dbSec.translation.highlightsJson
                      : localized.highlights;
                  const imageUrl = dbSec?.imageUrl || cmsPage?.heroImageUrl || sector.imageUrl;
                  const accentColor = dbSec?.accentColor || sector.accentHex;
                  const targetRoute = dbSec?.routePath || sector.route;
                  const colSpanClass = idx < 3 ? 'lg:col-span-2' : 'lg:col-span-3';

                  return (
                    <article
                      key={sector.key}
                      className={`${colSpanClass} group border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-[#133D68]/60 transition-colors flex flex-col justify-between`}
                    >
                      <div>
                        <div className="relative h-48 bg-[#0B1E33] overflow-hidden">
                          <ResilientImage
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-[#071528]/90 via-[#071528]/35 to-transparent"
                            aria-hidden="true"
                          />
                          <div className="absolute bottom-4 inset-x-5 flex items-center justify-between gap-3">
                            <span
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md"
                              style={{ backgroundColor: accentColor }}
                            >
                              {renderSectorIcon(sector.iconName, 'w-5 h-5')}
                            </span>
                            <span className="text-xs font-mono-tabular font-semibold text-white/85">
                              {sector.zoneCode}
                            </span>
                          </div>
                        </div>

                        <div className="p-6 space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {subtitle}
                          </p>
                          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                            {title}
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {summary}
                          </p>
                          <ul className="pt-2 space-y-1.5 border-t border-slate-100">
                            {highlights.map((item) => (
                              <li key={item} className="flex items-center gap-2 text-xs text-slate-700">
                                <ArrowRightCircle
                                  className={`w-3.5 h-3.5 text-[#133D68] shrink-0 ${isRtl ? 'rotate-180' : ''}`}
                                  aria-hidden="true"
                                />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-[#F8FAFC] border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => navigate(targetRoute)}
                          className="inline-flex items-center gap-2 text-sm font-bold text-[#133D68] hover:text-[#D93829] transition-colors"
                        >
                          <span>{isAr ? 'استكشف المزيد' : 'Explore More'}</span>
                          <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSector(sector.key);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-xs font-medium text-slate-500 hover:text-[#133D68]"
                        >
                          {isAr ? 'عرض في المجسم ٣D' : 'Focus in 3D'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        );
      }

      case 'overview_statement': {
        const promoTitle = promoBanner ? (isAr ? promoBanner.titleAr : promoBanner.titleEn) : '';
        const promoSub = promoBanner ? (isAr ? promoBanner.subtitleAr : promoBanner.subtitleEn) : '';
        const promoCta = promoBanner ? (isAr ? promoBanner.ctaTextAr : promoBanner.ctaTextEn) : '';
        return (
          <section key="overview_statement" className="bg-[#133D68] text-white border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-start">
              <div className="space-y-1 max-w-2xl">
                {promoTitle && (
                  <p className="text-sm font-bold text-sky-300 uppercase tracking-wide">{promoTitle}</p>
                )}
                <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                  {promoSub ||
                    tr?.introBannerText ||
                    (isAr
                      ? 'منذ عام ١٩٨٩ في جدة، نربط قطاعات الصناعة والمقاولات والعقار والرعاية الصحية والطاقة المتجددة بشراكات عالمية موثوقة.'
                      : 'Founded in Jeddah in 1989 — uniting global industrial partnerships, contracting execution, urban real estate, healthcare, and clean energy.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(promoBanner?.ctaUrl || '/quote')}
                className="px-6 py-3 text-sm font-semibold text-[#133D68] bg-white hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              >
                {promoCta || tr?.introBannerCtaText || (isAr ? 'اطلب عرض سعر' : 'Request Group Inquiry')}
              </button>
            </div>
          </section>
        );
      }

      case 'partners_strip':
        return (
          <section key="partners_strip" className="bg-[#F4F6F9] py-16 sm:py-20 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#133D68] tracking-tight">
                    {isAr ? 'شركاؤنا المصنّعون العالميون' : 'Global Technology & Industrial Partners'}
                  </h2>
                  <p className="mt-2 text-slate-600 text-base">
                    {isAr
                      ? 'وكلاء وموزعون معتمدون لأبرز العلامات العالمية في تقنيات المياه والصناعة والسلامة.'
                      : 'Authorized Saudi distributor and technical support partner for world-renowned manufacturers.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/partners')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#133D68] hover:underline whitespace-nowrap"
                >
                  <span>{isAr ? 'صفحة الشركاء' : 'All Partners'}</span>
                  <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <PartnerCarousel partners={partners} />
            </div>
          </section>
        );

      case 'capabilities':
        return (
          <React.Fragment key="capabilities">
            <section className="bg-white py-16 sm:py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      {isAr ? 'قطاع الحلول الصناعية والهندسية' : 'Industrial & Engineering Sector'}
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#133D68] tracking-tight">
                      {isAr ? 'قدراتنا الهندسية المتخصصة' : 'Core Engineering Capabilities'}
                    </h2>
                    <p className="mt-3 text-slate-600 text-base leading-relaxed">
                      {isAr
                        ? 'مجموعة متكاملة من أنظمة الضخ ومعالجة المياه والتبريد والتدفئة المصممة لظروف التشغيل في المملكة.'
                        : 'Integrated pumping, treatment, and thermal fluid systems engineered for demanding commercial, agricultural, and municipal operations.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/services')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#133D68] hover:underline whitespace-nowrap"
                  >
                    <span>{isAr ? 'جميع الخدمات الهندسية' : 'All Engineering Services'}</span>
                    <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {services.map((srv, idx) => (
                    <div
                      key={srv.id}
                      className="flex flex-col items-center text-center p-7 rounded-xl border border-slate-200 bg-white hover:border-[#133D68]/40 transition-colors"
                    >
                      <div className="w-18 h-18 rounded-full bg-[#133D68] flex items-center justify-center mb-5 shadow-sm">
                        {renderServiceIcon(srv.iconName)}
                      </div>
                      <span className="text-xs font-mono-tabular font-semibold text-slate-400 mb-1">
                        0{idx + 1}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {srv.translation?.title || srv.slug}
                      </h3>
                      <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                        {srv.translation?.shortDescription}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-[#F4F6F9] py-16 sm:py-20 border-y border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-6 rounded-xl overflow-hidden border border-slate-200 bg-white min-h-[280px]">
                    <ResilientImage
                      src={sections.facilityImageUrl || '/images/facility-pump-room.jpg'}
                      alt={isAr ? 'منشأة ومشاريع مجموعة بارك المتحدة' : 'United Park Group engineering installation'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="lg:col-span-6 flex flex-col justify-between bg-white border border-slate-200 rounded-xl p-7 sm:p-10 space-y-6">
                    <div className="space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#133D68]">
                        {isAr ? 'منذ ١٩٨٩ · جدة' : 'Group Heritage & Presence · Since 1989'}
                      </p>
                      <blockquote className="text-lg sm:text-xl font-medium text-slate-900 leading-relaxed">
                        “{sections.quoteText ||
                          (isAr
                            ? 'تعمل مجموعة بارك المتحدة على بناء منظومة متكاملة تجمع الحلول الصناعية والمقاولات والتطوير العقاري والرعاية الصحية والطاقة المتجددة تحت رؤية واحدة.'
                            : 'United Park Group unites global engineering partnerships, contracting execution, urban real estate, healthcare facilities, and solar energy under one accountable corporate umbrella.')}”
                      </blockquote>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {tr?.bodyContent}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('/about')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#133D68] hover:underline"
                      >
                        <span>{isAr ? 'اقرأ المزيد عن بارك المتحدة' : 'Read Corporate Profile'}</span>
                        <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0E2E50] text-white rounded-xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center md:text-start">
                    <h3 className="text-xl font-bold">
                      {sections.storeBannerText ||
                        (isAr
                          ? 'تصفح كتالوج المنتجات للاطلاع على الأنظمة الصناعية والهندسية.'
                          : 'Explore our technical catalog for industrial pumping, controls, and solar equipment.')}
                    </h3>
                    <p className="text-sm text-slate-300">
                      {isAr
                        ? 'مواصفات فنية تفصيلية وطلب تسعير فوري للمشاريع.'
                        : 'Detailed engineering specifications and instant project quotation requests.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/products')}
                    className="px-7 py-3 bg-white text-[#133D68] font-bold text-sm rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
                  >
                    {sections.storeBannerCta || (isAr ? 'تصفح الكتالوج' : 'View Products')}
                  </button>
                </div>
              </div>
            </section>
          </React.Fragment>
        );

      case 'featured_products': {
        const meta = findHpSection('featured_products');
        const limit = Number(meta?.configJson?.limit) || 3;
        const featuredProducts = allProducts.slice(0, Math.min(Math.max(limit, 3), 6));
        if (featuredProducts.length === 0) return null;

        return (
          <section key="featured_products" className="bg-white py-16 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#133D68] tracking-tight">
                    {(meta ? (isAr ? meta.titleAr : meta.titleEn) : '') ||
                      (isAr ? 'أنظمة ومنتجات مختارة' : 'Featured Engineering Systems')}
                  </h2>
                  <p className="mt-2 text-slate-600 text-sm sm:text-base">
                    {(meta ? (isAr ? meta.subtitleAr : meta.subtitleEn) : '') ||
                      (isAr
                        ? 'أنظمة ضخ ومعدات هندسية معتمدة لتطبيقات المباني والمشاريع الصناعية.'
                        : 'Certified equipment packages engineered for commercial, healthcare, renewable, and municipal sites.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#133D68] hover:underline whitespace-nowrap"
                >
                  <span>{isAr ? 'عرض جميع المنتجات' : 'All Products'}</span>
                  <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredProducts.map((prod) => (
                  <article
                    key={prod.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col justify-between hover:border-[#133D68]/50 transition-colors"
                  >
                    <div>
                      <div
                        onClick={() => navigate(`/products/${prod.slug}`)}
                        className="aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer"
                      >
                        <ResilientImage
                          src={prod.imageUrl}
                          alt={prod.translation?.name || prod.sku}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono-tabular">
                          <span>{prod.sku}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{prod.brand || prod.division}</span>
                        </div>
                        <h3
                          onClick={() => navigate(`/products/${prod.slug}`)}
                          className="text-lg font-bold text-slate-900 cursor-pointer hover:text-[#133D68]"
                        >
                          {prod.translation?.name || prod.sku}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                          {prod.translation?.summary}
                        </p>
                        <div className="pt-1">
                          <ProductPriceBadge
                            product={prod}
                            isAr={isAr}
                            defaultCurrency={defaultCurrency}
                            compact
                          />
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/products/${prod.slug}`)}
                        className="text-xs font-semibold text-[#133D68] hover:underline"
                      >
                        {isAr ? 'المواصفات الفنية' : 'Specifications'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreselectedProduct(prod.translation?.name || prod.sku);
                          navigate('/quote');
                        }}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-[#133D68] hover:bg-[#0C2B4B] rounded-md transition-colors"
                      >
                        {isAr ? 'اطلب تسعير' : 'Request Quote'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'projects_showcase': {
        const meta = findHpSection('projects_showcase');
        const limit = Number(meta?.configJson?.limit) || 3;
        const featuredProjects = allProjects.slice(0, Math.min(Math.max(limit, 3), 4));
        return (
          <section key="projects_showcase" className="bg-[#F4F6F9] py-16 sm:py-20 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#133D68] tracking-tight">
                      {(meta ? (isAr ? meta.titleAr : meta.titleEn) : '') ||
                        (isAr ? 'مشاريع ومرجعيات مختارة' : 'Selected Reference Projects')}
                    </h2>
                    <p className="mt-2 text-slate-600 text-base">
                      {(meta ? (isAr ? meta.subtitleAr : meta.subtitleEn) : '') ||
                        (isAr
                          ? 'تجهيز وتنفيذ مشاريع حيوية لمؤسسات رائدة في المملكة.'
                          : 'Documented infrastructure, healthcare, campus, and industrial installations serving Saudi institutions.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/projects')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#133D68] hover:underline whitespace-nowrap"
                  >
                    <span>{isAr ? 'عرض جميع المشاريع' : 'View Projects'}</span>
                    <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredProjects.map((prj) => (
                    <article
                      key={prj.id}
                      onClick={() => navigate(`/projects/${prj.slug}`)}
                      className="cursor-pointer bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-[#133D68]/50 transition-colors flex flex-col"
                    >
                      <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                        <ResilientImage
                          src={prj.imageUrl}
                          alt={prj.translation?.title || prj.slug}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{prj.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{isAr ? prj.locationAr : prj.locationEn}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          {prj.translation?.title}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {prj.translation?.summary}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Why Choose PARK */}
              <div className="bg-[#133D68] text-white rounded-xl p-8 sm:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      {isAr ? 'لماذا مجموعة بارك المتحدة؟' : 'Why Choose UNITED PARK GROUP'}
                    </h2>
                    <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                      {isAr
                        ? 'مسؤولية مؤسسية متكاملة عبر خمسة قطاعات من الاستشارة الأولية والتوريد حتى التنفيذ والضمان في جميع مناطق المملكة.'
                        : 'Single-group accountability uniting engineering supply, contracting, real estate, healthcare facilities, and renewable energy across Saudi Arabia.'}
                    </p>
                  </div>
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      {
                        icon: Shield,
                        en: 'Diversified Holding Strength',
                        ar: 'قوة مجموعة متعددة القطاعات',
                        subEn: 'Five complementary industries operating under unified governance since 1989.',
                        subAr: 'خمسة قطاعات متكاملة تعمل تحت حوكمة مؤسسية موحدة منذ عام ١٩٨٩.',
                      },
                      {
                        icon: Wrench,
                        en: 'Free Initial Technical Consultation',
                        ar: 'استشارة هندسية وفنية مجانية',
                        subEn: 'Accurate project scoping, system sizing, and cross-sector coordination.',
                        subAr: 'دراسة دقيقة للمشاريع وتنسيق هندسي متكامل عبر القطاعات.',
                      },
                      {
                        icon: CheckCircle2,
                        en: 'Authorized Global OEM Partnerships',
                        ar: 'شراكات ومعدات أصلية معتمدة',
                        subEn: 'Direct sourcing from Grundfos, Reflex, GWS, Bristol Fire & Ameriflo.',
                        subAr: 'توريد مباشر من جراندفوس وريفلكس وجلوبال ووتر وبريستول وأميريفلو.',
                      },
                      {
                        icon: CheckCircle2,
                        en: 'Kingdom-Wide Delivery & 24-Month Support',
                        ar: 'تغطية شاملة وضمان ٢٤ شهراً',
                        subEn: 'Serving Jeddah, Makkah, Madinah, Yanbu, Buraidah & Qunfudah.',
                        subAr: 'خدمة مشاريع جدة ومكة والمدينة وينبع وبريدة والقنفذة.',
                      },
                    ].map((item) => {
                      const IconComp = item.icon;
                      return (
                        <div key={item.en} className="p-4 rounded-lg bg-white/10 border border-white/15 space-y-1.5">
                          <div className="flex items-center gap-2 font-semibold text-sm">
                            <IconComp className="w-4 h-4 text-sky-300 shrink-0" aria-hidden="true" />
                            <span>{isAr ? item.ar : item.en}</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {isAr ? item.subAr : item.subEn}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case 'news_insights': {
        if (allNews.length === 0) return null;
        const meta = findHpSection('news_insights');
        const limit = Number(meta?.configJson?.limit) || 3;
        const recentPosts = allNews.slice(0, Math.min(Math.max(limit, 2), 3));
        return (
          <section key="news_insights" className="bg-white py-16 sm:py-20 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#133D68] tracking-tight">
                    {(meta ? (isAr ? meta.titleAr : meta.titleEn) : '') ||
                      (isAr ? 'الأخبار والرؤى الهندسية' : 'News & Technical Insights')}
                  </h2>
                  <p className="mt-2 text-slate-600 text-sm sm:text-base">
                    {(meta ? (isAr ? meta.subtitleAr : meta.subtitleEn) : '') ||
                      (isAr
                        ? 'أحدث أخبار مجموعة بارك المتحدة والمقالات الهندسية.'
                        : 'Latest group announcements, engineering briefs, and corporate updates.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/news')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#133D68] hover:underline whitespace-nowrap"
                >
                  <span>{isAr ? 'جميع المقالات' : 'All News'}</span>
                  <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentPosts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => navigate(`/news/${post.slug}`)}
                    className="cursor-pointer border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-[#133D68]/50 transition-colors flex flex-col"
                  >
                    <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                      <ResilientImage
                        src={post.coverImageUrl}
                        alt={isAr ? post.titleAr : post.titleEn}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 space-y-2">
                      <div className="text-xs text-slate-500">
                        {isAr ? post.categoryAr : post.categoryEn} ·{' '}
                        <span className="tabular-nums">
                          {post.readTimeMinutes} {isAr ? 'دقائق' : 'min read'}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 line-clamp-2">
                        {isAr ? post.titleAr : post.titleEn}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {isAr ? post.excerptAr : post.excerptEn}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div>
      {orderedKeys.map((key) => renderSectionByKey(key))}
      {homePage?.sections && homePage.sections.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SectionBlockRenderer sections={homePage.sections} />
        </div>
      )}
    </div>
  );
};


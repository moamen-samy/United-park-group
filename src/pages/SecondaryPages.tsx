import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ResilientImage } from '../components/ResilientImage';
import { GROUP_SECTORS, getSectorByKey, SectorKey } from '../data/sectors';

/* ---------------- ABOUT US PAGE ---------------- */
export const AboutPage: React.FC = () => {
  const { locale, navigate, bootstrap } = useApp();
  const isAr = locale === 'ar';
  const aboutPage = bootstrap?.pages.find((p) => p.slug === 'about');
  const tr = aboutPage?.translation;
  const sections = (tr?.sectionsJson || {}) as {
    vision?: string;
    mission?: string;
    chairmanMessage?: string;
    values?: string[];
  };

  return (
    <div className="bg-white">
      <section className="bg-[#133D68] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <p className="text-xs uppercase tracking-wider text-slate-300">
            {isAr ? 'تأسست في جدة عام ١٩٨٩' : 'Established in Jeddah · 1989'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {tr?.heroHeading || (isAr ? 'عن مجموعة بارك المتحدة' : 'About United Park Group')}
          </h1>
          <p className="text-slate-200 max-w-3xl text-base leading-relaxed">
            {tr?.heroSubheading}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <h2 className="text-2xl font-bold text-[#133D68]">
              {isAr ? 'الملف التعريفي وتاريخ الشركة' : 'Corporate Profile & History'}
            </h2>
            <p className="text-slate-700 leading-relaxed text-base">{tr?.bodyContent}</p>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              {isAr
                ? 'تمتد خدماتنا من المقر الرئيسي في جدة إلى مكة المكرمة والمدينة المنورة وبريدة وينبع والقنفذة ومختلف مناطق المملكة عبر قطاعات بارك للمضخات وبارك للمقاولات وبارك العقارية.'
                : 'From our headquarters in Jeddah, our operational reach extends across Makkah, Madinah, Buraidah, Yanbu, Qunfudah, and wider Saudi regions through Park Pumps, Park Contracting, and Park Real Estate.'}
            </p>
          </div>
          <div className="lg:col-span-6 rounded-xl overflow-hidden border border-slate-200 aspect-[4/3]">
            <ResilientImage
              src={aboutPage?.heroImageUrl || '/images/facility-pump-room.jpg'}
              alt={isAr ? 'منشأة ومضخات بارك المتحدة' : 'United Park Group facility'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-xl border border-slate-200 bg-[#F4F6F9] space-y-3">
            <h3 className="text-xl font-bold text-[#133D68]">
              {isAr ? 'رؤيتنا' : 'Our Vision'}
            </h3>
            <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
              {sections.vision}
            </p>
          </div>
          <div className="p-8 rounded-xl border border-slate-200 bg-[#F4F6F9] space-y-3">
            <h3 className="text-xl font-bold text-[#133D68]">
              {isAr ? 'رسالتنا' : 'Our Mission'}
            </h3>
            <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
              {sections.mission}
            </p>
          </div>
        </div>

        {/* Core Values */}
        {Array.isArray(sections.values) && sections.values.length > 0 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-[#133D68]">
              {isAr ? 'قيمنا المؤسسية' : 'Corporate Values'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sections.values.map((val, idx) => (
                <div key={val} className="p-6 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-xs font-mono-tabular text-slate-400">0{idx + 1}</span>
                  <p className="font-semibold text-slate-900 text-sm sm:text-base">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chairman's Message (Editable in CMS) */}
        <section id="chairman" className="p-8 sm:p-10 rounded-xl border border-slate-200 bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-bold text-[#133D68]">
              {isAr ? 'كلمة رئيس مجلس الإدارة' : "Chairman's Message"}
            </h2>
            <span className="text-xs text-slate-500">
              {isAr ? 'قابل للتحديث من لوحة التحكم' : 'Manageable via Admin CMS'}
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed text-base">
            {sections.chairmanMessage}
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="px-5 py-2.5 bg-[#133D68] text-white text-sm font-semibold rounded-md hover:bg-[#0C2B4B]"
            >
              {isAr ? 'تواصل مع الإدارة' : 'Contact Corporate Office'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

/* ---------------- SERVICES PAGE ---------------- */
export const ServicesPage: React.FC = () => {
  const { locale, navigate, bootstrap } = useApp();
  const isAr = locale === 'ar';
  const services = bootstrap?.services || [];

  return (
    <div className="bg-white">
      <section className="bg-[#133D68] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {isAr ? 'الخدمات والحلول الهندسية' : 'Industrial Services & Fluid Solutions'}
          </h1>
          <p className="text-slate-200 max-w-2xl text-base">
            {isAr
              ? 'استشارات هندسية، توريد معدات أصلية، تركيب وتشغيل، وضمان ٢٤ شهراً مع دعم صيانة متكامل.'
              : 'Free initial consultation, authorized OEM equipment supply, commissioning, and 24-month installation warranty support.'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((srv, idx) => (
            <article key={srv.id} className="p-7 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-tabular font-semibold text-slate-400">
                  0{idx + 1}
                </span>
                <span className="text-xs text-slate-500 capitalize">{srv.division}</span>
              </div>
              <h2 className="text-xl font-bold text-[#133D68]">{srv.translation?.title}</h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {srv.translation?.fullDescription || srv.translation?.shortDescription}
              </p>
              {Array.isArray(srv.translation?.featuresJson) && srv.translation!.featuresJson.length > 0 && (
                <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                  {srv.translation!.featuresJson.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-[#133D68] shrink-0" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        <div className="bg-[#F4F6F9] border border-slate-200 rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#133D68]">
              {isAr ? 'هل تحتاج إلى دراسة أو تسعير لمشروعك؟' : 'Need Engineering Sizing or Project Pricing?'}
            </h3>
            <p className="text-sm text-slate-600">
              {isAr
                ? 'فريقنا الهندسي في جدة جاهز لمراجعة متطلبات الضخ والمعالجة.'
                : 'Our Jeddah engineering team is ready to review your flow, head, and system requirements.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/quote')}
            className="px-6 py-3 bg-[#133D68] text-white text-sm font-semibold rounded-md hover:bg-[#0C2B4B] whitespace-nowrap"
          >
            {isAr ? 'اطلب عرض سعر' : 'Request a Quote'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- DIVISION / SECTOR PAGES (All 5 Group Sectors) ---------------- */
export const DivisionPage: React.FC<{ division: SectorKey | 'pumps' }> = ({ division }) => {
  const { locale, isRtl, navigate, bootstrap, setPreselectedProduct } = useApp();
  const isAr = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const sectorMeta = getSectorByKey(division) || GROUP_SECTORS[0];
  const localizedMeta = isAr ? sectorMeta.ar : sectorMeta.en;
  const pageData = bootstrap?.pages.find((p) => p.slug === sectorMeta.pageSlug);
  const tr = pageData?.translation;

  const relatedProducts =
    sectorMeta.key === 'solar-energy'
      ? (bootstrap?.products || []).filter(
          (p) => p.slug.includes('solar') || p.division === 'solar'
        )
      : (bootstrap?.products || []).slice(0, 3);

  const fallbackProducts =
    relatedProducts.length > 0 ? relatedProducts : (bootstrap?.products || []).slice(0, 3);

  const relatedProjects = (bootstrap?.projects || []).filter((prj) => {
    if (sectorMeta.key === 'industrial-engineering') return prj.division === 'pumps' || prj.division === 'contracting';
    if (sectorMeta.key === 'contracting') return prj.division === 'contracting';
    return true;
  });

  return (
    <div className="bg-white">
      <section className="relative bg-[#091D36] text-white py-20 overflow-hidden">
        <ResilientImage
          src={pageData?.heroImageUrl || sectorMeta.imageUrl}
          alt={tr?.heroHeading || localizedMeta.title}
          lazy={false}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#071528]/90 via-[#0B2242]/75 to-[#0B2242]/45"
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono-tabular uppercase tracking-wider text-sky-300">
            <span>{isAr ? `قطاع أعمال ${sectorMeta.zoneCode}` : `SECTOR ${sectorMeta.zoneCode}`}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">
              {isAr ? 'مجموعة بارك المتحدة' : 'UNITED PARK GROUP'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {tr?.heroHeading || localizedMeta.title}
          </h1>
          <p className="text-slate-200 max-w-2xl text-base leading-relaxed">
            {tr?.heroSubheading || localizedMeta.summary}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(tr?.heroCtaUrl || '/quote')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#133D68] font-bold text-sm rounded-md hover:bg-slate-100 transition-colors"
            >
              <span>{tr?.heroCtaText || (isAr ? 'اطلب استشارة' : 'Get Started')}</span>
              <ArrowIcon className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="px-6 py-3 border border-white/30 text-white text-sm font-semibold rounded-md hover:bg-white/10 transition-colors"
            >
              {isAr ? 'تواصل مع الفريق' : 'Contact Sector Desk'}
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-[#133D68]">
                {isAr ? 'نطاق العمل والقدرات' : 'Sector Capabilities & Scope'}
              </h2>
              <p className="text-slate-700 leading-relaxed text-base">
                {tr?.bodyContent || localizedMeta.summary}
              </p>
            </div>

            {tr?.introBannerText && (
              <div className="p-5 bg-[#F4F6F9] border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed">
                {tr.introBannerText}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                {isAr ? 'مجالات التركيز الرئيسية' : 'Key Sector Pillars'}
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {localizedMeta.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 p-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#133D68] mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-5 border border-slate-200 rounded-xl p-6 space-y-4 bg-white">
            <div className="flex items-center gap-2 text-[#133D68] font-bold">
              <Building2 className="w-5 h-5" aria-hidden="true" />
              <span>{isAr ? 'استكشف قطاعات المجموعة الخمسة' : 'Explore All Five Group Sectors'}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {GROUP_SECTORS.map((s) => {
                const isCurrent = sectorMeta.key === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => navigate(s.route)}
                    className={`w-full text-start py-3 text-sm font-medium flex items-center justify-between gap-2 transition-colors ${
                      isCurrent
                        ? 'text-[#133D68] font-bold'
                        : 'text-slate-600 hover:text-[#133D68]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-xs font-mono-tabular text-slate-400">{s.zoneCode}</span>
                      <span>{isAr ? s.ar.title : s.en.title}</span>
                    </span>
                    <ArrowIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {(sectorMeta.key === 'industrial-engineering' || sectorMeta.key === 'solar-energy') &&
          fallbackProducts.length > 0 && (
            <div className="space-y-5 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-[#133D68]">
                  {sectorMeta.key === 'solar-energy'
                    ? isAr
                      ? 'معدات الطاقة والضخ الشمسي ذات الصلة'
                      : 'Related Solar & Pumping Equipment'
                    : isAr
                      ? 'الأنظمة والمعدات الصناعية الرئيسية'
                      : 'Featured Industrial & Pumping Equipment'}
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="text-sm font-semibold text-[#133D68] hover:underline"
                >
                  {isAr ? 'الكتالوج الكامل' : 'Full Catalog'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {fallbackProducts.map((p) => (
                  <article
                    key={p.id}
                    className="border border-slate-200 rounded-lg p-5 hover:border-[#133D68] flex flex-col justify-between gap-4"
                  >
                    <div
                      onClick={() => navigate(`/products/${p.slug}`)}
                      className="cursor-pointer space-y-1.5"
                    >
                      <p className="text-xs font-mono-tabular text-slate-500">{p.sku}</p>
                      <h3 className="font-bold text-slate-900">{p.translation?.name}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{p.translation?.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPreselectedProduct(p.translation?.name || p.sku);
                        navigate('/quote');
                      }}
                      className="self-start text-xs font-semibold text-[#133D68] hover:underline"
                    >
                      {isAr ? 'اطلب تسعير' : 'Request Quote'}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}

        {relatedProjects.length > 0 && (
          <div className="space-y-5 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-[#133D68]">
              {isAr ? 'مشاريع ومرجعيات المجموعة' : 'Group Reference Projects'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedProjects.slice(0, 2).map((prj) => (
                <article
                  key={prj.id}
                  onClick={() => navigate(`/projects/${prj.slug}`)}
                  className="cursor-pointer border border-slate-200 rounded-lg p-6 hover:border-[#133D68]"
                >
                  <p className="text-xs text-slate-500">
                    {prj.category} · {isAr ? prj.locationAr : prj.locationEn}
                  </p>
                  <h3 className="font-bold text-slate-900 mt-1">{prj.translation?.title}</h3>
                  <p className="text-sm text-slate-600 mt-2">{prj.translation?.summary}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- PROJECTS PAGE ---------------- */
export const ProjectsPage: React.FC<{ slug?: string }> = ({ slug }) => {
  const { locale, navigate, bootstrap } = useApp();
  const isAr = locale === 'ar';
  const [filterCat, setFilterCat] = useState('all');

  const projects = bootstrap?.projects || [];
  const clients = bootstrap?.clients || [];

  if (slug) {
    const project = projects.find((p) => p.slug === slug);
    if (!project) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#133D68]">
            {isAr ? 'المشروع غير موجود' : 'Project Not Found'}
          </h1>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-5 py-2.5 bg-[#133D68] text-white text-sm rounded-md"
          >
            {isAr ? 'العودة للمشاريع' : 'Back to Projects'}
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white">
        <div className="bg-[#133D68] text-white py-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="text-xs text-slate-200 hover:text-white"
            >
              {isAr ? '← العودة إلى المشاريع' : '← Back to Projects'}
            </button>
            <h1 className="text-3xl font-bold">{project.translation?.title}</h1>
            <p className="text-sm text-slate-200">
              {project.category} · {isAr ? project.locationAr : project.locationEn}
            </p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[16/9]">
            <ResilientImage
              src={project.imageUrl}
              alt={project.translation?.title || project.slug}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#133D68]">
                {isAr ? 'ملخص المشروع ونطاق العمل' : 'Summary & Scope of Work'}
              </h2>
              <p className="text-slate-700 leading-relaxed">{project.translation?.summary}</p>
              <p className="text-slate-600 leading-relaxed text-sm">{project.translation?.scopeOfWork}</p>
            </div>
            <div className="p-6 bg-[#F4F6F9] border border-slate-200 rounded-xl space-y-3">
              <h2 className="text-lg font-bold text-[#133D68]">
                {isAr ? 'النتائج والتشغيل' : 'Operational Outcome'}
              </h2>
              <p className="text-slate-700 text-sm leading-relaxed">
                {project.translation?.outcomeNotes}
              </p>
              <div className="pt-3 border-t border-slate-200 text-xs text-slate-500">
                {isAr ? 'القطاع:' : 'Division:'} {project.division} · {project.completionYear}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(projects.map((p) => p.category)));
  const visibleProjects =
    filterCat === 'all' ? projects : projects.filter((p) => p.category === filterCat);

  return (
    <div className="bg-white">
      <section className="bg-[#133D68] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {isAr ? 'مشاريعنا وعملاؤنا' : 'Projects & Key References'}
          </h1>
          <p className="text-slate-200 max-w-2xl text-base">
            {isAr
              ? 'مشاريع ومرجعيات موثقة لأنظمة المياه والمضخات في المملكة العربية السعودية.'
              : 'Verified Saudi water, campus, healthcare, and municipal infrastructure references.'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterCat('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md ${
              filterCat === 'all' ? 'bg-[#133D68] text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isAr ? 'الكل' : 'All'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCat(cat)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md ${
                filterCat === cat ? 'bg-[#133D68] text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleProjects.map((prj) => (
            <article
              key={prj.id}
              onClick={() => navigate(`/projects/${prj.slug}`)}
              className="cursor-pointer border border-slate-200 rounded-xl overflow-hidden hover:border-[#133D68]/60 transition-colors flex flex-col"
            >
              <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                <ResilientImage
                  src={prj.imageUrl}
                  alt={prj.translation?.title || prj.slug}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-2">
                <div className="text-xs text-slate-500">
                  {prj.category} · {isAr ? prj.locationAr : prj.locationEn}
                </div>
                <h2 className="text-lg font-bold text-slate-900">{prj.translation?.title}</h2>
                <p className="text-sm text-slate-600">{prj.translation?.summary}</p>
              </div>
            </article>
          ))}
        </div>

        {clients.length > 0 && (
          <div className="pt-8 border-t border-slate-200 space-y-5">
            <h2 className="text-xl font-bold text-[#133D68]">
              {isAr ? 'مؤسسات وعملاء تم خدمتهم' : 'Institutions & Clients Served'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {clients.map((cl) => (
                <div key={cl.id} className="p-5 border border-slate-200 rounded-lg bg-[#F4F6F9]">
                  <p className="font-bold text-slate-900 text-sm">
                    {isAr ? cl.nameAr : cl.nameEn}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{cl.sector}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- NEWS & INSIGHTS PAGE ---------------- */
export const NewsPage: React.FC<{ slug?: string }> = ({ slug }) => {
  const { locale, navigate, bootstrap } = useApp();
  const isAr = locale === 'ar';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const posts = bootstrap?.blogPosts || [];

  if (slug) {
    const post = posts.find((b) => b.slug === slug);
    if (!post) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#133D68]">
            {isAr ? 'المقال غير موجود' : 'Article Not Found'}
          </h1>
          <button
            type="button"
            onClick={() => navigate('/news')}
            className="px-5 py-2.5 bg-[#133D68] text-white text-sm rounded-md"
          >
            {isAr ? 'العودة للأخبار' : 'Back to News'}
          </button>
        </div>
      );
    }

    return (
      <article className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <button
            type="button"
            onClick={() => navigate('/news')}
            className="text-xs font-semibold text-[#133D68] hover:underline"
          >
            {isAr ? '← العودة إلى الأخبار والرؤى' : '← Back to News & Insights'}
          </button>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>{isAr ? post.categoryAr : post.categoryEn}</span>
            <span aria-hidden="true">·</span>
            <span>{post.authorName}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {post.readTimeMinutes} {isAr ? 'دقائق للقراءة' : 'min read'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">
            {isAr ? post.titleAr : post.titleEn}
          </h1>
          <div className="aspect-[16/9] rounded-xl overflow-hidden border border-slate-200">
            <ResilientImage
              src={post.coverImageUrl}
              alt={isAr ? post.titleAr : post.titleEn}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-4 text-slate-700 leading-relaxed text-base whitespace-pre-line">
            {isAr ? post.contentAr : post.contentEn}
          </div>
        </div>
      </article>
    );
  }

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const catLabel = isAr ? p.categoryAr : p.categoryEn;
      if (category !== 'all' && catLabel !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = (isAr ? p.titleAr : p.titleEn).toLowerCase();
        const excerpt = (isAr ? p.excerptAr : p.excerptEn).toLowerCase();
        return title.includes(q) || excerpt.includes(q);
      }
      return true;
    });
  }, [posts, category, search, isAr]);

  const categories = Array.from(new Set(posts.map((p) => (isAr ? p.categoryAr : p.categoryEn))));

  return (
    <div className="bg-white">
      <section className="bg-[#133D68] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {isAr ? 'الأخبار والرؤى الهندسية' : 'News & Industrial Insights'}
          </h1>
          <p className="text-slate-200 max-w-2xl text-base">
            {isAr
              ? 'مقالات فنية وتحديثات حول تقنيات الضخ ومعالجة المياه في المملكة.'
              : 'Technical briefs, announcements, and water-engineering perspectives from United Park Group.'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md ${
                category === 'all' ? 'bg-[#133D68] text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md ${
                  category === c ? 'bg-[#133D68] text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث في المقالات...' : 'Search articles...'}
              className="pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md w-full sm:w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((post) => (
            <article
              key={post.id}
              onClick={() => navigate(`/news/${post.slug}`)}
              className="cursor-pointer border border-slate-200 rounded-xl overflow-hidden hover:border-[#133D68]/50 transition-colors flex flex-col"
            >
              <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                <ResilientImage
                  src={post.coverImageUrl}
                  alt={isAr ? post.titleAr : post.titleEn}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-2.5">
                <div className="text-xs text-slate-500">
                  {isAr ? post.categoryAr : post.categoryEn} ·{' '}
                  <span className="tabular-nums">
                    {post.readTimeMinutes} {isAr ? 'دقائق' : 'min read'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isAr ? post.titleAr : post.titleEn}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {isAr ? post.excerptAr : post.excerptEn}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------------- CONTACT US PAGE ---------------- */
export const ContactPage: React.FC = () => {
  const { locale, bootstrap } = useApp();
  const isAr = locale === 'ar';
  const settings = bootstrap?.settings;

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
    websiteTrap: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Submission failed');
      setStatusMessage({
        type: 'success',
        text: isAr
          ? 'تم استلام رسالتك بنجاح. سيتواصل معك فريقنا في جدة قريباً.'
          : 'Your message has been received. Our Jeddah engineering team will respond shortly.',
      });
      setForm({
        fullName: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: '',
        websiteTrap: '',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to send message.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="bg-[#133D68] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {isAr ? 'اتصل بمجموعة بارك المتحدة' : 'Contact United Park Group'}
          </h1>
          <p className="text-slate-200 max-w-2xl text-base">
            {isAr
              ? 'مقرنا الرئيسي في جدة — نخدم كافة مناطق المملكة للاستشارات والمبيعات وخدمات الصيانة.'
              : 'Headquartered in Jeddah, Saudi Arabia — supporting technical consultations, sales, and maintenance nationwide.'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Details + Map */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-7 border border-slate-200 rounded-xl bg-[#F4F6F9] space-y-5">
            <h2 className="text-xl font-bold text-[#133D68]">
              {isAr ? 'بيانات التواصل المباشر' : 'Headquarters & Direct Channels'}
            </h2>
            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#133D68] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-semibold block text-slate-900">
                    {isAr ? 'العنوان:' : 'Address:'}
                  </span>
                  <span>{isAr ? settings?.addressAr : settings?.addressEn}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#133D68] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-semibold block text-slate-900">
                    {isAr ? 'الهاتف:' : 'Telephone:'}
                  </span>
                  <a
                    href={`tel:${(settings?.phone || '+966126604411').replace(/\s+/g, '')}`}
                    className="font-mono-tabular text-[#133D68] hover:underline"
                    dir="ltr"
                  >
                    {settings?.phone || '+966 12 6604411'}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#133D68] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-semibold block text-slate-900">
                    {isAr ? 'البريد الإلكتروني:' : 'Email:'}
                  </span>
                  <a
                    href={`mailto:${settings?.email || 'info@park.com.sa'}`}
                    className="text-[#133D68] hover:underline"
                  >
                    {settings?.email || 'info@park.com.sa'}
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`https://wa.me/${(settings?.whatsapp || '966126604411').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold rounded-md transition-colors"
              >
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                <span>{isAr ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}</span>
              </a>
            </div>
          </div>

          {settings?.mapEmbedUrl && (
            <div className="border border-slate-200 rounded-xl overflow-hidden h-64">
              <iframe
                title="United Park Group Jeddah Location"
                src={settings.mapEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="p-7 sm:p-9 border border-slate-200 rounded-xl bg-white space-y-5"
          >
            <h2 className="text-xl font-bold text-[#133D68]">
              {isAr ? 'أرسل استفسارك' : 'Send an Inquiry'}
            </h2>

            {statusMessage && (
              <div
                role="status"
                className={`p-4 rounded-md text-sm font-medium ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <input
              type="text"
              name="websiteTrap"
              value={form.websiteTrap}
              onChange={(e) => setForm({ ...form, websiteTrap: e.target.value })}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isAr ? 'البريد الإلكتروني *' : 'Email Address *'}
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isAr ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isAr ? 'اسم الشركة' : 'Company Name'}
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'الموضوع *' : 'Subject *'}
              </label>
              <input
                required
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'تفاصيل الرسالة *' : 'Message *'}
              </label>
              <textarea
                required
                minLength={10}
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#133D68] hover:bg-[#0C2B4B] disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors"
            >
              {submitting
                ? isAr
                  ? 'جاري الإرسال...'
                  : 'Sending...'
                : isAr
                  ? 'إرسال الرسالة'
                  : 'Submit Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ---------------- REQUEST A QUOTE PAGE ---------------- */
export const QuotePage: React.FC = () => {
  const { locale, isRtl, bootstrap, preselectedProduct } = useApp();
  const isAr = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+966');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [productOrService, setProductOrService] = useState(
    preselectedProduct || 'Pump Systems & Boosters'
  );
  const [estimatedQuantity, setEstimatedQuantity] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<'email' | 'phone' | 'whatsapp'>('email');
  const [file, setFile] = useState<File | null>(null);
  const [websiteTrap, setWebsiteTrap] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const productOptions = useMemo(() => {
    const items = (bootstrap?.products || []).map(
      (p) => `${p.translation?.name || p.sku} (${p.sku})`
    );
    const serviceItems = (bootstrap?.services || []).map(
      (s) => s.translation?.title || s.slug
    );
    return Array.from(new Set([...(preselectedProduct ? [preselectedProduct] : []), ...items, ...serviceItems]));
  }, [bootstrap, preselectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('companyName', companyName);
      formData.append('businessEmail', businessEmail);
      formData.append('phone', `${countryCode} ${phoneNumber}`.trim());
      formData.append('productOrService', productOrService);
      formData.append('estimatedQuantity', estimatedQuantity);
      formData.append('projectDescription', projectDescription);
      formData.append('preferredContactMethod', preferredContactMethod);
      formData.append('locale', locale);
      formData.append('websiteTrap', websiteTrap);
      if (file) {
        formData.append('attachment', file);
      }

      const res = await fetch('/api/public/quotes', {
        method: 'POST',
        body: formData,
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Quotation submission failed');

      setFeedback({
        type: 'success',
        text: isAr
          ? `تم تسجيل طلب التسعير رقم #${payload.id} بنجاح. سيقوم فريق الهندسة والمبيعات بمراجعته والتواصل معك.`
          : `Quotation request #${payload.id} submitted successfully. Our engineering sales desk will review your specs shortly.`,
      });
      setFullName('');
      setCompanyName('');
      setBusinessEmail('');
      setPhoneNumber('');
      setEstimatedQuantity('');
      setProjectDescription('');
      setFile(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to submit quotation request.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-16">
      <section className="bg-[#133D68] text-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-2">
          <p className="text-xs uppercase tracking-wider text-slate-300">
            {isAr ? 'طلبات التسعير الصناعية (RFQ)' : 'Industrial Quotation Desk (RFQ)'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {isAr ? 'اطلب عرض سعر فني وتجاري' : 'Request a Technical & Commercial Quote'}
          </h1>
          <p className="text-slate-200 text-sm sm:text-base">
            {isAr
              ? 'أدخل مواصفات مشروعك وأرفق جدول الكميات أو المخططات للحصول على دراسة وعرض سعر دقيق.'
              : 'Provide your project specifications and optional BOQ or schedule attachments for accurate equipment sizing and pricing.'}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-sm space-y-6"
        >
          {feedback && (
            <div
              role="status"
              className={`p-4 rounded-md text-sm font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <input
            type="text"
            value={websiteTrap}
            onChange={(e) => setWebsiteTrap(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'الاسم الكامل *' : 'Full Name *'}
              </label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'اسم الشركة / الجهة *' : 'Company Name *'}
              </label>
              <input
                required
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'البريد الإلكتروني الرسمي *' : 'Business Email *'}
              </label>
              <input
                required
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'رقم الهاتف مع رمز الدولة *' : 'Phone Number with Country Code *'}
              </label>
              <div className="flex gap-2" dir="ltr">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-2.5 py-2.5 text-sm border border-slate-300 rounded-md bg-slate-50 font-mono-tabular"
                  aria-label="Country code"
                >
                  <option value="+966">+966 (SA)</option>
                  <option value="+971">+971 (AE)</option>
                  <option value="+965">+965 (KW)</option>
                  <option value="+974">+974 (QA)</option>
                  <option value="+973">+973 (BH)</option>
                  <option value="+968">+968 (OM)</option>
                  <option value="+20">+20 (EG)</option>
                </select>
                <input
                  required
                  type="tel"
                  placeholder="5X XXX XXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-md font-mono-tabular focus:outline-none focus:border-[#133D68]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'المنتج أو الخدمة المطلوبة *' : 'Product or Service Required *'}
              </label>
              <select
                value={productOrService}
                onChange={(e) => setProductOrService(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-[#133D68]"
              >
                {productOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="Custom Turnkey Contracting Scope">
                  {isAr ? 'نطاق مقاولات متكامل' : 'Custom Turnkey Contracting Scope'}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'الكمية التقديرية' : 'Estimated Quantity'}
              </label>
              <input
                type="text"
                placeholder={isAr ? 'مثال: ٤ مضخات / محطة واحدة' : 'e.g., 4 units / 1 booster skid'}
                value={estimatedQuantity}
                onChange={(e) => setEstimatedQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isAr ? 'وصف المشروع والمواصفات المطلوبة (التدفق / الرفع) *' : 'Project Description & Duty Conditions *'}
            </label>
            <textarea
              required
              minLength={10}
              rows={5}
              placeholder={
                isAr
                  ? 'يرجى توضيح معدل التدفق المطلوب، الارتفاع، نوع السائل، والموقع...'
                  : 'Include required flow rate (m³/h), head (m), application type, and project location...'
              }
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'طريقة التواصل المفضلة' : 'Preferred Contact Method'}
              </label>
              <div className="flex flex-wrap gap-2">
                {(['email', 'phone', 'whatsapp'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPreferredContactMethod(method)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-md border capitalize ${
                      preferredContactMethod === method
                        ? 'bg-[#133D68] text-white border-[#133D68]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {method === 'email'
                      ? isAr
                        ? 'البريد'
                        : 'Email'
                      : method === 'phone'
                        ? isAr
                          ? 'الهاتف'
                          : 'Phone'
                        : isAr
                          ? 'واتساب'
                          : 'WhatsApp'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'إرفاق ملف (PDF, DOCX, PNG — بحد أقصى 5MB)' : 'Attachment (PDF, DOCX, Image — max 5MB)'}
              </label>
              <label className="flex items-center gap-2.5 px-3.5 py-2.5 border border-dashed border-slate-300 rounded-md cursor-pointer hover:border-[#133D68] text-sm text-slate-600">
                <Upload className="w-4 h-4 text-[#133D68] shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {file
                    ? file.name
                    : isAr
                      ? 'اختر ملف المواصفات أو جدول الكميات'
                      : 'Upload BOQ, datasheet, or specification file'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#133D68] hover:bg-[#0C2B4B] disabled:opacity-60 text-white text-sm font-bold rounded-md transition-colors"
            >
              <span>
                {submitting
                  ? isAr
                    ? 'جاري إرسال الطلب...'
                    : 'Submitting Quotation...'
                  : isAr
                    ? 'إرسال طلب عرض السعر'
                    : 'Submit Quotation Request'}
              </span>
              <ArrowIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

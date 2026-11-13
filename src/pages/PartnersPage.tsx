import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PartnerBrandBadge } from '../components/BrandMark';
import { PartnerCarousel } from '../components/PartnerCarousel';
import { ResilientImage } from '../components/ResilientImage';

export const PartnersPage: React.FC<{ slug?: string }> = ({ slug }) => {
  const { locale, isRtl, navigate, bootstrap, setPreselectedProduct } = useApp();
  const isAr = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const partners = bootstrap?.partners || [];
  const products = bootstrap?.products || [];
  const partnersPage = bootstrap?.pages.find((p) => p.slug === 'partners');

  if (slug) {
    const partner = partners.find((pt) => pt.slug === slug);
    if (!partner) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#133D68]">
            {isAr ? 'الشريك غير موجود' : 'Partner Not Found'}
          </h1>
          <button
            type="button"
            onClick={() => navigate('/partners')}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#133D68] rounded-md"
          >
            {isAr ? 'العودة إلى صفحة الشركاء' : 'Back to Our Partners'}
          </button>
        </div>
      );
    }

    const partnerProducts = products.filter((p) => p.partnerId === partner.id);
    const highlights = partner.translation?.highlightsJson || [];

    return (
      <div className="bg-white">
        <section className="relative bg-[#133D68] text-white py-16 overflow-hidden">
          <ResilientImage
            src="/images/partners-banner.jpg"
            alt={partner.name}
            lazy={false}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            <button
              type="button"
              onClick={() => navigate('/partners')}
              className="text-xs font-semibold text-slate-200 hover:text-white inline-flex items-center gap-1"
            >
              <span>{isAr ? '← العودة إلى شركاؤنا' : '← Back to Our Partners'}</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {partner.translation?.displayName || partner.name}
            </h1>
            <p className="text-slate-200 text-sm sm:text-base">
              {partner.translation?.tagline}
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 border border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center min-h-[200px] space-y-4">
              <PartnerBrandBadge slug={partner.slug} name={partner.name} logoUrl={partner.logoUrl} />
              <div className="text-xs text-slate-500 text-center">
                {isAr ? partner.categoryLabelAr : partner.categoryLabelEn}
                {partner.country ? ` · ${partner.country}` : ''}
              </div>
              {partner.websiteUrl && (
                <a
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#133D68] hover:underline"
                >
                  <span>{isAr ? 'زيارة الموقع الرسمي' : 'Visit Official Website'}</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="lg:col-span-8 space-y-6">
              <h2 className="text-2xl font-bold text-[#133D68]">
                {isAr ? 'نبذة عن الشراكة والمنتجات' : 'Partnership & Authorized Scope'}
              </h2>
              <p className="text-slate-700 leading-relaxed text-base">
                {partner.translation?.description}
              </p>

              {highlights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {highlights.map((hl) => (
                    <div
                      key={hl}
                      className="flex items-center gap-2.5 p-3.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-800"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#133D68] shrink-0" aria-hidden="true" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreselectedProduct(`${partner.name} Equipment Inquiry`);
                    navigate('/quote');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#133D68] text-white text-sm font-semibold rounded-md hover:bg-[#0C2B4B]"
                >
                  <span>
                    {isAr ? `اطلب تسعير لمنتجات ${partner.name}` : `Request ${partner.name} Quote`}
                  </span>
                  <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {partnerProducts.length > 0 && (
            <div className="pt-10 border-t border-slate-200 space-y-6">
              <h2 className="text-xl font-bold text-[#133D68]">
                {isAr ? `منتجات ${partner.name} المتوفرة` : `Supplied ${partner.name} Systems`}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {partnerProducts.map((prod) => (
                  <article
                    key={prod.id}
                    onClick={() => navigate(`/products/${prod.slug}`)}
                    className="cursor-pointer border border-slate-200 rounded-lg p-5 hover:border-[#133D68] transition-colors space-y-2"
                  >
                    <p className="text-xs font-mono-tabular text-slate-500">{prod.sku}</p>
                    <h3 className="font-bold text-slate-900">{prod.translation?.name}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{prod.translation?.summary}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main OUR PARTNERS Page (Reconstructing the screenshot skyline banner + overview + carousel + directory)
  return (
    <div className="bg-white">
      {/* Full-width skyscraper banner matching screenshot */}
      <section className="relative h-64 sm:h-80 bg-[#133D68] text-white flex items-center justify-center overflow-hidden">
        <ResilientImage
          src={partnersPage?.heroImageUrl || '/images/partners-banner.jpg'}
          alt={isAr ? 'شركاء مجموعة بارك المتحدة' : 'United Park Group global partners'}
          lazy={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0B223C]/55" aria-hidden="true" />
        <div className="relative text-center px-4">
          <h1 className="font-display font-light tracking-widest uppercase text-4xl sm:text-5xl text-white">
            {partnersPage?.translation?.heroHeading || (isAr ? 'شركاؤنا' : 'OUR PARTNERS')}
          </h1>
        </div>
      </section>

      {/* OVERVIEW OF OUR PARTNERS section */}
      <section className="bg-[#F4F6F9] py-14 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl font-light tracking-wide uppercase text-slate-800">
            {partnersPage?.translation?.heroSubheading ||
              (isAr ? 'نظرة عامة على شركائنا!' : 'OVERVIEW OF OUR PARTNERS!')}
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            {partnersPage?.translation?.introBannerText ||
              (isAr
                ? 'يمكننا أن نكون وكيلكم الصناعي المعتمد كما نمثل نخبة من كبرى الشركات العالمية.'
                : 'We can be your industrial agent, as we are for many well-known global companies.')}
          </p>
        </div>
      </section>

      {/* Interactive Partner Carousel */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <PartnerCarousel partners={partners} />

          {/* Detailed Partner Directory Cards */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#133D68]">
              {isAr ? 'دليل الشركاء المعتمدين' : 'Authorized Manufacturer Directory'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((pt) => (
                <article
                  key={pt.id}
                  className="border border-slate-200 rounded-xl p-6 bg-white flex flex-col justify-between space-y-5 hover:border-[#133D68]/50 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center min-h-[100px]">
                      <PartnerBrandBadge slug={pt.slug} name={pt.name} logoUrl={pt.logoUrl} />
                    </div>
                    <div className="text-xs text-slate-500">
                      {isAr ? pt.categoryLabelAr : pt.categoryLabelEn}
                      {pt.country ? ` · ${pt.country}` : ''}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {pt.translation?.displayName || pt.name}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {pt.translation?.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate(`/partners/${pt.slug}`)}
                      className="text-xs font-semibold text-[#133D68] hover:underline"
                    >
                      {isAr ? 'ملف الشريك' : 'Partner Profile'}
                    </button>
                    {pt.websiteUrl && (
                      <a
                        href={pt.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#133D68]"
                      >
                        <span>{isAr ? 'الموقع' : 'Website'}</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

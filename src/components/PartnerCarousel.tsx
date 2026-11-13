import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LocalizedPartner } from '../types/cms';
import { PartnerBrandBadge } from './BrandMark';

interface PartnerCarouselProps {
  partners: LocalizedPartner[];
}

export const PartnerCarousel: React.FC<PartnerCarouselProps> = ({ partners }) => {
  const { locale, isRtl, navigate } = useApp();
  const isAr = locale === 'ar';
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || partners.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % partners.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused, partners.length]);

  if (partners.length === 0) {
    return null;
  }

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + partners.length) % partners.length);
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % partners.length);
  };

  const featuredPartner = partners[activeIndex];

  return (
    <div
      className="space-y-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Interactive Carousel Spotlight */}
      <div className="relative bg-white border border-slate-200 rounded-xl p-6 sm:p-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="w-full lg:w-1/3 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-lg min-h-[150px]">
            <PartnerBrandBadge
              slug={featuredPartner.slug}
              name={featuredPartner.name}
              logoUrl={featuredPartner.logoUrl}
            />
          </div>

          <div className="w-full lg:w-2/3 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{isAr ? featuredPartner.categoryLabelAr : featuredPartner.categoryLabelEn}</span>
              {featuredPartner.country && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{featuredPartner.country}</span>
                </>
              )}
            </div>
            <h3 className="text-2xl font-bold text-[#133D68]">
              {featuredPartner.translation?.displayName || featuredPartner.name}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              {featuredPartner.translation?.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/partners/${featuredPartner.slug}`)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#133D68] hover:bg-[#0C2B4B] rounded-md transition-colors whitespace-nowrap"
              >
                {isAr ? 'ملف الشريك والمنتجات' : 'View Partner Profile'}
              </button>
              {featuredPartner.websiteUrl && (
                <a
                  href={featuredPartner.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#133D68] hover:underline whitespace-nowrap"
                >
                  <span>{isAr ? 'الموقع الرسمي' : 'Official Website'}</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        {partners.length > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {partners.map((pt, idx) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Select partner ${pt.name}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === activeIndex ? 'w-8 bg-[#133D68]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isRtl ? nextSlide : prevSlide}
                className="w-10 h-10 rounded-md border border-slate-200 inline-flex items-center justify-center text-slate-700 hover:border-[#133D68] hover:text-[#133D68] transition-colors"
                aria-label={isAr ? 'الشريك السابق' : 'Previous partner'}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={isRtl ? prevSlide : nextSlide}
                className="w-10 h-10 rounded-md border border-slate-200 inline-flex items-center justify-center text-slate-700 hover:border-[#133D68] hover:text-[#133D68] transition-colors"
                aria-label={isAr ? 'الشريك التالي' : 'Next partner'}
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Partner Quick Select Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {partners.map((pt, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`p-5 rounded-lg border bg-white flex flex-col items-center justify-center min-h-[112px] transition-all ${
                isSelected
                  ? 'border-[#133D68] ring-1 ring-[#133D68]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <PartnerBrandBadge slug={pt.slug} name={pt.name} logoUrl={pt.logoUrl} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { ChevronDown, Globe, Menu, Plus, Minus, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ParkLogo } from './BrandMark';
import { GROUP_SECTORS } from '../data/sectors';

export const Header: React.FC = () => {
  const { locale, isRtl, toggleLocale, currentPath, navigate, bootstrap } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [divisionsOpen, setDivisionsOpen] = useState(false);
  const [sectorsExpanded, setSectorsExpanded] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isAr = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const isHome = currentPath === '/' || currentPath === '/home';

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 48);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [currentPath]);

  const isHeroDark = isHome && !isScrolled;

  const handleNav = (path: string) => {
    setMobileOpen(false);
    setDivisionsOpen(false);
    navigate(path);
  };

  const navLinkClass = (path: string) => {
    const active = currentPath === path || (path !== '/' && currentPath.startsWith(path));
    if (isHeroDark) {
      return `text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 pb-0.5 border-b-2 ${
        active
          ? 'text-white border-[#D93829]'
          : 'text-slate-200 border-transparent hover:text-white hover:border-white/40'
      }`;
    }
    return `text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 pb-0.5 border-b-2 ${
      active
        ? 'text-[#133D68] border-[#D93829]'
        : 'text-slate-600 border-transparent hover:text-[#133D68] hover:border-slate-300'
    }`;
  };

  return (
    <header
      className={`${isHome ? 'fixed top-0 inset-x-0' : 'sticky top-0'} z-40 transition-colors duration-300 ${
        isHeroDark
          ? 'bg-[#071528]/80 border-b border-white/10 text-white'
          : 'bg-white border-b border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Clean single-line PARK brand wordmark or CMS custom logo */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className={`text-left focus-visible:outline-2 focus-visible:outline-offset-4 rounded flex items-center gap-2 ${
            isHeroDark ? 'focus-visible:outline-white' : 'focus-visible:outline-[#133D68]'
          }`}
          aria-label="United Park Group Home"
        >
          <ParkLogo
            variant={isHeroDark ? 'light' : 'dark'}
            compact
            src={bootstrap?.settings?.logoUrl}
            alt={
              (isAr ? bootstrap?.settings?.companyNameAr : bootstrap?.settings?.companyNameEn) ||
              'United Park Co. — شركة بارك المتحدة'
            }
          />
        </button>

        {/* Zone 2: Desktop 5-link single-line navigation */}
        <nav
          className="hidden lg:flex items-center gap-7"
          aria-label={isAr ? 'التنقل الرئيسي' : 'Primary navigation'}
        >
          <button type="button" onClick={() => handleNav('/')} className={navLinkClass('/')}>
            {isAr ? 'الرئيسية' : 'Home'}
          </button>

          <div
            className="relative"
            onMouseEnter={() => setDivisionsOpen(true)}
            onMouseLeave={() => setDivisionsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setDivisionsOpen((prev) => !prev)}
              aria-expanded={divisionsOpen}
              className={`inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
                currentPath.startsWith('/divisions') || currentPath === '/services' || currentPath === '/about'
                  ? isHeroDark
                    ? 'text-white border-[#D93829]'
                    : 'text-[#133D68] border-[#D93829]'
                  : isHeroDark
                    ? 'text-slate-200 border-transparent hover:text-white'
                    : 'text-slate-600 border-transparent hover:text-[#133D68]'
              }`}
            >
              <span>{isAr ? 'قطاعات المجموعة' : 'Sectors'}</span>
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            {divisionsOpen && (
              <div
                className={`absolute top-full pt-2 w-72 z-50 ${isRtl ? 'right-0' : 'left-0'}`}
              >
                <div className="bg-white border border-slate-200 rounded-lg shadow-xl py-2 text-slate-800">
                  <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {isAr ? 'قطاعات الأعمال الخمسة' : 'Five Group Sectors'}
                  </div>
                  {GROUP_SECTORS.map((sec) => {
                    const dbSec = bootstrap?.sectors?.find((s) => s.slug === sec.key);
                    return (
                      <button
                        key={sec.key}
                        type="button"
                        onClick={() => handleNav(dbSec?.routePath || sec.route)}
                        className="w-full text-start px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#133D68] flex items-center justify-between gap-2"
                      >
                        <span>
                          {dbSec?.translation?.title || (isAr ? sec.ar.title : sec.en.title)}
                        </span>
                        <span className="text-[10px] font-mono-tabular text-slate-400">
                          {sec.zoneCode}
                        </span>
                      </button>
                    );
                  })}
                  <div className="my-1.5 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => handleNav('/services')}
                    className="w-full text-start px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#133D68]"
                  >
                    {isAr ? 'الخدمات الهندسية' : 'Engineering Services'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('/projects')}
                    className="w-full text-start px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#133D68]"
                  >
                    {isAr ? 'مشاريعنا' : 'Projects'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('/about')}
                    className="w-full text-start px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#133D68]"
                  >
                    {isAr ? 'من نحن' : 'About Us'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('/news')}
                    className="w-full text-start px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#133D68]"
                  >
                    {isAr ? 'الأخبار والرؤى' : 'News & Insights'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button type="button" onClick={() => handleNav('/products')} className={navLinkClass('/products')}>
            {isAr ? 'المنتجات' : 'Products'}
          </button>

          <button type="button" onClick={() => handleNav('/partners')} className={navLinkClass('/partners')}>
            {isAr ? 'شركاؤنا' : 'Partners'}
          </button>

          <button type="button" onClick={() => handleNav('/contact')} className={navLinkClass('/contact')}>
            {isAr ? 'اتصل بنا' : 'Contact'}
          </button>
        </nav>

        {/* Zone 3: Language Switcher + Primary Action CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleLocale}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
              isHeroDark
                ? 'text-white border border-white/25 hover:bg-white/10'
                : 'text-slate-700 border border-slate-300 hover:border-[#133D68] hover:text-[#133D68]'
            }`}
            aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('/quote')}
            className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
              isHeroDark
                ? 'bg-[#16528E] hover:bg-[#1A62AA] text-white'
                : 'bg-[#133D68] hover:bg-[#0C2B4B] text-white'
            }`}
          >
            <span>{isAr ? 'اطلب عرض سعر' : 'Get a Quote'}</span>
            <ArrowIcon className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {/* Mobile Menu Trigger (Signature PARK red bar icon) */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={`lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-[#D93829] focus-visible:outline-2 ${
              isHeroDark
                ? 'hover:bg-white/10 focus-visible:outline-white'
                : 'hover:bg-slate-100 focus-visible:outline-[#133D68]'
            }`}
            aria-label={isAr ? 'فتح القائمة' : 'Open menu'}
          >
            <Menu className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            className={`relative z-10 w-full max-w-sm bg-white text-slate-900 h-full overflow-y-auto flex flex-col shadow-2xl ${
              isRtl ? 'mr-auto' : 'ml-auto'
            }`}
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-[#133D68] text-white">
              <ParkLogo
                variant="light"
                compact
                src={bootstrap?.settings?.logoUrl}
                alt={
                  (isAr ? bootstrap?.settings?.companyNameAr : bootstrap?.settings?.companyNameEn) ||
                  'United Park Co. — شركة بارك المتحدة'
                }
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-11 h-11 inline-flex items-center justify-center rounded-md text-white hover:bg-white/10"
                aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 divide-y divide-slate-200 px-2 py-2">
              <button
                type="button"
                onClick={() => handleNav('/')}
                className="w-full text-start px-4 py-3.5 text-base font-medium text-[#133D68] hover:bg-slate-50"
              >
                {isAr ? 'الرئيسية' : 'Home'}
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => setSectorsExpanded((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-base font-medium text-[#133D68] hover:bg-slate-50"
                >
                  <span>{isAr ? 'قطاعات الأعمال الخمسة' : 'Our Business Sectors'}</span>
                  {sectorsExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
                {sectorsExpanded && (
                  <div className="bg-slate-50 px-6 py-2 space-y-1 border-t border-slate-100">
                    {GROUP_SECTORS.map((sec) => {
                      const dbSec = bootstrap?.sectors?.find((s) => s.slug === sec.key);
                      return (
                        <button
                          key={sec.key}
                          type="button"
                          onClick={() => handleNav(dbSec?.routePath || sec.route)}
                          className="block w-full text-start py-2 text-sm text-slate-700"
                        >
                          {dbSec?.translation?.title || (isAr ? sec.ar.title : sec.en.title)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleNav('/products')}
                className="w-full text-start px-4 py-3.5 text-base font-medium text-[#133D68] hover:bg-slate-50"
              >
                {isAr ? 'كتالوج المنتجات' : 'Product Catalog'}
              </button>

              <button
                type="button"
                onClick={() => handleNav('/services')}
                className="w-full text-start px-4 py-3.5 text-base font-medium text-[#133D68] hover:bg-slate-50"
              >
                {isAr ? 'الخدمات الهندسية' : 'Engineering Services'}
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => setAboutExpanded((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-base font-medium text-[#133D68] hover:bg-slate-50"
                >
                  <span>{isAr ? 'من نحن' : 'About Us'}</span>
                  {aboutExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
                {aboutExpanded && (
                  <div className="bg-slate-50 px-6 py-2 space-y-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleNav('/about')}
                      className="block w-full text-start py-2 text-sm text-slate-700"
                    >
                      {isAr ? 'نبذة عن الشركة والتاريخ' : 'Corporate Profile & History'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav('/about#chairman')}
                      className="block w-full text-start py-2 text-sm text-slate-700"
                    >
                      {isAr ? 'كلمة رئيس مجلس الإدارة' : "Chairman's Message"}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleNav('/partners')}
                className="w-full text-start px-4 py-3.5 text-base font-medium text-[#133D68] hover:bg-slate-50"
              >
                {isAr ? 'شركاؤنا' : 'Our Partners'}
              </button>

              <button
                type="button"
                onClick={() => handleNav('/projects')}
                className="w-full text-start px-4 py-3.5 text-base font-medium text-[#133D68] hover:bg-slate-50"
              >
                {isAr ? 'مشاريعنا' : 'Projects'}
              </button>

              <button
                type="button"
                onClick={() => handleNav('/news')}
                className="w-full text-start px-4 py-3.5 text-base font-medium text-[#133D68] hover:bg-slate-50"
              >
                {isAr ? 'الأخبار والرؤى' : 'News & Insights'}
              </button>

              <button
                type="button"
                onClick={() => handleNav('/contact')}
                className="w-full text-start px-4 py-3.5 text-base font-medium text-[#133D68] hover:bg-slate-50"
              >
                {isAr ? 'اتصل بنا' : 'Contact Us'}
              </button>
            </nav>

            <div className="p-5 border-t border-slate-200 space-y-4 bg-slate-50">
              <button
                type="button"
                onClick={() => handleNav('/quote')}
                className="w-full py-3 px-4 bg-[#133D68] text-white font-semibold rounded-md text-center"
              >
                {isAr ? 'اطلب عرض سعر' : 'Get a Quote'}
              </button>

              {/* Clean non-overlapping social links */}
              {bootstrap?.socialLinks && bootstrap.socialLinks.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  {bootstrap.socialLinks.map((soc) => (
                    <a
                      key={soc.id}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-slate-600 hover:text-[#133D68] px-2 py-1"
                    >
                      {soc.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};

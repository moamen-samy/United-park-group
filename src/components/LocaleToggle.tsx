import React from 'react';
import { Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LocaleToggleProps {
  isHeroDark?: boolean;
  className?: string;
}

export const LocaleToggle: React.FC<LocaleToggleProps> = ({
  isHeroDark = false,
  className = '',
}) => {
  const { locale, isRtl, setLocale } = useApp();
  const isAr = locale === 'ar';

  const containerStyle = isHeroDark
    ? 'bg-white/10 border-white/25 text-white'
    : 'bg-slate-100 border-slate-300 text-slate-700';

  const activeStyle = isHeroDark
    ? 'bg-white text-[#133D68] shadow-xs'
    : 'bg-[#133D68] text-white shadow-xs';

  const inactiveStyle = isHeroDark
    ? 'text-slate-200 hover:text-white hover:bg-white/10'
    : 'text-slate-600 hover:text-[#133D68] hover:bg-white/70';

  return (
    <div
      role="group"
      aria-label={
        isAr
          ? 'تبديل لغة التطبيق واتجاه العرض'
          : 'Switch application locale and layout direction'
      }
      data-locale={locale}
      data-dir={isRtl ? 'rtl' : 'ltr'}
      className={`inline-flex items-center gap-1 p-1 rounded-md border transition-colors min-h-[40px] shrink-0 whitespace-nowrap ${containerStyle} ${className}`}
    >
      <Globe
        className={`w-3.5 h-3.5 mx-1.5 shrink-0 ${isHeroDark ? 'text-sky-200' : 'text-[#133D68]'}`}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        aria-label="Switch to English (LTR)"
        title="English (LTR)"
        dir="ltr"
        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
          locale === 'en' ? activeStyle : inactiveStyle
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('ar')}
        aria-pressed={locale === 'ar'}
        aria-label="التبديل إلى العربية (RTL)"
        title="العربية (RTL)"
        dir="rtl"
        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
          locale === 'ar' ? activeStyle : inactiveStyle
        }`}
      >
        عربي
      </button>
    </div>
  );
};

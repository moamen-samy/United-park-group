import React from 'react';
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
  Twitter,
  Youtube,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ParkLogo } from './BrandMark';

export const Footer: React.FC = () => {
  const { locale, navigate, bootstrap } = useApp();
  const isAr = locale === 'ar';
  const settings = bootstrap?.settings;

  const companyLinks = bootstrap?.menus?.footer_company || [];
  const quickLinks = bootstrap?.menus?.footer_quick || [];
  const socialLinks = bootstrap?.socialLinks || [];

  const renderSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin className="w-4 h-4" aria-hidden="true" />;
      case 'x':
        return <Twitter className="w-4 h-4" aria-hidden="true" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" aria-hidden="true" />;
      case 'youtube':
        return <Youtube className="w-4 h-4" aria-hidden="true" />;
      case 'facebook':
        return <Facebook className="w-4 h-4" aria-hidden="true" />;
      default:
        return <Share2 className="w-4 h-4" aria-hidden="true" />;
    }
  };

  return (
    <footer className="bg-[#0B0F17] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: PARK Corporate Identity & Social Row (No overlap) */}
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-start focus-visible:outline-2 focus-visible:outline-white rounded"
            >
              <ParkLogo
                variant="light"
                src={settings?.logoUrl}
                alt={
                  (isAr ? settings?.companyNameAr : settings?.companyNameEn) ||
                  'United Park Co. — شركة بارك المتحدة'
                }
              />
            </button>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              {isAr
                ? settings?.footerAboutAr ||
                  settings?.taglineAr ||
                  'مجموعة استثمارية وهندسية متعددة القطاعات في المملكة العربية السعودية منذ عام ١٩٨٩.'
                : settings?.footerAboutEn ||
                  settings?.taglineEn ||
                  'Diversified Saudi holding group uniting industrial engineering, contracting, real estate, healthcare, and solar energy since 1989.'}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {socialLinks.map((soc) => (
                <a
                  key={soc.id}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={soc.label}
                  className="w-10 h-10 rounded-md border border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white hover:border-slate-600 inline-flex items-center justify-center transition-colors"
                >
                  {renderSocialIcon(soc.platform)}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: BUSINESS SECTORS */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-white pb-3 border-b border-slate-800">
              {isAr ? 'قطاعات المجموعة' : 'Business Sectors'}
            </h3>
            <ul className="mt-4 divide-y divide-slate-800/70">
              {companyLinks.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => navigate(item.url)}
                    className="w-full text-start py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    {isAr ? item.labelAr : item.labelEn}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: QUICK LINKS */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-white pb-3 border-b border-slate-800">
              {isAr ? 'روابط سريعة' : 'Quick Links'}
            </h3>
            <ul className="mt-4 divide-y divide-slate-800/70">
              {quickLinks.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => navigate(item.url)}
                    className="w-full text-start py-2 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    {isAr ? item.labelAr : item.labelEn}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: CONTACT INFO */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-white pb-3 border-b border-slate-800">
              {isAr ? 'معلومات التواصل' : 'Contact Info'}
            </h3>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#D93829] mt-1 shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-xs font-semibold text-white">
                    {isAr ? 'العنوان:' : 'Address:'}
                  </span>
                  <span className="text-slate-400 leading-relaxed">
                    {isAr
                      ? settings?.addressAr ||
                        'مباني الحموري، شارع البلدية (البلية)، حي العزيزية، جدة ٢٣٣٣٤، المملكة العربية السعودية'
                      : settings?.addressEn ||
                        'Hammouri Buildings, Al-Baliyah St., Azizeyyah District, Jeddah 23334, Saudi Arabia'}
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#D93829] mt-1 shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-xs font-semibold text-white">
                    {isAr ? 'الهاتف:' : 'Contact:'}
                  </span>
                  <a
                    href={`tel:${(settings?.phone || '+966126604411').replace(/\s+/g, '')}`}
                    className="text-slate-300 hover:text-white font-mono-tabular"
                    dir="ltr"
                  >
                    {settings?.phone || '+966 12 6604411'}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#D93829] mt-1 shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-xs font-semibold text-white">
                    {isAr ? 'البريد الإلكتروني:' : 'Email:'}
                  </span>
                  <a
                    href={`mailto:${settings?.email || 'info@park.com.sa'}`}
                    className="text-slate-300 hover:text-white"
                  >
                    {settings?.email || 'info@park.com.sa'}
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Admin Access Bar */}
      <div className="border-t border-slate-800/80 bg-[#070A10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            {isAr
              ? settings?.copyrightAr || 'جميع الحقوق محفوظة © ٢٠٢٦ شركة بارك المتحدة المحدودة.'
              : settings?.copyrightEn || 'Copyright © 2026 United Park Co. Ltd. (PARK). All rights reserved.'}
          </p>
          <div className="flex items-center gap-6">
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              {isAr ? 'خريطة الموقع' : 'Sitemap'}
            </a>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'لوحة الإدارة' : 'Admin Portal'}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

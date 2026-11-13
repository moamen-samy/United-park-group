import { AdminLang, AdminTab } from './AdminTypes';

export const ADMIN_SIDEBAR_ITEMS: Array<{
  id: AdminTab;
  ar: string;
  en: string;
  groupAr: string;
  groupEn: string;
}> = [
  { id: 'overview', ar: 'نظرة عامة على لوحة التحكم', en: 'Dashboard Overview', groupAr: 'القيادة', groupEn: 'Command' },
  { id: 'content', ar: 'محتوى الموقع', en: 'Website Content', groupAr: 'إدارة المحتوى', groupEn: 'Content' },
  { id: 'pages', ar: 'إدارة الصفحات والأقسام', en: 'Pages Management', groupAr: 'إدارة المحتوى', groupEn: 'Content' },
  { id: 'homepage', ar: 'الصفحة الرئيسية والبنرات', en: 'Homepage & Banners', groupAr: 'إدارة المحتوى', groupEn: 'Content' },
  { id: 'sectors', ar: 'قطاعات الأعمال', en: 'Business Sectors', groupAr: 'إدارة المحتوى', groupEn: 'Content' },
  { id: 'products', ar: 'المنتجات والأسعار', en: 'Products Management', groupAr: 'الكتالوج والمشاريع', groupEn: 'Catalog & Portfolio' },
  { id: 'categories', ar: 'تصنيفات المنتجات', en: 'Categories Management', groupAr: 'الكتالوج والمشاريع', groupEn: 'Catalog & Portfolio' },
  { id: 'services', ar: 'إدارة الخدمات', en: 'Services Management', groupAr: 'الكتالوج والمشاريع', groupEn: 'Catalog & Portfolio' },
  { id: 'projects', ar: 'المشاريع ومعرض الأعمال', en: 'Projects & Portfolio', groupAr: 'الكتالوج والمشاريع', groupEn: 'Catalog & Portfolio' },
  { id: 'media', ar: 'مكتبة الوسائط والصور', en: 'Media Library', groupAr: 'الأصول والنشر', groupEn: 'Assets & Growth' },
  { id: 'blog', ar: 'الأخبار والمدونة', en: 'News & Blog', groupAr: 'الأصول والنشر', groupEn: 'Assets & Growth' },
  { id: 'seo', ar: 'إدارة محركات البحث SEO', en: 'SEO Management', groupAr: 'الأصول والنشر', groupEn: 'Assets & Growth' },
  { id: 'navigation', ar: 'القوائم والتذييل', en: 'Navigation & Footer', groupAr: 'الأصول والنشر', groupEn: 'Assets & Growth' },
  { id: 'leads', ar: 'رسائل التواصل وطلبات الأسعار', en: 'Contact Messages', groupAr: 'العملاء والنظام', groupEn: 'CRM & System' },
  { id: 'users', ar: 'المستخدمون والصلاحيات', en: 'Users & Permissions', groupAr: 'العملاء والنظام', groupEn: 'CRM & System' },
  { id: 'settings', ar: 'إعدادات الموقع', en: 'Website Settings', groupAr: 'العملاء والنظام', groupEn: 'CRM & System' },
  { id: 'backups', ar: 'قاعدة البيانات والنسخ الاحتياطي', en: 'Database & Backups', groupAr: 'العملاء والنظام', groupEn: 'CRM & System' },
  { id: 'logs', ar: 'سجل النشاط والأمان', en: 'Activity Logs', groupAr: 'العملاء والنظام', groupEn: 'CRM & System' },
];

export function tAdmin(lang: AdminLang, arText: string, enText: string): string {
  return lang === 'ar' ? arText : enText;
}

import React from 'react';
import {
  Activity,
  Briefcase,
  Building2,
  Clock,
  FilePlus2,
  FileText,
  FolderPlus,
  Image as ImageIcon,
  Inbox,
  Newspaper,
  Package,
  Plus,
  Upload,
} from 'lucide-react';
import { AdminModuleProps } from './AdminTypes';
import { tAdmin } from './AdminTranslations';

export const OverviewModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  setActiveTab,
}) => {
  const publishedPagesCount = data.pages.filter((p) => p.status === 'published' && p.isVisible).length;
  const draftContentCount =
    data.pages.filter((p) => p.status === 'draft').length +
    data.products.filter((p) => p.status === 'draft').length +
    data.blogPosts.filter((b) => !b.isPublished).length;
  const totalInquiries = data.contactMessages.length + data.quoteRequests.length;
  const newInquiries =
    data.contactMessages.filter((m) => m.status === 'new').length +
    data.quoteRequests.filter((q) => q.status === 'new').length;

  const recentUpdates = [
    ...data.products.slice(0, 4).map((p) => ({
      type: tAdmin(adminLang, 'منتج', 'Product'),
      name: adminLang === 'ar' ? p.ar?.name || p.sku : p.en?.name || p.sku,
      status: p.status,
      updatedAt: p.updatedAt,
      tab: 'products' as const,
    })),
    ...data.pages.slice(0, 4).map((p) => ({
      type: tAdmin(adminLang, 'صفحة', 'Page'),
      name: `/${p.slug}`,
      status: p.status,
      updatedAt: p.updatedAt,
      tab: 'pages' as const,
    })),
    ...data.projects.slice(0, 3).map((prj) => ({
      type: tAdmin(adminLang, 'مشروع', 'Project'),
      name: adminLang === 'ar' ? prj.ar?.title || prj.slug : prj.en?.title || prj.slug,
      status: prj.isPublished ? 'published' : 'draft',
      updatedAt: prj.updatedAt,
      tab: 'projects' as const,
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const metricCards = [
    {
      label: tAdmin(adminLang, 'إجمالي المنتجات', 'Total Products'),
      value: data.products.length,
      sub: `${data.products.filter((p) => p.status === 'published').length} ${tAdmin(adminLang, 'منشور', 'published')}`,
      icon: Package,
      tab: 'products' as const,
      accent: 'text-[#133D68] dark:text-sky-400',
    },
    {
      label: tAdmin(adminLang, 'إجمالي الخدمات', 'Total Services'),
      value: data.services.length,
      sub: `${data.services.filter((s) => s.isPublished).length} ${tAdmin(adminLang, 'نشط', 'active')}`,
      icon: Briefcase,
      tab: 'services' as const,
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: tAdmin(adminLang, 'الصفحات المنشورة', 'Published Pages'),
      value: publishedPagesCount,
      sub: `${data.pages.length} ${tAdmin(adminLang, 'إجمالي الصفحات', 'total pages')}`,
      icon: FileText,
      tab: 'pages' as const,
      accent: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: tAdmin(adminLang, 'المشاريع والأعمال', 'Total Projects'),
      value: data.projects.length,
      sub: `${data.sectors.length} ${tAdmin(adminLang, 'قطاعات أعمال', 'sectors')}`,
      icon: Building2,
      tab: 'projects' as const,
      accent: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: tAdmin(adminLang, 'ملفات الوسائط', 'Media Files'),
      value: data.mediaAssets.length,
      sub: `${data.mediaFolders.length} ${tAdmin(adminLang, 'مجلدات', 'folders')}`,
      icon: ImageIcon,
      tab: 'media' as const,
      accent: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: tAdmin(adminLang, 'استفسارات وطلبات الأسعار', 'Contact & RFQ Inquiries'),
      value: totalInquiries,
      sub: `${newInquiries} ${tAdmin(adminLang, 'جديد بانتظار المراجعة', 'new pending')}`,
      icon: Inbox,
      tab: 'leads' as const,
      accent: 'text-[#D93829]',
    },
    {
      label: tAdmin(adminLang, 'المحتوى قيد المسودة', 'Draft Content'),
      value: draftContentCount,
      sub: tAdmin(adminLang, 'صفحات ومنتجات ومقالات', 'Pages, products & articles'),
      icon: Clock,
      tab: 'pages' as const,
      accent: 'text-slate-600 dark:text-slate-300',
    },
  ];

  const quickActions = [
    { label: tAdmin(adminLang, 'إضافة منتج', 'Add Product'), icon: Plus, tab: 'products' as const },
    { label: tAdmin(adminLang, 'إضافة خدمة', 'Add Service'), icon: Briefcase, tab: 'services' as const },
    { label: tAdmin(adminLang, 'إضافة مشروع', 'Add Project'), icon: FolderPlus, tab: 'projects' as const },
    { label: tAdmin(adminLang, 'إضافة مقال أو خبر', 'Add Article'), icon: Newspaper, tab: 'blog' as const },
    { label: tAdmin(adminLang, 'رفع وسائط', 'Upload Media'), icon: Upload, tab: 'media' as const },
    { label: tAdmin(adminLang, 'إنشاء صفحة جديدة', 'Create Page'), icon: FilePlus2, tab: 'pages' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Real-time PostgreSQL Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setActiveTab(card.tab)}
              className="text-start bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-[#133D68] dark:hover:border-sky-500 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 ${card.accent}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono-tabular">
                {card.value}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.sub}</div>
            </button>
          );
        })}

        {/* Database Footprint Card */}
        <div className="bg-[#133D68] text-white rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-200">
              {tAdmin(adminLang, 'حالة قاعدة البيانات الحية', 'Live PostgreSQL Storage')}
            </span>
            <Activity className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="text-xl font-bold font-mono-tabular mt-2">
            {(data.dbHealth.sizeBytes / (1024 * 1024)).toFixed(2)} MB
          </div>
          <div className="text-[11px] text-sky-200 mt-1">
            {data.dbHealth.tables.length} {tAdmin(adminLang, 'جدول متصل في Cloud SQL', 'active Cloud SQL tables')}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          {tAdmin(adminLang, 'إجراءات سريعة', 'Quick Actions')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.label}
                type="button"
                onClick={() => setActiveTab(act.tab)}
                className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-[#133D68] hover:text-white hover:border-[#133D68] text-slate-800 dark:text-slate-100 transition-colors text-xs font-semibold text-center"
              >
                <Icon className="w-4 h-4" />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Column Activity & Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            {tAdmin(adminLang, 'المحتوى المحدث مؤخراً', 'Recently Updated Content')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2 text-start font-semibold">{tAdmin(adminLang, 'النوع', 'Type')}</th>
                  <th className="py-2 text-start font-semibold">{tAdmin(adminLang, 'العنوان', 'Item')}</th>
                  <th className="py-2 text-start font-semibold">{tAdmin(adminLang, 'الحالة', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentUpdates.map((row, idx) => (
                  <tr
                    key={`${row.type}-${idx}`}
                    onClick={() => setActiveTab(row.tab)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <td className="py-2.5 font-semibold text-[#133D68] dark:text-sky-400">
                      {row.type}
                    </td>
                    <td className="py-2.5 text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {row.name}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          row.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {tAdmin(adminLang, 'أحدث نشاطات المسؤولين', 'Recent Administrator Activities')}
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className="text-xs font-semibold text-[#133D68] dark:text-sky-400 hover:underline"
            >
              {tAdmin(adminLang, 'عرض السجل الكامل', 'View All')}
            </button>
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {data.activityLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {log.details || `${log.action} ${log.entityType}`}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {log.userEmail} • {log.entityType}
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold">
                  {log.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

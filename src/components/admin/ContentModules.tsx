import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { AdminModuleProps, AdminPageSection } from './AdminTypes';
import { tAdmin } from './AdminTranslations';

const SECTION_TYPES: Array<{ value: AdminPageSection['sectionType']; ar: string; en: string }> = [
  { value: 'hero', ar: 'قسم البانر الرئيسي (Hero)', en: 'Hero Section' },
  { value: 'image_text', ar: 'صورة ونص', en: 'Image & Text' },
  { value: 'two_column', ar: 'تصميم عمودين', en: 'Two-Column Layout' },
  { value: 'gallery', ar: 'معرض صور', en: 'Image Gallery' },
  { value: 'features', ar: 'بطاقات المزايا', en: 'Feature Cards' },
  { value: 'stats', ar: 'إحصائيات وأرقام', en: 'Statistics Section' },
  { value: 'testimonials', ar: 'آراء العملاء', en: 'Testimonials' },
  { value: 'cta', ar: 'دعوة لاتخاذ إجراء (CTA)', en: 'Call-to-Action' },
  { value: 'product_showcase', ar: 'عرض المنتجات', en: 'Product Showcase' },
  { value: 'project_showcase', ar: 'عرض المشاريع', en: 'Project Showcase' },
  { value: 'contact', ar: 'نموذج وتواصل', en: 'Contact Section' },
];

export const PagesBuilderModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
  openMediaPicker,
  markDirty,
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(data.pages[0]?.id ?? null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newPageForm, setNewPageForm] = useState({
    slug: '',
    template: 'standard',
    enTitle: '',
    arTitle: '',
    status: 'draft' as 'draft' | 'published',
  });

  const selectedPage = data.pages.find((p) => p.id === selectedId) || data.pages[0] || null;

  const [metaForm, setMetaForm] = useState({
    slug: '',
    template: 'standard',
    heroImageUrl: '/images/hero-pumps.jpg',
    status: 'published' as 'draft' | 'published' | 'archived' | 'scheduled',
    isVisible: true,
    scheduledAt: '',
    sortOrder: 0,
  });

  const [editLocale, setEditLocale] = useState<'ar' | 'en'>('ar');
  const [enForm, setEnForm] = useState<Record<string, string>>({});
  const [arForm, setArForm] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  // Section Builder state
  const [newSectionType, setNewSectionType] = useState<AdminPageSection['sectionType']>('image_text');
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [secDraft, setSecDraft] = useState({
    headingEn: '',
    headingAr: '',
    bodyEn: '',
    bodyAr: '',
    imageUrl: '',
    ctaTextEn: '',
    ctaTextAr: '',
    ctaUrl: '/quote',
    itemsTextEn: '',
    itemsTextAr: '',
  });

  useEffect(() => {
    if (!selectedPage) return;
    setMetaForm({
      slug: selectedPage.slug,
      template: selectedPage.template || 'standard',
      heroImageUrl: selectedPage.heroImageUrl || '/images/hero-pumps.jpg',
      status: selectedPage.status || (selectedPage.isPublished ? 'published' : 'draft'),
      isVisible: selectedPage.isVisible ?? true,
      scheduledAt: selectedPage.scheduledAt ? selectedPage.scheduledAt.slice(0, 16) : '',
      sortOrder: selectedPage.sortOrder || 0,
    });
    const e = (selectedPage.en || {}) as Record<string, string>;
    const a = (selectedPage.ar || {}) as Record<string, string>;
    setEnForm({
      title: e.title || '',
      heroHeading: e.heroHeading || '',
      heroSubheading: e.heroSubheading || '',
      heroCtaText: e.heroCtaText || '',
      heroCtaUrl: e.heroCtaUrl || '/quote',
      introBannerText: e.introBannerText || '',
      introBannerCtaText: e.introBannerCtaText || '',
      bodyContent: e.bodyContent || '',
    });
    setArForm({
      title: a.title || '',
      heroHeading: a.heroHeading || '',
      heroSubheading: a.heroSubheading || '',
      heroCtaText: a.heroCtaText || '',
      heroCtaUrl: a.heroCtaUrl || '/quote',
      introBannerText: a.introBannerText || '',
      introBannerCtaText: a.introBannerCtaText || '',
      bodyContent: a.bodyContent || '',
    });
    markDirty?.(false);
  }, [selectedPage?.id]);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/api/admin/pages', {
      method: 'POST',
      body: JSON.stringify(newPageForm),
    });
    if (res.ok) {
      const created = await res.json();
      showToast('success', tAdmin(adminLang, 'تم إنشاء الصفحة بنجاح', 'Page created'));
      setCreatingNew(false);
      setNewPageForm({ slug: '', template: 'standard', enTitle: '', arTitle: '', status: 'draft' });
      await reloadData();
      setSelectedId(created.id);
    } else {
      const err = await res.json().catch(() => ({}));
      showToast('error', err.error || 'Failed to create page');
    }
  };

  const handleSavePage = async (overrideStatus?: 'draft' | 'published' | 'archived') => {
    if (!selectedPage) return;
    const targetStatus = overrideStatus || metaForm.status;
    const resMeta = await apiRequest(`/api/admin/pages/${selectedPage.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...metaForm,
        status: targetStatus,
        scheduledAt: metaForm.scheduledAt || null,
      }),
    });
    const resEn = await apiRequest(`/api/admin/pages/${selectedPage.id}/translations/en`, {
      method: 'PUT',
      body: JSON.stringify(enForm),
    });
    const resAr = await apiRequest(`/api/admin/pages/${selectedPage.id}/translations/ar`, {
      method: 'PUT',
      body: JSON.stringify(arForm),
    });
    if (resMeta.ok && resEn.ok && resAr.ok) {
      markDirty?.(false);
      showToast('success', tAdmin(adminLang, 'تم حفظ الصفحة والترجمات بنجاح', 'Page & bilingual content saved'));
      await reloadData();
    } else {
      showToast('error', tAdmin(adminLang, 'حدث خطأ أثناء الحفظ', 'Failed to save page'));
    }
  };

  const handleDuplicatePage = async (id: number) => {
    const res = await apiRequest(`/api/admin/pages/${id}/duplicate`, { method: 'POST' });
    if (res.ok) {
      const copy = await res.json();
      showToast('success', tAdmin(adminLang, 'تم نسخ الصفحة كمسودة', 'Page duplicated as draft'));
      await reloadData();
      setSelectedId(copy.id);
    } else {
      showToast('error', 'Failed to duplicate');
    }
  };

  const handleDeletePage = async (id: number, slug: string) => {
    if (!window.confirm(tAdmin(adminLang, `هل تريد حذف الصفحة /${slug}؟`, `Delete page /${slug}?`))) return;
    const res = await apiRequest(`/api/admin/pages/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم حذف الصفحة', 'Page deleted'));
      await reloadData();
      setSelectedId(data.pages[0]?.id ?? null);
    } else {
      const err = await res.json().catch(() => ({}));
      showToast('error', err.error || 'Delete failed');
    }
  };

  const handleAddSection = async () => {
    if (!selectedPage) return;
    const res = await apiRequest(`/api/admin/pages/${selectedPage.id}/sections`, {
      method: 'POST',
      body: JSON.stringify({
        sectionType: newSectionType,
        sortOrder: (selectedPage.sections?.length || 0) + 1,
        isVisible: true,
        contentEnJson: { heading: 'Section Title', body: 'Editable section description', items: [] },
        contentArJson: { heading: 'عنوان القسم', body: 'وصف القسم القابل للتعديل', items: [] },
        settingsJson: {},
      }),
    });
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تمت إضافة القسم إلى الصفحة', 'Section added to page'));
      await reloadData();
    }
  };

  const openSectionEditor = (sec: AdminPageSection) => {
    const en = sec.contentEnJson || {};
    const ar = sec.contentArJson || {};
    setEditingSectionId(sec.id);
    setSecDraft({
      headingEn: String(en.heading || ''),
      headingAr: String(ar.heading || ''),
      bodyEn: String(en.body || ''),
      bodyAr: String(ar.body || ''),
      imageUrl: String(en.imageUrl || ar.imageUrl || ''),
      ctaTextEn: String(en.ctaText || ''),
      ctaTextAr: String(ar.ctaText || ''),
      ctaUrl: String(en.ctaUrl || '/quote'),
      itemsTextEn: Array.isArray(en.items) ? (en.items as string[]).join('\n') : '',
      itemsTextAr: Array.isArray(ar.items) ? (ar.items as string[]).join('\n') : '',
    });
  };

  const saveSectionEditor = async (sec: AdminPageSection) => {
    const res = await apiRequest(`/api/admin/page-sections/${sec.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        sectionType: sec.sectionType,
        sortOrder: sec.sortOrder,
        isVisible: sec.isVisible,
        contentEnJson: {
          heading: secDraft.headingEn,
          body: secDraft.bodyEn,
          imageUrl: secDraft.imageUrl,
          ctaText: secDraft.ctaTextEn,
          ctaUrl: secDraft.ctaUrl,
          items: secDraft.itemsTextEn.split('\n').map((s) => s.trim()).filter(Boolean),
        },
        contentArJson: {
          heading: secDraft.headingAr,
          body: secDraft.bodyAr,
          imageUrl: secDraft.imageUrl,
          ctaText: secDraft.ctaTextAr,
          ctaUrl: secDraft.ctaUrl,
          items: secDraft.itemsTextAr.split('\n').map((s) => s.trim()).filter(Boolean),
        },
        settingsJson: sec.settingsJson || {},
      }),
    });
    if (res.ok) {
      setEditingSectionId(null);
      showToast('success', tAdmin(adminLang, 'تم حفظ القسم', 'Section updated'));
      await reloadData();
    }
  };

  const moveSectionOrder = async (sec: AdminPageSection, delta: number) => {
    await apiRequest(`/api/admin/page-sections/${sec.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        sectionType: sec.sectionType,
        sortOrder: sec.sortOrder + delta,
        isVisible: sec.isVisible,
        contentEnJson: sec.contentEnJson,
        contentArJson: sec.contentArJson,
        settingsJson: sec.settingsJson,
      }),
    });
    await reloadData();
  };

  const toggleSectionVisibility = async (sec: AdminPageSection) => {
    await apiRequest(`/api/admin/page-sections/${sec.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        sectionType: sec.sectionType,
        sortOrder: sec.sortOrder,
        isVisible: !sec.isVisible,
        contentEnJson: sec.contentEnJson,
        contentArJson: sec.contentArJson,
        settingsJson: sec.settingsJson,
      }),
    });
    await reloadData();
  };

  const deleteSection = async (id: number) => {
    if (!window.confirm(tAdmin(adminLang, 'حذف هذا القسم؟', 'Delete this section?'))) return;
    await apiRequest(`/api/admin/page-sections/${id}`, { method: 'DELETE' });
    await reloadData();
  };

  const activeForm = editLocale === 'ar' ? arForm : enForm;
  const setActiveForm = (patch: Record<string, string>) => {
    markDirty?.(true);
    if (editLocale === 'ar') setArForm((prev) => ({ ...prev, ...patch }));
    else setEnForm((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {data.pages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                selectedPage?.id === p.id
                  ? 'bg-[#133D68] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>/{p.slug}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  p.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCreatingNew((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D93829] hover:bg-[#b52a1d] text-white text-xs font-semibold rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{tAdmin(adminLang, 'صفحة جديدة', 'New Page')}</span>
        </button>
      </div>

      {creatingNew && (
        <form
          onSubmit={handleCreatePage}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'الرابط (Slug)', 'URL Slug')}</label>
            <input
              required
              value={newPageForm.slug}
              onChange={(e) => setNewPageForm({ ...newPageForm, slug: e.target.value })}
              placeholder="sustainability"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'العنوان (عربي)', 'Arabic Title')}</label>
            <input
              required
              value={newPageForm.arTitle}
              onChange={(e) => setNewPageForm({ ...newPageForm, arTitle: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'العنوان (إنجليزي)', 'English Title')}</label>
            <input
              required
              value={newPageForm.enTitle}
              onChange={(e) => setNewPageForm({ ...newPageForm, enTitle: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'الحالة', 'Initial Status')}</label>
            <select
              value={newPageForm.status}
              onChange={(e) => setNewPageForm({ ...newPageForm, status: e.target.value as 'draft' | 'published' })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="draft">{tAdmin(adminLang, 'مسودة', 'Draft')}</option>
              <option value="published">{tAdmin(adminLang, 'منشور', 'Published')}</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-lg"
          >
            {tAdmin(adminLang, 'إنشاء الصفحة', 'Create Page')}
          </button>
        </form>
      )}

      {selectedPage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bilingual Content Editor */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditLocale('ar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    editLocale === 'ar'
                      ? 'bg-[#133D68] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  المحتوى العربي (AR)
                </button>
                <button
                  type="button"
                  onClick={() => setEditLocale('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    editLocale === 'en'
                      ? 'bg-[#133D68] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  English Content (EN)
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{tAdmin(adminLang, 'معاينة', 'Preview')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicatePage(selectedPage.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{tAdmin(adminLang, 'تكرار', 'Duplicate')}</span>
                </button>
                {selectedPage.slug !== 'home' && (
                  <button
                    type="button"
                    onClick={() => handleDeletePage(selectedPage.id, selectedPage.slug)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'عنوان الصفحة', 'Page Title')}</label>
                <input
                  value={activeForm.title || ''}
                  onChange={(e) => setActiveForm({ title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'العنوان الرئيسي (Hero)', 'Hero Heading')}</label>
                <input
                  value={activeForm.heroHeading || ''}
                  onChange={(e) => setActiveForm({ heroHeading: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'الوصف الفرعي (Hero Subheading)', 'Hero Subheading')}</label>
              <textarea
                rows={2}
                value={activeForm.heroSubheading || ''}
                onChange={(e) => setActiveForm({ heroSubheading: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'نص الزر الرئيسي', 'Hero CTA Text')}</label>
                <input
                  value={activeForm.heroCtaText || ''}
                  onChange={(e) => setActiveForm({ heroCtaText: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'رابط الزر', 'Hero CTA URL')}</label>
                <input
                  value={activeForm.heroCtaUrl || ''}
                  onChange={(e) => setActiveForm({ heroCtaUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'المحتوى النصي الرئيسي', 'Main Body Content')}</label>
              <textarea
                rows={5}
                value={activeForm.bodyContent || ''}
                onChange={(e) => setActiveForm({ bodyContent: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSavePage('published')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#133D68] hover:bg-[#0C2B4B] text-white text-xs font-bold rounded-lg"
              >
                <Save className="w-4 h-4" />
                <span>{tAdmin(adminLang, 'نشر التغييرات الآن', 'Save & Publish')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSavePage('draft')}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-lg"
              >
                <span>{tAdmin(adminLang, 'حفظ كمسودة', 'Save Draft')}</span>
              </button>
            </div>
          </div>

          {/* Right Sidebar: Page Settings & Status */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {tAdmin(adminLang, 'إعدادات النشر والرابط', 'Publishing & Page Settings')}
              </h4>
              <div>
                <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'رابط الصفحة (Slug)', 'URL Slug')}</label>
                <input
                  value={metaForm.slug}
                  disabled={selectedPage.slug === 'home'}
                  onChange={(e) => setMetaForm({ ...metaForm, slug: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'الحالة', 'Status')}</label>
                <select
                  value={metaForm.status}
                  onChange={(e) =>
                    setMetaForm({
                      ...metaForm,
                      status: e.target.value as 'draft' | 'published' | 'archived' | 'scheduled',
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="published">{tAdmin(adminLang, 'منشور', 'Published')}</option>
                  <option value="draft">{tAdmin(adminLang, 'مسودة', 'Draft')}</option>
                  <option value="scheduled">{tAdmin(adminLang, 'مجدول للنشر', 'Scheduled')}</option>
                  <option value="archived">{tAdmin(adminLang, 'مؤرشف', 'Archived')}</option>
                </select>
              </div>
              {metaForm.status === 'scheduled' && (
                <div>
                  <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'تاريخ النشر المجدول', 'Publish Date')}</label>
                  <input
                    type="datetime-local"
                    value={metaForm.scheduledAt}
                    onChange={(e) => setMetaForm({ ...metaForm, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              )}
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={metaForm.isVisible}
                  onChange={(e) => setMetaForm({ ...metaForm, isVisible: e.target.checked })}
                />
                <span>{tAdmin(adminLang, 'إظهار الصفحة في الموقع العام', 'Visible on public website')}</span>
              </label>
              <div>
                <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'صورة الغلاف', 'Hero Image')}</label>
                <div className="flex items-center gap-2">
                  <input
                    value={metaForm.heroImageUrl}
                    onChange={(e) => setMetaForm({ ...metaForm, heroImageUrl: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => openMediaPicker((url) => setMetaForm((f) => ({ ...f, heroImageUrl: url })))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    {tAdmin(adminLang, 'اختيار', 'Pick')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reusable Section Builder */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {tAdmin(adminLang, 'منشئ أقسام الصفحة (Section Builder)', 'Reusable Page Section Builder')}
                </h4>
                <p className="text-xs text-slate-500">
                  {tAdmin(
                    adminLang,
                    'أضف، أعد ترتيب، وحرّر أقسام هذه الصفحة باللغتين وتظهر تلقائياً على الرابط العام /p/' + selectedPage.slug,
                    `Add, reorder, and customize modular blocks rendered dynamically on /p/${selectedPage.slug}`
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={newSectionType}
                  onChange={(e) =>
                    setNewSectionType(e.target.value as AdminPageSection['sectionType'])
                  }
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {SECTION_TYPES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {tAdmin(adminLang, st.ar, st.en)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>{tAdmin(adminLang, 'إضافة قسم', 'Add Section')}</span>
                </button>
              </div>
            </div>

            {(!selectedPage.sections || selectedPage.sections.length === 0) ? (
              <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                {tAdmin(adminLang, 'لا توجد أقسام مخصصة مضافة لهذه الصفحة بعد.', 'No custom modular sections yet. Add one above.')}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPage.sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#133D68] text-white text-[10px] font-bold uppercase">
                          {sec.sectionType}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {adminLang === 'ar'
                            ? String(sec.contentArJson?.heading || sec.sectionType)
                            : String(sec.contentEnJson?.heading || sec.sectionType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveSectionOrder(sec, -1)}
                          className="p-1.5 rounded border border-slate-300 dark:border-slate-600 text-xs"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSectionOrder(sec, 1)}
                          className="p-1.5 rounded border border-slate-300 dark:border-slate-600 text-xs"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSectionVisibility(sec)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold ${
                            sec.isVisible
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {sec.isVisible ? tAdmin(adminLang, 'ظاهر', 'Visible') : tAdmin(adminLang, 'مخفي', 'Hidden')}
                        </button>
                        <button
                          type="button"
                          onClick={() => openSectionEditor(sec)}
                          className="px-2.5 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-semibold"
                        >
                          {tAdmin(adminLang, 'تعديل', 'Edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSection(sec.id)}
                          className="p-1.5 rounded text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {editingSectionId === sec.id && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          value={secDraft.headingAr}
                          onChange={(e) => setSecDraft({ ...secDraft, headingAr: e.target.value })}
                          placeholder="العنوان بالعربية"
                          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <input
                          value={secDraft.headingEn}
                          onChange={(e) => setSecDraft({ ...secDraft, headingEn: e.target.value })}
                          placeholder="English Heading"
                          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <textarea
                          rows={3}
                          value={secDraft.bodyAr}
                          onChange={(e) => setSecDraft({ ...secDraft, bodyAr: e.target.value })}
                          placeholder="المحتوى العربي"
                          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <textarea
                          rows={3}
                          value={secDraft.bodyEn}
                          onChange={(e) => setSecDraft({ ...secDraft, bodyEn: e.target.value })}
                          placeholder="English Body"
                          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            value={secDraft.imageUrl}
                            onChange={(e) => setSecDraft({ ...secDraft, imageUrl: e.target.value })}
                            placeholder="Image URL"
                            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => openMediaPicker((url) => setSecDraft((d) => ({ ...d, imageUrl: url })))}
                            className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
                          >
                            {tAdmin(adminLang, 'صورة', 'Pick')}
                          </button>
                        </div>
                        <input
                          value={secDraft.ctaUrl}
                          onChange={(e) => setSecDraft({ ...secDraft, ctaUrl: e.target.value })}
                          placeholder="CTA URL (/quote)"
                          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <textarea
                          rows={2}
                          value={secDraft.itemsTextAr}
                          onChange={(e) => setSecDraft({ ...secDraft, itemsTextAr: e.target.value })}
                          placeholder="عناصر / بطاقات عربية (سطر لكل عنصر)"
                          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <textarea
                          rows={2}
                          value={secDraft.itemsTextEn}
                          onChange={(e) => setSecDraft({ ...secDraft, itemsTextEn: e.target.value })}
                          placeholder="English Cards / Stats / Items (one per line)"
                          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <div className="sm:col-span-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingSectionId(null)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                          >
                            {tAdmin(adminLang, 'إلغاء', 'Cancel')}
                          </button>
                          <button
                            type="button"
                            onClick={() => saveSectionEditor(sec)}
                            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#133D68] text-white"
                          >
                            {tAdmin(adminLang, 'حفظ القسم', 'Save Section')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewOpen && selectedPage && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500">
                {tAdmin(adminLang, 'معاينة الصفحة قبل النشر', 'Live Draft Preview')} — /{metaForm.slug}
              </span>
              <button type="button" onClick={() => setPreviewOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5" dir={editLocale === 'ar' ? 'rtl' : 'ltr'}>
              <div className="rounded-xl overflow-hidden bg-[#0C2B4B] text-white p-8 relative">
                <h2 className="text-2xl font-bold">{activeForm.heroHeading || activeForm.title}</h2>
                <p className="text-sm text-sky-100 mt-2">{activeForm.heroSubheading}</p>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {activeForm.bodyContent}
              </p>
              {selectedPage.sections?.filter((s) => s.isVisible).map((s) => (
                <div key={s.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-[#D93829] uppercase">{s.sectionType}</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-1">
                    {editLocale === 'ar' ? String(s.contentArJson?.heading || '') : String(s.contentEnJson?.heading || '')}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {editLocale === 'ar' ? String(s.contentArJson?.body || '') : String(s.contentEnJson?.body || '')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SectorsModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
  openMediaPicker,
}) => {
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState({
    slug: '',
    routePath: '/divisions/',
    iconName: 'Cog',
    imageUrl: '/images/hero-pumps.jpg',
    accentColor: '#133D68',
    sortOrder: 1,
    isFeatured: true,
    isPublished: true,
    titleEn: '',
    shortTitleEn: '',
    taglineEn: '',
    summaryEn: '',
    descriptionEn: '',
    highlightsEn: '',
    titleAr: '',
    shortTitleAr: '',
    taglineAr: '',
    summaryAr: '',
    descriptionAr: '',
    highlightsAr: '',
  });

  const startEdit = (sec: (typeof data.sectors)[number]) => {
    setEditingId(sec.id);
    setForm({
      slug: sec.slug,
      routePath: sec.routePath,
      iconName: sec.iconName,
      imageUrl: sec.imageUrl,
      accentColor: sec.accentColor,
      sortOrder: sec.sortOrder,
      isFeatured: sec.isFeatured,
      isPublished: sec.isPublished,
      titleEn: sec.en?.title || '',
      shortTitleEn: sec.en?.shortTitle || '',
      taglineEn: sec.en?.tagline || '',
      summaryEn: sec.en?.summary || '',
      descriptionEn: sec.en?.description || '',
      highlightsEn: (sec.en?.highlightsJson || []).join('\n'),
      titleAr: sec.ar?.title || '',
      shortTitleAr: sec.ar?.shortTitle || '',
      taglineAr: sec.ar?.tagline || '',
      summaryAr: sec.ar?.summary || '',
      descriptionAr: sec.ar?.description || '',
      highlightsAr: (sec.ar?.highlightsJson || []).join('\n'),
    });
  };

  const startNew = () => {
    setEditingId('new');
    setForm({
      slug: '',
      routePath: '/divisions/',
      iconName: 'Building2',
      imageUrl: '/images/hero-pumps.jpg',
      accentColor: '#133D68',
      sortOrder: data.sectors.length + 1,
      isFeatured: true,
      isPublished: true,
      titleEn: '',
      shortTitleEn: '',
      taglineEn: '',
      summaryEn: '',
      descriptionEn: '',
      highlightsEn: '',
      titleAr: '',
      shortTitleAr: '',
      taglineAr: '',
      summaryAr: '',
      descriptionAr: '',
      highlightsAr: '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      slug: form.slug,
      routePath: form.routePath,
      iconName: form.iconName,
      imageUrl: form.imageUrl,
      accentColor: form.accentColor,
      sortOrder: Number(form.sortOrder),
      isFeatured: form.isFeatured,
      isPublished: form.isPublished,
      en: {
        title: form.titleEn,
        shortTitle: form.shortTitleEn || form.titleEn,
        tagline: form.taglineEn,
        summary: form.summaryEn,
        description: form.descriptionEn,
        highlightsJson: form.highlightsEn.split('\n').map((s) => s.trim()).filter(Boolean),
      },
      ar: {
        title: form.titleAr,
        shortTitle: form.shortTitleAr || form.titleAr,
        tagline: form.taglineAr,
        summary: form.summaryAr,
        description: form.descriptionAr,
        highlightsJson: form.highlightsAr.split('\n').map((s) => s.trim()).filter(Boolean),
      },
    };
    const isNew = editingId === 'new';
    const res = await apiRequest(isNew ? '/api/admin/sectors' : `/api/admin/sectors/${editingId}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم حفظ قطاع الأعمال بنجاح', 'Business sector saved'));
      setEditingId(null);
      await reloadData();
    } else {
      showToast('error', tAdmin(adminLang, 'فشل حفظ القطاع', 'Failed to save sector'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(tAdmin(adminLang, 'حذف قطاع الأعمال هذا؟', 'Delete this sector?'))) return;
    const res = await apiRequest(`/api/admin/sectors/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم حذف القطاع', 'Sector deleted'));
      await reloadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {tAdmin(adminLang, 'قطاعات الأعمال الرسمية للمجموعة', 'Group Business Sectors')} ({data.sectors.length})
          </h3>
          <p className="text-xs text-slate-500">
            {tAdmin(
              adminLang,
              'جميع القطاعات الظاهرة في الواجهة ثلاثية الأبعاد والصفحات يتم تحميلها مباشرة من قاعدة البيانات.',
              'Synced live with the homepage 3D sector dock and division showcase.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{tAdmin(adminLang, 'إضافة قطاع', 'Add Sector')}</span>
        </button>
      </div>

      {editingId && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="Slug (e.g. healthcare)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              required
              value={form.routePath}
              onChange={(e) => setForm({ ...form, routePath: e.target.value })}
              placeholder="/divisions/healthcare"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              placeholder="Sort Order"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <div className="flex items-center gap-2">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="Image URL"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => openMediaPicker((url) => setForm((f) => ({ ...f, imageUrl: url })))}
                className="px-2.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
              >
                {tAdmin(adminLang, 'صورة', 'Pick')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <h4 className="text-xs font-bold">البيانات العربية (AR)</h4>
              <input
                required
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                placeholder="اسم القطاع بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                value={form.shortTitleAr}
                onChange={(e) => setForm({ ...form, shortTitleAr: e.target.value })}
                placeholder="الاسم المختصر للأزرار"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <textarea
                rows={2}
                required
                value={form.summaryAr}
                onChange={(e) => setForm({ ...form, summaryAr: e.target.value })}
                placeholder="نبذة مختصرة بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <textarea
                rows={3}
                value={form.highlightsAr}
                onChange={(e) => setForm({ ...form, highlightsAr: e.target.value })}
                placeholder="أبرز النقاط (سطر لكل نقطة)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <h4 className="text-xs font-bold">English Data (EN)</h4>
              <input
                required
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="Sector Title (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                value={form.shortTitleEn}
                onChange={(e) => setForm({ ...form, shortTitleEn: e.target.value })}
                placeholder="Short Dock Label (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <textarea
                rows={2}
                required
                value={form.summaryEn}
                onChange={(e) => setForm({ ...form, summaryEn: e.target.value })}
                placeholder="English Summary"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <textarea
                rows={3}
                value={form.highlightsEn}
                onChange={(e) => setForm({ ...form, highlightsEn: e.target.value })}
                placeholder="Highlights (one per line)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              <span>{tAdmin(adminLang, 'منشور على الموقع العام', 'Published on public site')}</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
              >
                {tAdmin(adminLang, 'إلغاء', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#133D68] text-white text-xs font-bold"
              >
                {tAdmin(adminLang, 'حفظ القطاع', 'Save Sector')}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.sectors.map((sec) => (
          <div
            key={sec.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col"
          >
            <div className="h-32 bg-slate-100 relative">
              <img src={sec.imageUrl} alt={sec.slug} className="w-full h-full object-cover" />
              <span className="absolute top-2 end-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                #{sec.sortOrder}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {adminLang === 'ar' ? sec.ar?.title : sec.en?.title}
                </div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {adminLang === 'ar' ? sec.ar?.summary : sec.en?.summary}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-mono text-slate-400">{sec.routePath}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(sec)}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    {tAdmin(adminLang, 'تعديل', 'Edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sec.id)}
                    className="p-1.5 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const HomepageBannersModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
  openMediaPicker,
}) => {
  const [editingBannerId, setEditingBannerId] = useState<number | 'new' | null>(null);
  const [bannerForm, setBannerForm] = useState({
    placement: 'hero' as 'hero' | 'promo' | 'sector_banner',
    titleEn: '',
    titleAr: '',
    subtitleEn: '',
    subtitleAr: '',
    ctaTextEn: '',
    ctaTextAr: '',
    ctaUrl: '/quote',
    imageUrl: '/images/hero-pumps.jpg',
    mobileImageUrl: '/images/hero-pumps.jpg',
    sortOrder: 1,
    isPublished: true,
  });

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editingBannerId === 'new';
    const res = await apiRequest(
      isNew ? '/api/admin/banners' : `/api/admin/banners/${editingBannerId}`,
      { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(bannerForm) }
    );
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم حفظ البانر', 'Banner saved'));
      setEditingBannerId(null);
      await reloadData();
    } else {
      showToast('error', 'Failed to save banner');
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!window.confirm(tAdmin(adminLang, 'حذف هذا البانر؟', 'Delete this banner?'))) return;
    await apiRequest(`/api/admin/banners/${id}`, { method: 'DELETE' });
    await reloadData();
  };

  const updateSection = async (
    sec: (typeof data.homepageSections)[number],
    patch: Partial<typeof sec>
  ) => {
    const res = await apiRequest(`/api/admin/homepage-sections/${sec.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        titleEn: patch.titleEn ?? sec.titleEn,
        titleAr: patch.titleAr ?? sec.titleAr,
        subtitleEn: patch.subtitleEn ?? sec.subtitleEn,
        subtitleAr: patch.subtitleAr ?? sec.subtitleAr,
        sortOrder: patch.sortOrder ?? sec.sortOrder,
        isVisible: patch.isVisible ?? sec.isVisible,
        configJson: sec.configJson || {},
      }),
    });
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم تحديث ترتيب الصفحة الرئيسية', 'Homepage section updated'));
      await reloadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Banners Management */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {tAdmin(adminLang, 'البانرات والشرائح الترويجية', 'Homepage Banners & Sliders')}
          </h3>
          <button
            type="button"
            onClick={() => {
              setEditingBannerId('new');
              setBannerForm({
                placement: 'promo',
                titleEn: '',
                titleAr: '',
                subtitleEn: '',
                subtitleAr: '',
                ctaTextEn: 'Learn More',
                ctaTextAr: 'المزيد',
                ctaUrl: '/quote',
                imageUrl: '/images/hero-pumps.jpg',
                mobileImageUrl: '/images/hero-pumps.jpg',
                sortOrder: data.banners.length + 1,
                isPublished: true,
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#133D68] text-white text-xs font-semibold rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>{tAdmin(adminLang, 'إضافة بانر', 'Add Banner')}</span>
          </button>
        </div>

        {editingBannerId && (
          <form onSubmit={handleSaveBanner} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={bannerForm.placement}
                onChange={(e) => setBannerForm({ ...bannerForm, placement: e.target.value as 'hero' | 'promo' | 'sector_banner' })}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="hero">Hero Banner</option>
                <option value="promo">Promo Banner</option>
                <option value="sector_banner">Sector Spotlight</option>
              </select>
              <input
                value={bannerForm.ctaUrl}
                onChange={(e) => setBannerForm({ ...bannerForm, ctaUrl: e.target.value })}
                placeholder="CTA URL (/quote)"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <div className="flex gap-2">
                <input
                  value={bannerForm.imageUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                  placeholder="Image URL"
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => openMediaPicker((url) => setBannerForm((b) => ({ ...b, imageUrl: url })))}
                  className="px-2.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
                >
                  {tAdmin(adminLang, 'صورة', 'Pick')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                value={bannerForm.titleAr}
                onChange={(e) => setBannerForm({ ...bannerForm, titleAr: e.target.value })}
                placeholder="العنوان بالعربية"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                required
                value={bannerForm.titleEn}
                onChange={(e) => setBannerForm({ ...bannerForm, titleEn: e.target.value })}
                placeholder="English Title"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <textarea
                rows={2}
                value={bannerForm.subtitleAr}
                onChange={(e) => setBannerForm({ ...bannerForm, subtitleAr: e.target.value })}
                placeholder="النص الفرعي بالعربية"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <textarea
                rows={2}
                value={bannerForm.subtitleEn}
                onChange={(e) => setBannerForm({ ...bannerForm, subtitleEn: e.target.value })}
                placeholder="English Subtitle"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                value={bannerForm.ctaTextAr}
                onChange={(e) => setBannerForm({ ...bannerForm, ctaTextAr: e.target.value })}
                placeholder="نص الزر بالعربية"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                value={bannerForm.ctaTextEn}
                onChange={(e) => setBannerForm({ ...bannerForm, ctaTextEn: e.target.value })}
                placeholder="CTA Button Text (EN)"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={bannerForm.isPublished}
                  onChange={(e) => setBannerForm({ ...bannerForm, isPublished: e.target.checked })}
                />
                <span>{tAdmin(adminLang, 'منشور', 'Published')}</span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingBannerId(null)} className="px-3 py-1.5 text-xs border rounded-lg">
                  {tAdmin(adminLang, 'إلغاء', 'Cancel')}
                </button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-[#133D68] text-white rounded-lg">
                  {tAdmin(adminLang, 'حفظ البانر', 'Save Banner')}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.banners.map((b) => (
            <div key={b.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex gap-3">
              <img src={b.imageUrl} alt={b.titleEn} className="w-24 h-20 object-cover rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {b.placement}
                </span>
                <div className="text-xs font-bold mt-1 truncate">
                  {adminLang === 'ar' ? b.titleAr : b.titleEn}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                  {adminLang === 'ar' ? b.subtitleAr : b.subtitleEn}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBannerId(b.id);
                      setBannerForm({ ...b });
                    }}
                    className="text-xs font-semibold text-[#133D68] dark:text-sky-400"
                  >
                    {tAdmin(adminLang, 'تعديل', 'Edit')}
                  </button>
                  <button type="button" onClick={() => handleDeleteBanner(b.id)} className="text-xs text-rose-600">
                    {tAdmin(adminLang, 'حذف', 'Delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Homepage Sections Order & Visibility */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {tAdmin(adminLang, 'ترتيب وإظهار أقسام الصفحة الرئيسية', 'Homepage Sections Order & Visibility')}
        </h3>
        <div className="space-y-2">
          {data.homepageSections.map((sec) => (
            <div
              key={sec.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {adminLang === 'ar' ? sec.titleAr : sec.titleEn}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">{sec.sectionKey} • Order #{sec.sortOrder}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateSection(sec, { sortOrder: sec.sortOrder - 1 })}
                  className="p-1.5 border rounded"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => updateSection(sec, { sortOrder: sec.sortOrder + 1 })}
                  className="p-1.5 border rounded"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => updateSection(sec, { isVisible: !sec.isVisible })}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    sec.isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {sec.isVisible ? tAdmin(adminLang, 'ظاهر', 'Visible') : tAdmin(adminLang, 'مخفي', 'Hidden')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const WebsiteContentHubModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
  setActiveTab,
}) => {
  const [editingTestId, setEditingTestId] = useState<number | 'new' | null>(null);
  const [tForm, setTForm] = useState({
    authorName: '',
    authorRoleEn: '',
    authorRoleAr: '',
    companyName: '',
    quoteEn: '',
    quoteAr: '',
    isPublished: true,
  });

  const saveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editingTestId === 'new';
    const res = await apiRequest(
      isNew ? '/api/admin/testimonials' : `/api/admin/testimonials/${editingTestId}`,
      { method: isNew ? 'POST' : 'PUT', body: JSON.stringify({ ...tForm, isPlaceholder: false }) }
    );
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم حفظ الشهادة بنجاح', 'Testimonial saved'));
      setEditingTestId(null);
      await reloadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { tab: 'pages' as const, ar: 'تعديل محتوى الصفحات (من نحن، الشركاء...)', en: 'Edit Corporate Pages', count: data.pages.length },
          { tab: 'homepage' as const, ar: 'بنرات وترتيب الصفحة الرئيسية', en: 'Homepage Banners & Sections', count: data.banners.length },
          { tab: 'sectors' as const, ar: 'محتوى قطاعات الأعمال الخمسة', en: '5 Business Sectors', count: data.sectors.length },
          { tab: 'navigation' as const, ar: 'روابط الهيدر والتذييل', en: 'Header & Footer Navigation', count: data.menus.length },
        ].map((box) => (
          <button
            key={box.tab}
            type="button"
            onClick={() => setActiveTab(box.tab)}
            className="text-start bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-[#133D68]"
          >
            <div className="text-2xl font-bold font-mono-tabular text-[#133D68] dark:text-sky-400">
              {box.count}
            </div>
            <div className="text-xs font-bold mt-1 text-slate-900 dark:text-white">
              {tAdmin(adminLang, box.ar, box.en)}
            </div>
          </button>
        ))}
      </div>

      {/* Testimonials Manager */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {tAdmin(adminLang, 'شهادات وآراء العملاء', 'Client Testimonials')}
          </h3>
          <button
            type="button"
            onClick={() => {
              setEditingTestId('new');
              setTForm({
                authorName: '',
                authorRoleEn: '',
                authorRoleAr: '',
                companyName: '',
                quoteEn: '',
                quoteAr: '',
                isPublished: true,
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#133D68] text-white text-xs font-semibold rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>{tAdmin(adminLang, 'إضافة شهادة', 'Add Testimonial')}</span>
          </button>
        </div>

        {editingTestId && (
          <form onSubmit={saveTestimonial} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                required
                value={tForm.authorName}
                onChange={(e) => setTForm({ ...tForm, authorName: e.target.value })}
                placeholder="Author Name"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                required
                value={tForm.companyName}
                onChange={(e) => setTForm({ ...tForm, companyName: e.target.value })}
                placeholder="Company"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                value={tForm.authorRoleAr}
                onChange={(e) => setTForm({ ...tForm, authorRoleAr: e.target.value })}
                placeholder="المسمى الوظيفي (AR)"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                value={tForm.authorRoleEn}
                onChange={(e) => setTForm({ ...tForm, authorRoleEn: e.target.value })}
                placeholder="Role Title (EN)"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <textarea
                rows={2}
                required
                value={tForm.quoteAr}
                onChange={(e) => setTForm({ ...tForm, quoteAr: e.target.value })}
                placeholder="نص الشهادة بالعربية"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <textarea
                rows={2}
                required
                value={tForm.quoteEn}
                onChange={(e) => setTForm({ ...tForm, quoteEn: e.target.value })}
                placeholder="Quote in English"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={tForm.isPublished}
                  onChange={(e) => setTForm({ ...tForm, isPublished: e.target.checked })}
                />
                <span>{tAdmin(adminLang, 'منشور', 'Published')}</span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingTestId(null)} className="px-3 py-1.5 text-xs border rounded-lg">
                  {tAdmin(adminLang, 'إلغاء', 'Cancel')}
                </button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-[#133D68] text-white rounded-lg">
                  {tAdmin(adminLang, 'حفظ', 'Save')}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {data.testimonials.map((t) => (
            <div key={t.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold">{t.authorName} — {t.companyName}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {adminLang === 'ar' ? t.quoteAr : t.quoteEn}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTestId(t.id);
                    setTForm({ ...t });
                  }}
                  className="text-xs font-semibold text-[#133D68] dark:text-sky-400"
                >
                  {tAdmin(adminLang, 'تعديل', 'Edit')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(tAdmin(adminLang, 'حذف؟', 'Delete?'))) {
                      await apiRequest(`/api/admin/testimonials/${t.id}`, { method: 'DELETE' });
                      await reloadData();
                    }
                  }}
                  className="text-xs text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ServicesModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
  openMediaPicker,
}) => {
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState({
    slug: '',
    iconName: 'Droplets',
    imageUrl: '/images/facility-pump-room.jpg',
    division: 'pumps',
    sortOrder: 1,
    isFeatured: true,
    isPublished: true,
    titleEn: '',
    shortEn: '',
    fullEn: '',
    featuresEn: '',
    titleAr: '',
    shortAr: '',
    fullAr: '',
    featuresAr: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editingId === 'new';
    const res = await apiRequest(
      isNew ? '/api/admin/services' : `/api/admin/services/${editingId}`,
      {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify({
          slug: form.slug,
          iconName: form.iconName,
          imageUrl: form.imageUrl,
          division: form.division,
          sortOrder: Number(form.sortOrder),
          isFeatured: form.isFeatured,
          isPublished: form.isPublished,
          en: {
            title: form.titleEn,
            shortDescription: form.shortEn,
            fullDescription: form.fullEn,
            featuresJson: form.featuresEn.split('\n').map((s) => s.trim()).filter(Boolean),
          },
          ar: {
            title: form.titleAr,
            shortDescription: form.shortAr,
            fullDescription: form.fullAr,
            featuresJson: form.featuresAr.split('\n').map((s) => s.trim()).filter(Boolean),
          },
        }),
      }
    );
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم حفظ الخدمة', 'Service saved'));
      setEditingId(null);
      await reloadData();
    } else {
      showToast('error', 'Failed to save service');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {tAdmin(adminLang, 'إدارة الخدمات والحلول الهندسية', 'Services Management')} ({data.services.length})
        </h3>
        <button
          type="button"
          onClick={() => {
            setEditingId('new');
            setForm({
              slug: '',
              iconName: 'Droplets',
              imageUrl: '/images/facility-pump-room.jpg',
              division: 'pumps',
              sortOrder: data.services.length + 1,
              isFeatured: true,
              isPublished: true,
              titleEn: '',
              shortEn: '',
              fullEn: '',
              featuresEn: '',
              titleAr: '',
              shortAr: '',
              fullAr: '',
              featuresAr: '',
            });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{tAdmin(adminLang, 'إضافة خدمة', 'Add Service')}</span>
        </button>
      </div>

      {editingId && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              required
              disabled={editingId !== 'new'}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="Slug"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <select
              value={form.division}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="pumps">Industrial Pumps</option>
              <option value="contracting">Contracting</option>
              <option value="real-estate">Real Estate</option>
              <option value="healthcare">Healthcare</option>
              <option value="solar-energy">Solar Energy</option>
            </select>
            <input
              value={form.iconName}
              onChange={(e) => setForm({ ...form, iconName: e.target.value })}
              placeholder="Icon (Droplets, Gauge, Sun)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <div className="flex gap-2">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="Image URL"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => openMediaPicker((url) => setForm((f) => ({ ...f, imageUrl: url })))}
                className="px-2.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
              >
                Pick
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <input
                required
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                placeholder="عنوان الخدمة بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={2}
                required
                value={form.shortAr}
                onChange={(e) => setForm({ ...form, shortAr: e.target.value })}
                placeholder="وصف مختصر بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={3}
                value={form.fullAr}
                onChange={(e) => setForm({ ...form, fullAr: e.target.value })}
                placeholder="الوصف الكامل بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <input
                required
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="Service Title (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={2}
                required
                value={form.shortEn}
                onChange={(e) => setForm({ ...form, shortEn: e.target.value })}
                placeholder="Short Description (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={3}
                value={form.fullEn}
                onChange={(e) => setForm({ ...form, fullEn: e.target.value })}
                placeholder="Full Description (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              <span>{tAdmin(adminLang, 'منشور', 'Published')}</span>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs border rounded-lg">
                {tAdmin(adminLang, 'إلغاء', 'Cancel')}
              </button>
              <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-[#133D68] text-white rounded-lg">
                {tAdmin(adminLang, 'حفظ الخدمة', 'Save Service')}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.services.map((s) => (
          <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                {s.division}
              </span>
              <span className={`text-[10px] font-bold ${s.isPublished ? 'text-emerald-600' : 'text-amber-600'}`}>
                {s.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="font-bold text-sm">{adminLang === 'ar' ? s.ar?.title : s.en?.title}</div>
            <p className="text-xs text-slate-500 line-clamp-2">
              {adminLang === 'ar' ? s.ar?.shortDescription : s.en?.shortDescription}
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingId(s.id);
                  setForm({
                    slug: s.slug,
                    iconName: s.iconName,
                    imageUrl: s.imageUrl || '/images/facility-pump-room.jpg',
                    division: s.division,
                    sortOrder: s.sortOrder,
                    isFeatured: s.isFeatured,
                    isPublished: s.isPublished,
                    titleEn: s.en?.title || '',
                    shortEn: s.en?.shortDescription || '',
                    fullEn: s.en?.fullDescription || '',
                    featuresEn: (s.en?.featuresJson || []).join('\n'),
                    titleAr: s.ar?.title || '',
                    shortAr: s.ar?.shortDescription || '',
                    fullAr: s.ar?.fullDescription || '',
                    featuresAr: (s.ar?.featuresJson || []).join('\n'),
                  });
                }}
                className="text-xs font-semibold text-[#133D68] dark:text-sky-400"
              >
                {tAdmin(adminLang, 'تعديل', 'Edit')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(tAdmin(adminLang, 'حذف هذه الخدمة؟', 'Delete this service?'))) {
                    await apiRequest(`/api/admin/services/${s.id}`, { method: 'DELETE' });
                    await reloadData();
                  }
                }}
                className="text-xs text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BlogModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
  openMediaPicker,
}) => {
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState({
    slug: '',
    categoryEn: 'Corporate News',
    categoryAr: 'أخبار الشركة',
    tagsText: '',
    coverImageUrl: '/images/facility-pump-room.jpg',
    authorName: 'United Park Editorial Team',
    readTimeMinutes: 4,
    isPublished: true,
    titleEn: '',
    titleAr: '',
    excerptEn: '',
    excerptAr: '',
    contentEn: '',
    contentAr: '',
    seoTitleEn: '',
    seoTitleAr: '',
    seoDescEn: '',
    seoDescAr: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editingId === 'new';
    const { tagsText, ...rest } = form;
    const res = await apiRequest(isNew ? '/api/admin/blog' : `/api/admin/blog/${editingId}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify({
        ...rest,
        tagsJson: tagsText.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    });
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم حفظ المقال بنجاح', 'Article saved'));
      setEditingId(null);
      await reloadData();
    } else {
      showToast('error', 'Failed to save article');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {tAdmin(adminLang, 'الأخبار والمقالات والمدونة', 'News & Blog Management')} ({data.blogPosts.length})
        </h3>
        <button
          type="button"
          onClick={() => {
            setEditingId('new');
            setForm({
              slug: '',
              categoryEn: 'Corporate News',
              categoryAr: 'أخبار الشركة',
              tagsText: 'UPG, Engineering',
              coverImageUrl: '/images/facility-pump-room.jpg',
              authorName: 'United Park Editorial Team',
              readTimeMinutes: 4,
              isPublished: true,
              titleEn: '',
              titleAr: '',
              excerptEn: '',
              excerptAr: '',
              contentEn: '',
              contentAr: '',
              seoTitleEn: '',
              seoTitleAr: '',
              seoDescEn: '',
              seoDescAr: '',
            });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{tAdmin(adminLang, 'مقال جديد', 'New Article')}</span>
        </button>
      </div>

      {editingId && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="Article Slug"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={form.authorName}
              onChange={(e) => setForm({ ...form, authorName: e.target.value })}
              placeholder="Author Name"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={form.tagsText}
              onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
              placeholder="Tags (comma separated)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <div className="flex gap-2">
              <input
                value={form.coverImageUrl}
                onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                placeholder="Cover Image URL"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => openMediaPicker((url) => setForm((f) => ({ ...f, coverImageUrl: url })))}
                className="px-2.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
              >
                Pick
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <input
                required
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                placeholder="عنوان المقال بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                required
                value={form.excerptAr}
                onChange={(e) => setForm({ ...form, excerptAr: e.target.value })}
                placeholder="مقتطف مختصر بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={5}
                required
                value={form.contentAr}
                onChange={(e) => setForm({ ...form, contentAr: e.target.value })}
                placeholder="محتوى المقال بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <input
                required
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="Article Title (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                required
                value={form.excerptEn}
                onChange={(e) => setForm({ ...form, excerptEn: e.target.value })}
                placeholder="Short Excerpt (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={5}
                required
                value={form.contentEn}
                onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
                placeholder="Article Content (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              <span>{tAdmin(adminLang, 'منشور', 'Published')}</span>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs border rounded-lg">
                {tAdmin(adminLang, 'إلغاء', 'Cancel')}
              </button>
              <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-[#133D68] text-white rounded-lg">
                {tAdmin(adminLang, 'حفظ المقال', 'Save Article')}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.blogPosts.map((post) => (
          <div key={post.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-3">
            <img src={post.coverImageUrl} alt={post.titleEn} className="w-24 h-24 object-cover rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase text-[#133D68] dark:text-sky-400">
                  {adminLang === 'ar' ? post.categoryAr : post.categoryEn}
                </span>
                <span className={`text-[10px] font-bold ${post.isPublished ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {post.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="font-bold text-sm mt-1 truncate">
                {adminLang === 'ar' ? post.titleAr : post.titleEn}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                {adminLang === 'ar' ? post.excerptAr : post.excerptEn}
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(post.id);
                    setForm({
                      ...post,
                      tagsText: (post.tagsJson || []).join(', '),
                    });
                  }}
                  className="text-xs font-semibold text-[#133D68] dark:text-sky-400"
                >
                  {tAdmin(adminLang, 'تعديل', 'Edit')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(tAdmin(adminLang, 'حذف هذا المقال؟', 'Delete article?'))) {
                      await apiRequest(`/api/admin/blog/${post.id}`, { method: 'DELETE' });
                      await reloadData();
                    }
                  }}
                  className="text-xs text-rose-600"
                >
                  {tAdmin(adminLang, 'حذف', 'Delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

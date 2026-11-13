import React, { useMemo, useState } from 'react';
import {
  Download,
  ExternalLink,
  FolderPlus,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { AdminModuleProps } from './AdminTypes';
import {
  exportClientLeadsCsv,
  replaceClientMediaFile,
  uploadClientMediaFiles,
} from '../../data/clientCmsStore';
import { tAdmin } from './AdminTranslations';

export const MediaLibraryModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  authToken,
  showToast,
  reloadData,
}) => {
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null);
  const [metaForm, setMetaForm] = useState({
    titleEn: '',
    titleAr: '',
    altEn: '',
    altAr: '',
    descriptionEn: '',
    descriptionAr: '',
    folder: 'general',
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.mediaAssets.filter((m) => {
      if (folder !== 'all' && m.folder !== folder) return false;
      if (!q) return true;
      return (
        m.filename.toLowerCase().includes(q) ||
        (m.altEn || '').toLowerCase().includes(q) ||
        (m.altAr || '').toLowerCase().includes(q)
      );
    });
  }, [data.mediaAssets, folder, search]);

  const handleMultiUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await uploadClientMediaFiles(files, folder === 'all' ? 'general' : folder);
      showToast('success', tAdmin(adminLang, 'تم رفع الملفات بنجاح', 'Files uploaded successfully'));
      await reloadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceFile = async (id: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const ok = await replaceClientMediaFile(id, files[0]);
    if (ok) {
      showToast('success', tAdmin(adminLang, 'تم استبدال الملف مع الحفاظ على الرابط', 'File replaced cleanly'));
      await reloadData();
    } else {
      showToast('error', 'Failed to replace file');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const slug = newFolderName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const res = await apiRequest('/api/admin/media-folders', {
      method: 'POST',
      body: JSON.stringify({ name: newFolderName.trim(), slug, description: '' }),
    });
    if (res.ok) {
      setNewFolderName('');
      showToast('success', tAdmin(adminLang, 'تم إنشاء المجلد', 'Folder created'));
      await reloadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tAdmin(adminLang, 'بحث في الوسائط...', 'Search media files...')}
              className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="all">{tAdmin(adminLang, 'كل المجلدات', 'All Folders')}</option>
            {data.mediaFolders.map((f) => (
              <option key={f.id} value={f.slug}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleCreateFolder} className="flex items-center gap-1">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={tAdmin(adminLang, 'مجلد جديد...', 'New folder...')}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 w-32"
            />
            <button
              type="submit"
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700"
              title="Create Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </form>

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#133D68] hover:bg-[#0C2B4B] text-white text-xs font-semibold rounded-lg cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>
              {uploading
                ? tAdmin(adminLang, 'جاري الرفع...', 'Uploading...')
                : tAdmin(adminLang, 'رفع صور / فيديو (متعدد)', 'Upload Files (Multi)')}
            </span>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,application/pdf"
              className="hidden"
              onChange={(e) => handleMultiUpload(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* Metadata Editor */}
      {editingMediaId && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold">{tAdmin(adminLang, 'تعديل بيانات الملف والـ Alt SEO', 'Edit Media Metadata & Alt Text')}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={metaForm.titleAr}
              onChange={(e) => setMetaForm({ ...metaForm, titleAr: e.target.value })}
              placeholder="العنوان (AR)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={metaForm.titleEn}
              onChange={(e) => setMetaForm({ ...metaForm, titleEn: e.target.value })}
              placeholder="Title (EN)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <select
              value={metaForm.folder}
              onChange={(e) => setMetaForm({ ...metaForm, folder: e.target.value })}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {data.mediaFolders.map((f) => (
                <option key={f.id} value={f.slug}>
                  {f.name}
                </option>
              ))}
            </select>
            <input
              value={metaForm.altAr}
              onChange={(e) => setMetaForm({ ...metaForm, altAr: e.target.value })}
              placeholder="النص البديل Alt (AR)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={metaForm.altEn}
              onChange={(e) => setMetaForm({ ...metaForm, altEn: e.target.value })}
              placeholder="Alt Text (EN)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingMediaId(null)} className="px-3 py-1.5 text-xs border rounded-lg">
              {tAdmin(adminLang, 'إلغاء', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={async () => {
                const res = await apiRequest(`/api/admin/media/${editingMediaId}`, {
                  method: 'PUT',
                  body: JSON.stringify(metaForm),
                });
                if (res.ok) {
                  showToast('success', tAdmin(adminLang, 'تم حفظ البيانات', 'Metadata updated'));
                  setEditingMediaId(null);
                  await reloadData();
                }
              }}
              className="px-4 py-1.5 text-xs font-bold bg-[#133D68] text-white rounded-lg"
            >
              {tAdmin(adminLang, 'حفظ التعديلات', 'Save Metadata')}
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((asset) => (
          <div
            key={asset.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col"
          >
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
              {asset.mimeType.startsWith('image/') ? (
                <img src={asset.url} alt={asset.altEn || asset.filename} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">
                  {asset.mimeType}
                </div>
              )}
              <span className="absolute top-2 end-2 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[10px]">
                {asset.folder}
              </span>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{asset.filename}</div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1 font-mono">
                  <span>{Math.round(asset.sizeBytes / 1024)} KB</span>
                  <span>
                    {asset.width && asset.height ? `${asset.width}×${asset.height}` : asset.mimeType.split('/')[1]}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMediaId(asset.id);
                    setMetaForm({
                      titleEn: asset.titleEn || '',
                      titleAr: asset.titleAr || '',
                      altEn: asset.altEn || '',
                      altAr: asset.altAr || '',
                      descriptionEn: asset.descriptionEn || '',
                      descriptionAr: asset.descriptionAr || '',
                      folder: asset.folder,
                    });
                  }}
                  className="text-[11px] font-semibold text-[#133D68] dark:text-sky-400"
                >
                  {tAdmin(adminLang, 'البيانات', 'Edit')}
                </button>
                <label className="text-[11px] font-semibold text-amber-600 cursor-pointer">
                  {tAdmin(adminLang, 'استبدال', 'Replace')}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleReplaceFile(asset.id, e.target.files)}
                  />
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(tAdmin(adminLang, `حذف ${asset.filename} نهائياً؟`, `Delete ${asset.filename}?`))) {
                      await apiRequest(`/api/admin/media/${asset.id}`, { method: 'DELETE' });
                      await reloadData();
                    }
                  }}
                  className="text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LeadsModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  authToken,
  showToast,
  reloadData,
}) => {
  const [leadTab, setLeadTab] = useState<'quotes' | 'contacts'>('quotes');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const exportCsv = async (type: 'quotes' | 'contacts') => {
    const blob = exportClientLeadsCsv(type);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upg-${type}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', tAdmin(adminLang, 'تم تصدير ملف CSV', 'CSV exported'));
  };

  const filteredQuotes = data.quoteRequests.filter((q) => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.companyName.toLowerCase().includes(s) ||
      q.fullName.toLowerCase().includes(s) ||
      q.productOrService.toLowerCase().includes(s)
    );
  });

  const filteredContacts = data.contactMessages.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      c.subject.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLeadTab('quotes')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold ${
              leadTab === 'quotes' ? 'bg-[#133D68] text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {tAdmin(adminLang, 'طلبات عروض الأسعار', 'Quote Requests')} ({data.quoteRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setLeadTab('contacts')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold ${
              leadTab === 'contacts' ? 'bg-[#133D68] text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {tAdmin(adminLang, 'رسائل التواصل', 'Contact Messages')} ({data.contactMessages.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tAdmin(adminLang, 'بحث بالاسم أو الشركة...', 'Search inquiries...')}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="all">{tAdmin(adminLang, 'الكل', 'All')}</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            type="button"
            onClick={() => exportCsv(leadTab)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{tAdmin(adminLang, 'تصدير CSV', 'Export CSV')}</span>
          </button>
        </div>
      </div>

      {leadTab === 'quotes' ? (
        <div className="space-y-3">
          {filteredQuotes.map((q) => (
            <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {q.companyName} — {q.fullName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {q.businessEmail} • {q.phone} • <strong>{q.productOrService}</strong>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={q.assignedToUserId ?? ''}
                    onChange={async (e) => {
                      await apiRequest(`/api/admin/quotes/${q.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                          status: q.status,
                          adminNotes: q.adminNotes || '',
                          assignedToUserId: e.target.value ? Number(e.target.value) : null,
                        }),
                      });
                      await reloadData();
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="">{tAdmin(adminLang, 'تعيين لمسؤول...', 'Assign admin...')}</option>
                    {data.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName || u.email}
                      </option>
                    ))}
                  </select>
                  <select
                    value={q.status}
                    onChange={async (e) => {
                      await apiRequest(`/api/admin/quotes/${q.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                          status: e.target.value,
                          adminNotes: q.adminNotes || '',
                          assignedToUserId: q.assignedToUserId,
                        }),
                      });
                      showToast('success', tAdmin(adminLang, 'تم تحديث الحالة', 'Status updated'));
                      await reloadData();
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="quoted">Quoted</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                {q.projectDescription}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContacts.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {c.subject} — {c.fullName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {c.email} • {c.phone} • {c.company}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={c.assignedToUserId ?? ''}
                    onChange={async (e) => {
                      await apiRequest(`/api/admin/contacts/${c.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                          status: c.status,
                          adminNotes: c.adminNotes || '',
                          assignedToUserId: e.target.value ? Number(e.target.value) : null,
                        }),
                      });
                      await reloadData();
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="">{tAdmin(adminLang, 'تعيين لمسؤول...', 'Assign admin...')}</option>
                    {data.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName || u.email}
                      </option>
                    ))}
                  </select>
                  <select
                    value={c.status}
                    onChange={async (e) => {
                      await apiRequest(`/api/admin/contacts/${c.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                          status: e.target.value,
                          adminNotes: c.adminNotes || '',
                          assignedToUserId: c.assignedToUserId,
                        }),
                      });
                      showToast('success', tAdmin(adminLang, 'تم تحديث الحالة', 'Status updated'));
                      await reloadData();
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                {c.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SeoModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
  openMediaPicker,
}) => {
  const [seoForm, setSeoForm] = useState({
    routeKey: 'home',
    locale: 'en' as 'en' | 'ar',
    metaTitle: '',
    metaDescription: '',
    canonicalPath: '/',
    ogTitle: '',
    ogDescription: '',
    ogImageUrl: '/images/hero-pumps.jpg',
    ogType: 'website',
    schemaType: 'WebPage',
    keywords: '',
    noIndex: false,
  });

  const [redirForm, setRedirForm] = useState({ fromPath: '', toPath: '', statusCode: 301 });
  const [robotsTxt, setRobotsTxt] = useState(
    data.settings?.robotsTxt || 'User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: /sitemap.xml'
  );

  const loadEntry = (item: (typeof data.seoMetadata)[number]) => {
    setSeoForm({
      routeKey: item.routeKey,
      locale: item.locale,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      canonicalPath: item.canonicalPath,
      ogTitle: item.ogTitle || '',
      ogDescription: item.ogDescription || '',
      ogImageUrl: item.ogImageUrl || '/images/hero-pumps.jpg',
      ogType: item.ogType || 'website',
      schemaType: item.schemaType || 'WebPage',
      keywords: item.keywords || '',
      noIndex: Boolean(item.noIndex),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold">{tAdmin(adminLang, 'إعدادات تحسين محركات البحث (SEO & Meta Tags)', 'SEO Metadata & Indexing Manager')}</h3>
          <div className="flex items-center gap-3 text-xs">
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#133D68] dark:text-sky-400 font-semibold">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>/sitemap.xml</span>
            </a>
            <a href="/robots.txt" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#133D68] dark:text-sky-400 font-semibold">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>/robots.txt</span>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.seoMetadata.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => loadEntry(item)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-[#133D68]"
            >
              {item.routeKey} ({item.locale.toUpperCase()})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={seoForm.routeKey}
            onChange={(e) => setSeoForm({ ...seoForm, routeKey: e.target.value })}
            placeholder="routeKey (e.g. home, products)"
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <select
            value={seoForm.locale}
            onChange={(e) => setSeoForm({ ...seoForm, locale: e.target.value as 'en' | 'ar' })}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="ar">Arabic (ar)</option>
            <option value="en">English (en)</option>
          </select>
          <input
            value={seoForm.canonicalPath}
            onChange={(e) => setSeoForm({ ...seoForm, canonicalPath: e.target.value })}
            placeholder="Canonical Path (/)"
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>

        <input
          value={seoForm.metaTitle}
          onChange={(e) => setSeoForm({ ...seoForm, metaTitle: e.target.value })}
          placeholder="Meta Title"
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
        />
        <textarea
          rows={2}
          value={seoForm.metaDescription}
          onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
          placeholder="Meta Description"
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={seoForm.ogTitle}
            onChange={(e) => setSeoForm({ ...seoForm, ogTitle: e.target.value })}
            placeholder="OG Share Title"
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <div className="flex gap-2">
            <input
              value={seoForm.ogImageUrl}
              onChange={(e) => setSeoForm({ ...seoForm, ogImageUrl: e.target.value })}
              placeholder="OG Image URL"
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={() => openMediaPicker((url) => setSeoForm((s) => ({ ...s, ogImageUrl: url })))}
              className="px-2.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
            >
              Pick
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={seoForm.noIndex}
              onChange={(e) => setSeoForm({ ...seoForm, noIndex: e.target.checked })}
            />
            <span>{tAdmin(adminLang, 'منع الفهرسة (noindex)', 'Set noindex')}</span>
          </label>
        </div>

        <button
          type="button"
          onClick={async () => {
            const res = await apiRequest('/api/admin/seo', {
              method: 'PUT',
              body: JSON.stringify(seoForm),
            });
            if (res.ok) {
              showToast('success', tAdmin(adminLang, 'تم حفظ إعدادات SEO', 'SEO saved'));
              await reloadData();
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#133D68] text-white text-xs font-bold rounded-lg"
        >
          <Save className="w-4 h-4" />
          <span>{tAdmin(adminLang, 'حفظ سجل SEO', 'Save SEO Entry')}</span>
        </button>
      </div>

      {/* Redirects Manager */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold">{tAdmin(adminLang, 'إدارة التحويلات (URL Redirects 301/302)', 'URL Redirects Manager')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            value={redirForm.fromPath}
            onChange={(e) => setRedirForm({ ...redirForm, fromPath: e.target.value })}
            placeholder="/old-path"
            className="px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <input
            value={redirForm.toPath}
            onChange={(e) => setRedirForm({ ...redirForm, toPath: e.target.value })}
            placeholder="/new-path"
            className="px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <select
            value={redirForm.statusCode}
            onChange={(e) => setRedirForm({ ...redirForm, statusCode: Number(e.target.value) })}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value={301}>301 Permanent</option>
            <option value={302}>302 Temporary</option>
          </select>
          <button
            type="button"
            onClick={async () => {
              const res = await apiRequest('/api/admin/redirects', {
                method: 'POST',
                body: JSON.stringify({ ...redirForm, isActive: true }),
              });
              if (res.ok) {
                setRedirForm({ fromPath: '', toPath: '', statusCode: 301 });
                showToast('success', tAdmin(adminLang, 'تمت إضافة التحويل', 'Redirect added'));
                await reloadData();
              }
            }}
            className="px-4 py-2 bg-[#133D68] text-white text-xs font-bold rounded-lg"
          >
            {tAdmin(adminLang, 'إضافة تحويل', 'Add Redirect')}
          </button>
        </div>

        <div className="space-y-2">
          {data.redirects.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs font-mono">
              <span>
                {r.fromPath} → {r.toPath} ({r.statusCode}) • {r.hits} hits
              </span>
              <button
                type="button"
                onClick={async () => {
                  await apiRequest(`/api/admin/redirects/${r.id}`, { method: 'DELETE' });
                  await reloadData();
                }}
                className="text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* robots.txt Editor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold">{tAdmin(adminLang, 'ملف robots.txt المخصص', 'Editable robots.txt')}</h3>
        <textarea
          rows={5}
          value={robotsTxt}
          onChange={(e) => setRobotsTxt(e.target.value)}
          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
        />
        <button
          type="button"
          onClick={async () => {
            if (!data.settings) return;
            const res = await apiRequest('/api/admin/settings', {
              method: 'PUT',
              body: JSON.stringify({ ...data.settings, robotsTxt }),
            });
            if (res.ok) {
              showToast('success', tAdmin(adminLang, 'تم تحديث robots.txt', 'robots.txt updated'));
              await reloadData();
            }
          }}
          className="px-4 py-2 bg-[#133D68] text-white text-xs font-bold rounded-lg"
        >
          {tAdmin(adminLang, 'حفظ robots.txt', 'Save robots.txt')}
        </button>
      </div>
    </div>
  );
};

export const NavigationModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
}) => {
  const [newItem, setNewItem] = useState({
    menuId: data.menus[0]?.id || 1,
    labelEn: '',
    labelAr: '',
    url: '/',
    sortOrder: 10,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold">{tAdmin(adminLang, 'إضافة رابط قائمة جديد', 'Add Navigation Menu Item')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <select
            value={newItem.menuId}
            onChange={(e) => setNewItem({ ...newItem, menuId: Number(e.target.value) })}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            {data.menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.location})
              </option>
            ))}
          </select>
          <input
            value={newItem.labelAr}
            onChange={(e) => setNewItem({ ...newItem, labelAr: e.target.value })}
            placeholder="التسمية بالعربية"
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <input
            value={newItem.labelEn}
            onChange={(e) => setNewItem({ ...newItem, labelEn: e.target.value })}
            placeholder="Label (EN)"
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <input
            value={newItem.url}
            onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
            placeholder="/path"
            className="px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={async () => {
              const res = await apiRequest('/api/admin/menu-items', {
                method: 'POST',
                body: JSON.stringify({ ...newItem, isVisible: true }),
              });
              if (res.ok) {
                setNewItem({ ...newItem, labelEn: '', labelAr: '' });
                showToast('success', tAdmin(adminLang, 'تمت إضافة الرابط', 'Link added'));
                await reloadData();
              }
            }}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-[#133D68] text-white text-xs font-bold rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>{tAdmin(adminLang, 'إضافة', 'Add')}</span>
          </button>
        </div>
      </div>

      {data.menus.map((menu) => (
        <div key={menu.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold">
            {menu.name} <span className="text-xs font-mono text-slate-400">({menu.location})</span>
          </h4>
          <div className="space-y-2">
            {menu.items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs">
                <div>
                  <strong>{adminLang === 'ar' ? item.labelAr : item.labelEn}</strong>
                  <span className="ms-2 font-mono text-slate-400">{item.url}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await apiRequest(`/api/admin/menu-items/${item.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ ...item, isVisible: !item.isVisible }),
                      });
                      await reloadData();
                    }}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      item.isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.isVisible ? tAdmin(adminLang, 'ظاهر', 'Visible') : tAdmin(adminLang, 'مخفي', 'Hidden')}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(tAdmin(adminLang, 'حذف الرابط؟', 'Delete link?'))) {
                        await apiRequest(`/api/admin/menu-items/${item.id}`, { method: 'DELETE' });
                        await reloadData();
                      }
                    }}
                    className="text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Social Links */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-bold">{tAdmin(adminLang, 'روابط التواصل الاجتماعي', 'Social Links')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.socialLinks.map((soc) => (
            <div key={soc.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <div className="font-bold">{soc.label}</div>
                <div className="text-slate-400 font-mono truncate max-w-[200px]">{soc.url}</div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await apiRequest(`/api/admin/social-links/${soc.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ url: soc.url, isVisible: !soc.isVisible }),
                  });
                  await reloadData();
                }}
                className={`px-2.5 py-1 rounded font-semibold ${
                  soc.isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {soc.isVisible ? 'Active' : 'Hidden'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

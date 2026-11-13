import React, { useMemo, useState } from 'react';
import { Image as ImageIcon, Search, Upload, X } from 'lucide-react';
import { AdminLang, AdminOverviewPayload } from './AdminTypes';
import { tAdmin } from './AdminTranslations';

const STATIC_CORPORATE_ASSETS = [
  {
    url: '/assets/aistudio/image_ad8ad2f2-dc9e-407d-af3f-5c7149625b89_6b02dcf2.jpg',
    name: 'Official United Park Co. (PARK) Logo',
    folder: 'general',
  },
  { url: '/images/hero-pumps.jpg', name: 'Corporate Hero Pumping Facility', folder: 'banners' },
  { url: '/images/facility-pump-room.jpg', name: 'Industrial Pump Room', folder: 'projects' },
  { url: '/images/sector-utilities.jpg', name: 'Utilities & Solar Energy Infrastructure', folder: 'sectors' },
  { url: '/images/partners-banner.jpg', name: 'Corporate Architectural Facility', folder: 'sectors' },
  { url: '/images/product-pump.jpg', name: 'Industrial Vertical Multistage Pump', folder: 'products' },
];

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  data: AdminOverviewPayload;
  adminLang: AdminLang;
  authToken: string | null;
  reloadData: () => Promise<void>;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  open,
  onClose,
  onSelect,
  data,
  adminLang,
  authToken,
  reloadData,
  showToast,
}) => {
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');
  const [uploading, setUploading] = useState(false);

  const filteredUploaded = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.mediaAssets.filter((m) => {
      if (folderFilter !== 'all' && m.folder !== folderFilter) return false;
      if (!q) return true;
      return (
        m.filename.toLowerCase().includes(q) ||
        (m.altEn || '').toLowerCase().includes(q) ||
        (m.altAr || '').toLowerCase().includes(q)
      );
    });
  }, [data.mediaAssets, folderFilter, search]);

  if (!open) return null;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !authToken) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));
      formData.append('folder', folderFilter === 'all' ? 'general' : folderFilter);
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      const created = await res.json();
      await reloadData();
      showToast('success', tAdmin(adminLang, 'تم رفع الملف بنجاح', 'File uploaded successfully'));
      if (created?.url) {
        onSelect(created.url);
        onClose();
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-[#133D68] dark:text-sky-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              {tAdmin(adminLang, 'اختيار وسائط من المكتبة', 'Select Media From Library')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tAdmin(adminLang, 'بحث بالاسم أو النص البديل...', 'Search filename or alt text...')}
                className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="all">{tAdmin(adminLang, 'كل المجلدات', 'All Folders')}</option>
              {data.mediaFolders.map((f) => (
                <option key={f.id} value={f.slug}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#133D68] hover:bg-[#0C2B4B] text-white text-xs font-semibold rounded-lg cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{uploading ? tAdmin(adminLang, 'جاري الرفع...', 'Uploading...') : tAdmin(adminLang, 'رفع ملف جديد', 'Upload New')}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              {tAdmin(adminLang, 'الملفات المرفوعة في قاعدة البيانات', 'Uploaded Media Assets')} ({filteredUploaded.length})
            </p>
            {filteredUploaded.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                {tAdmin(adminLang, 'لا توجد وسائط مطابقة حالياً.', 'No uploaded assets matching this filter yet.')}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredUploaded.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      onSelect(asset.url);
                      onClose();
                    }}
                    className="group text-start border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-[#D93829] transition-colors bg-white dark:bg-slate-800"
                  >
                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 overflow-hidden">
                      {asset.mimeType.startsWith('image/') ? (
                        <img src={asset.url} alt={asset.altEn || asset.filename} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">
                          {asset.mimeType}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {asset.filename}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                        <span>{asset.folder}</span>
                        <span>{Math.round(asset.sizeBytes / 1024)} KB</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              {tAdmin(adminLang, 'صور الموقع الأساسية المحفوظة', 'Existing Website Image Library')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {STATIC_CORPORATE_ASSETS.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  className="text-start border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-[#D93829] transition-colors bg-white dark:bg-slate-800"
                >
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2 text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">
                    {item.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

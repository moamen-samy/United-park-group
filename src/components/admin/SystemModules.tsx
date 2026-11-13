import React, { useMemo, useState } from 'react';
import {
  Activity,
  Database,
  Download,
  KeyRound,
  Save,
  Search,
  Shield,
} from 'lucide-react';
import { AdminModuleProps } from './AdminTypes';
import { tAdmin } from './AdminTranslations';

export const UsersPermissionsModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
}) => {
  const [resetLinkModal, setResetLinkModal] = useState<{ email: string; link: string } | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200">
        {tAdmin(
          adminLang,
          'سياسة الأمان: لا يوجد تسجيل عام للمسؤولين. يدخل المستخدمون عبر مصادقة Firebase ويتم تعيين أدوارهم حصرياً بواسطة المدير الأعلى (Super Admin).',
          'Security Policy: Public admin registration is disabled. Accounts authenticate via Firebase Auth and roles are strictly assigned server-side by a Super Administrator.'
        )}
      </div>

      {/* 6 Enterprise RBAC Roles Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#133D68] dark:text-sky-400" />
          <span>{tAdmin(adminLang, 'مصفوفة الأدوار والصلاحيات (RBAC)', 'Enterprise RBAC Roles & Permissions')}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.roles.map((r) => (
            <div key={r.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{r.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                  {r.slug}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{r.description}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {(r.permissions || []).map((perm) => (
                  <span key={perm} className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-[#133D68] dark:text-sky-300 text-[10px] font-mono">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500">
              <tr>
                <th className="py-3 px-4 text-start">{tAdmin(adminLang, 'المستخدم', 'User')}</th>
                <th className="py-3 px-4 text-start">{tAdmin(adminLang, 'الدور', 'Role')}</th>
                <th className="py-3 px-4 text-start">{tAdmin(adminLang, 'الحالة', 'Account Status')}</th>
                <th className="py-3 px-4 text-end">{tAdmin(adminLang, 'الأمان وكلمة المرور', 'Security')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{u.displayName || u.email}</div>
                    <div className="text-[11px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.roleId ?? ''}
                      onChange={async (e) => {
                        const res = await apiRequest(`/api/admin/users/${u.id}/role`, {
                          method: 'PUT',
                          body: JSON.stringify({ roleId: Number(e.target.value), isActive: u.isActive }),
                        });
                        if (res.ok) {
                          showToast('success', tAdmin(adminLang, 'تم تحديث صلاحية المستخدم', 'Role updated'));
                          await reloadData();
                        } else {
                          const err = await res.json().catch(() => ({}));
                          showToast('error', err.error || 'Forbidden');
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {data.roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await apiRequest(`/api/admin/users/${u.id}/role`, {
                          method: 'PUT',
                          body: JSON.stringify({ roleId: u.roleId || 1, isActive: !u.isActive }),
                        });
                        if (res.ok) {
                          showToast('success', tAdmin(adminLang, 'تم تحديث حالة الحساب', 'Account status updated'));
                          await reloadData();
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                        u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {u.isActive ? tAdmin(adminLang, 'نشط', 'Active') : tAdmin(adminLang, 'معطل', 'Deactivated')}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await apiRequest(`/api/admin/users/${u.id}/reset-link`, {
                          method: 'POST',
                        });
                        if (res.ok) {
                          const payload = await res.json();
                          setResetLinkModal({ email: payload.email, link: payload.resetLink });
                        } else {
                          const err = await res.json().catch(() => ({}));
                          showToast('error', err.error || 'Unable to generate reset link');
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-[11px] font-semibold"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>{tAdmin(adminLang, 'رابط استعادة كلمة المرور', 'Reset Link')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {resetLinkModal && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-4 space-y-2 text-xs">
          <div className="font-bold">Firebase Password Reset Link ({resetLinkModal.email}):</div>
          <input
            readOnly
            value={resetLinkModal.link}
            className="w-full px-3 py-2 font-mono rounded border bg-slate-50 dark:bg-slate-800"
          />
        </div>
      )}
    </div>
  );
};

export const SettingsModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
  openMediaPicker,
}) => {
  const s = data.settings;
  const [form, setForm] = useState({
    companyNameEn: s?.companyNameEn || '',
    companyNameAr: s?.companyNameAr || '',
    taglineEn: s?.taglineEn || '',
    taglineAr: s?.taglineAr || '',
    addressEn: s?.addressEn || '',
    addressAr: s?.addressAr || '',
    phone: s?.phone || '',
    whatsapp: s?.whatsapp || '',
    email: s?.email || '',
    logoUrl: s?.logoUrl || '',
    primaryColor: s?.primaryColor || '#133D68',
    accentColor: s?.accentColor || '#D93829',
    mapEmbedUrl: s?.mapEmbedUrl || '',
    copyrightEn: s?.copyrightEn || '',
    copyrightAr: s?.copyrightAr || '',
    defaultCurrency: s?.defaultCurrency || 'SAR',
    supportedCurrenciesText: (s?.supportedCurrenciesJson || ['SAR', 'USD', 'AED', 'EUR']).join(', '),
    defaultTaxRate: s?.defaultTaxRate || '15',
    analyticsMeasurementId: s?.analyticsMeasurementId || '',
    robotsTxt: s?.robotsTxt || '',
    footerAboutEn: s?.footerAboutEn || '',
    footerAboutAr: s?.footerAboutAr || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { supportedCurrenciesText, ...rest } = form;
    const res = await apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        ...rest,
        supportedCurrenciesJson: supportedCurrenciesText
          .split(',')
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean),
      }),
    });
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم حفظ إعدادات الموقع', 'Website settings saved'));
      await reloadData();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast('error', err.error || 'Failed to save settings');
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
      <h3 className="text-sm font-bold border-b border-slate-200 dark:border-slate-800 pb-3">
        {tAdmin(adminLang, 'إعدادات الموقع والهوية والضرائب والتحليلات', 'Corporate Identity, Currency, Tax & Analytics Settings')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold">اسم الشركة بالعربية</label>
          <input
            required
            value={form.companyNameAr}
            onChange={(e) => setForm({ ...form, companyNameAr: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <label className="block text-xs font-semibold">الشعار النصي بالعربية</label>
          <input
            required
            value={form.taglineAr}
            onChange={(e) => setForm({ ...form, taglineAr: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <label className="block text-xs font-semibold">العنوان بالعربية</label>
          <input
            required
            value={form.addressAr}
            onChange={(e) => setForm({ ...form, addressAr: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold">Company Name (EN)</label>
          <input
            required
            value={form.companyNameEn}
            onChange={(e) => setForm({ ...form, companyNameEn: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <label className="block text-xs font-semibold">Tagline (EN)</label>
          <input
            required
            value={form.taglineEn}
            onChange={(e) => setForm({ ...form, taglineEn: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <label className="block text-xs font-semibold">Address (EN)</label>
          <input
            required
            value={form.addressEn}
            onChange={(e) => setForm({ ...form, addressEn: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Phone"
          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
        />
        <input
          value={form.whatsapp}
          onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          placeholder="WhatsApp"
          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
        />
        <div className="flex gap-2">
          <input
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            placeholder="Custom Logo URL (Optional)"
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={() => openMediaPicker((url) => setForm((f) => ({ ...f, logoUrl: url })))}
            className="px-2.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
          >
            Pick
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold mb-1">{tAdmin(adminLang, 'العملة الافتراضية', 'Default Currency')}</label>
          <input
            value={form.defaultCurrency}
            onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1">{tAdmin(adminLang, 'العملات المدعومة', 'Supported Currencies')}</label>
          <input
            value={form.supportedCurrenciesText}
            onChange={(e) => setForm({ ...form, supportedCurrenciesText: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1">{tAdmin(adminLang, 'نسبة الضريبة %', 'Default VAT %')}</label>
          <input
            value={form.defaultTaxRate}
            onChange={(e) => setForm({ ...form, defaultTaxRate: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1">Google Analytics (GA4 ID)</label>
          <input
            value={form.analyticsMeasurementId}
            onChange={(e) => setForm({ ...form, analyticsMeasurementId: e.target.value })}
            placeholder="G-XXXXXXXXXX"
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#133D68] text-white text-xs font-bold rounded-lg">
        <Save className="w-4 h-4" />
        <span>{tAdmin(adminLang, 'حفظ الإعدادات', 'Save Website Settings')}</span>
      </button>
    </form>
  );
};

export const BackupsModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
}) => {
  const [exporting, setExporting] = useState(false);

  const handleExportSnapshot = async () => {
    setExporting(true);
    try {
      const res = await apiRequest('/api/admin/backups/snapshot', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Snapshot failed (Super Admin required)');
      }
      const payload = await res.json();
      const blob = new Blob([payload.snapshotJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = payload.fileName;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', tAdmin(adminLang, 'تم إنشاء وتنزيل النسخة الاحتياطية الموثقة بنجاح', 'Verified PostgreSQL snapshot exported'));
      await reloadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Snapshot error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Database className="w-4 h-4 text-[#133D68] dark:text-sky-400" />
            <span>{tAdmin(adminLang, 'قاعدة بيانات Cloud SQL والنسخ الاحتياطي', 'Cloud SQL Diagnostics & Verified Backups')}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {data.dbHealth.databaseName} • {data.dbHealth.postgresVersion} • {(data.dbHealth.sizeBytes / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>

        <button
          type="button"
          disabled={exporting}
          onClick={handleExportSnapshot}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#133D68] hover:bg-[#0C2B4B] text-white text-xs font-bold rounded-lg disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          <span>
            {exporting
              ? tAdmin(adminLang, 'جاري التصدير...', 'Exporting...')
              : tAdmin(adminLang, 'تصدير نسخة احتياطية حقيقية (JSON Snapshot)', 'Export Verified DB Snapshot')}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {tAdmin(adminLang, 'سجل النسخ الاحتياطية المنفذة', 'Verified Snapshot Audit History')}
          </h4>
          {data.systemBackups.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">{tAdmin(adminLang, 'لم يتم تنفيذ أي لقطة احتياطية يدوية بعد.', 'No manual snapshots exported yet.')}</p>
          ) : (
            <div className="space-y-2">
              {data.systemBackups.map((bk) => (
                <div key={bk.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1">
                  <div className="font-bold truncate">{bk.fileName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {bk.tableCount} tables • {bk.totalRows} rows • {Math.round(bk.sizeBytes / 1024)} KB • {bk.createdByEmail}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">SHA-256: {bk.checksumSha256}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {tAdmin(adminLang, 'جداول PostgreSQL الحالية', 'Live Public Tables')} ({data.dbHealth.tables.length})
          </h4>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {data.dbHealth.tables.map((t) => (
              <div key={t.tableName} className="py-2 flex items-center justify-between font-mono">
                <span>{t.tableName}</span>
                <span className="text-slate-500">{t.rowCount} rows</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LogsModule: React.FC<AdminModuleProps> = ({ data, adminLang }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.activityLogs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (!q) return true;
      return (
        log.userEmail.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    });
  }, [data.activityLogs, search, actionFilter]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#133D68] dark:text-sky-400" />
          <h3 className="text-sm font-bold">{tAdmin(adminLang, 'سجل النشاط والأمان', 'Security & Activity Audit Trail')}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute top-2.5 start-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tAdmin(adminLang, 'بحث في السجل...', 'Filter logs...')}
              className="ps-8 pe-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="all">{tAdmin(adminLang, 'كل العمليات', 'All Actions')}</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="UPLOAD">UPLOAD</option>
            <option value="EXPORT">EXPORT</option>
            <option value="BACKUP">BACKUP</option>
            <option value="SECURITY">SECURITY</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500">
              <tr>
                <th className="py-2.5 px-4 text-start">{tAdmin(adminLang, 'العملية', 'Action')}</th>
                <th className="py-2.5 px-4 text-start">{tAdmin(adminLang, 'المستخدم', 'Administrator')}</th>
                <th className="py-2.5 px-4 text-start">{tAdmin(adminLang, 'الكيان', 'Entity')}</th>
                <th className="py-2.5 px-4 text-start">{tAdmin(adminLang, 'التفاصيل', 'Details')}</th>
                <th className="py-2.5 px-4 text-end">{tAdmin(adminLang, 'الوقت', 'Timestamp')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold">{log.userEmail}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{log.details}</td>
                  <td className="py-2.5 px-4 text-end font-mono text-[11px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

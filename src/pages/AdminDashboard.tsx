import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Briefcase,
  Building2,
  Compass,
  Database,
  FileText,
  FolderTree,
  Globe,
  Image as ImageIcon,
  Inbox,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  LogOut,
  Menu,
  Moon,
  Newspaper,
  Package,
  RefreshCw,
  Settings,
  Shield,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ParkLogo } from '../components/BrandMark';
import { ADMIN_SIDEBAR_ITEMS, tAdmin } from '../components/admin/AdminTranslations';
import { AdminLang, AdminOverviewPayload, AdminTab, AdminTheme } from '../components/admin/AdminTypes';
import { MediaPickerModal } from '../components/admin/MediaPickerModal';
import { OverviewModule } from '../components/admin/OverviewModule';
import {
  BlogModule,
  HomepageBannersModule,
  PagesBuilderModule,
  SectorsModule,
  ServicesModule,
  WebsiteContentHubModule,
} from '../components/admin/ContentModules';
import { CategoriesModule, ProductsModule, ProjectsModule } from '../components/admin/CatalogModules';
import {
  LeadsModule,
  MediaLibraryModule,
  NavigationModule,
  SeoModule,
} from '../components/admin/MediaLeadsSeoModules';
import {
  BackupsModule,
  LogsModule,
  SettingsModule,
  UsersPermissionsModule,
} from '../components/admin/SystemModules';

const TAB_ICONS: Record<AdminTab, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  content: LayoutTemplate,
  pages: FileText,
  homepage: LayoutGrid,
  sectors: Building2,
  products: Package,
  categories: FolderTree,
  services: Briefcase,
  projects: Compass,
  media: ImageIcon,
  blog: Newspaper,
  seo: Globe,
  navigation: Menu,
  leads: Inbox,
  users: Users,
  settings: Settings,
  backups: Database,
  logs: Activity,
};

export const AdminDashboard: React.FC = () => {
  const {
    firebaseUser,
    dbUser,
    authToken,
    authLoading,
    authError,
    signInWithGoogle,
    signInWithEmail,
    sendPasswordReset,
    signOut,
    navigate,
    bootstrap,
    refreshBootstrap,
  } = useApp();

  // Arabic RTL as default admin language, plus Light & Dark themes
  const [adminLang, setAdminLang] = useState<AdminLang>('ar');
  const [adminTheme, setAdminTheme] = useState<AdminTheme>('light');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AdminOverviewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Email/Password login state (no public registration)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Global Media Picker state
  const [mediaPickerCallback, setMediaPickerCallback] = useState<((url: string) => void) | null>(null);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4200);
  }, []);

  const fetchOverview = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to load CMS overview');
      }
      const json: AdminOverviewPayload = await res.json();
      setData(json);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to load CMS data.');
    } finally {
      setLoading(false);
    }
  }, [authToken, showToast]);

  useEffect(() => {
    if (authToken && dbUser && dbUser.roleSlug !== 'viewer') {
      fetchOverview();
    }
  }, [authToken, dbUser, fetchOverview]);

  const apiRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!authToken) throw new Error('Not authenticated');
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          ...(options.headers || {}),
        },
      });
      return res;
    },
    [authToken]
  );

  const handleTabSwitch = (nextTab: AdminTab) => {
    if (hasUnsavedChanges) {
      const proceed = window.confirm(
        tAdmin(
          adminLang,
          'لديك تعديلات غير محفوظة. هل تريد الانتقال دون حفظ؟',
          'You have unsaved changes. Leave this section anyway?'
        )
      );
      if (!proceed) return;
      setHasUnsavedChanges(false);
    }
    setActiveTab(nextTab);
    setSidebarOpen(false);
  };

  const reloadAll = async () => {
    await fetchOverview();
    await refreshBootstrap();
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div
        dir={adminLang === 'ar' ? 'rtl' : 'ltr'}
        className={`${adminTheme === 'dark' ? 'dark' : ''} min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6`}
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 max-w-md w-full text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#133D68] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {tAdmin(adminLang, 'جاري التحقق من جلسة المسؤول...', 'Verifying administrator session...')}
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated Sign-In Screen
  if (!firebaseUser || !dbUser) {
    return (
      <div
        dir={adminLang === 'ar' ? 'rtl' : 'ltr'}
        className={`${adminTheme === 'dark' ? 'dark' : ''} min-h-screen bg-[#0C2B4B] flex items-center justify-center p-6`}
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ParkLogo
                variant="dark"
                compact
                src={bootstrap?.settings?.logoUrl}
                alt={tAdmin(adminLang, 'مجموعة بارك المتحدة', 'United Park Co.')}
              />
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-[#133D68] dark:text-white leading-tight">
                  {tAdmin(adminLang, 'بوابة إدارة مجموعة بارك المتحدة', 'United Park Group Enterprise CMS')}
                </h1>
                <p className="text-xs text-slate-500">
                  {tAdmin(adminLang, 'لوحة تحكم المسؤولين المصرح لهم فقط', 'Authorized Administrative Portal')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAdminLang((l) => (l === 'ar' ? 'en' : 'ar'))}
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              {adminLang === 'ar' ? 'EN' : 'عربي'}
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {authError}
            </div>
          )}

          {resetSent && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              {tAdmin(
                adminLang,
                'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.',
                'Password reset link sent to your email.'
              )}
            </div>
          )}

          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full py-3 bg-[#133D68] hover:bg-[#0C2B4B] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {tAdmin(adminLang, 'تسجيل الدخول عبر حساب Google', 'Sign In with Google Workspace')}
          </button>

          <div className="relative text-center text-[11px] text-slate-400">
            <span className="bg-white dark:bg-slate-900 px-2 relative z-10">
              {tAdmin(adminLang, 'أو بالبريد الإلكتروني وكلمة المرور', 'OR EMAIL & PASSWORD')}
            </span>
            <div className="border-t border-slate-200 dark:border-slate-800 absolute inset-x-0 top-1/2" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              signInWithEmail(loginEmail, loginPassword);
            }}
            className="space-y-3"
          >
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder={tAdmin(adminLang, 'البريد الإلكتروني الوظيفي', 'Corporate Email')}
              className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder={tAdmin(adminLang, 'كلمة المرور', 'Password')}
              className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={async () => {
                  if (!loginEmail) return;
                  await sendPasswordReset(loginEmail).catch(() => {});
                  setResetSent(true);
                }}
                className="text-[#133D68] dark:text-sky-400 hover:underline"
              >
                {tAdmin(adminLang, 'نسيت كلمة المرور؟', 'Forgot password?')}
              </button>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 border border-[#133D68] text-[#133D68] dark:text-white dark:border-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {tAdmin(adminLang, 'دخول بالبريد الإلكتروني', 'Sign In With Email')}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg"
          >
            {tAdmin(adminLang, 'العودة إلى الموقع العام', 'Return to Public Website')}
          </button>
        </div>
      </div>
    );
  }

  // Pending / Viewer role screen
  if (dbUser.roleSlug === 'viewer') {
    return (
      <div
        dir={adminLang === 'ar' ? 'rtl' : 'ltr'}
        className="min-h-screen bg-slate-100 flex items-center justify-center p-6"
      >
        <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-8 text-center space-y-4">
          <div className="flex justify-center">
            <ParkLogo
              variant="dark"
              compact
              src={bootstrap?.settings?.logoUrl}
              alt={tAdmin(adminLang, 'مجموعة بارك المتحدة', 'United Park Co.')}
            />
          </div>
          <Shield className="w-8 h-8 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#133D68]">
            {tAdmin(adminLang, 'الحساب بانتظار اعتماد الصلاحية', 'Role Assignment Required')}
          </h2>
          <p className="text-sm text-slate-600">
            {tAdmin(
              adminLang,
              `تم تسجيل الدخول بنجاح (${dbUser.email})، لكن حسابك حالياً بدور مشاهد (Viewer) بانتظار ترقيته من المدير الأعلى.`,
              `Signed in as ${dbUser.email}. Your account currently holds Viewer access until a Super Administrator assigns an editorial or admin role.`
            )}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={signOut}
              className="px-4 py-2 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg"
            >
              {tAdmin(adminLang, 'تسجيل الخروج', 'Sign Out')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-lg"
            >
              {tAdmin(adminLang, 'الموقع العام', 'Public Site')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeNavMeta = ADMIN_SIDEBAR_ITEMS.find((i) => i.id === activeTab);

  const moduleProps = data
    ? {
        data,
        adminLang,
        apiRequest,
        authToken,
        showToast,
        reloadData: reloadAll,
        openMediaPicker: (cb: (url: string) => void) => setMediaPickerCallback(() => cb),
        setActiveTab: handleTabSwitch,
        navigate,
        markDirty: setHasUnsavedChanges,
      }
    : null;

  return (
    <div
      dir={adminLang === 'ar' ? 'rtl' : 'ltr'}
      className={`${adminTheme === 'dark' ? 'dark' : ''} min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex`}
    >
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 18-Section Responsive Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 start-0 z-40 w-72 h-screen bg-[#0C2B4B] text-white flex flex-col shrink-0 transition-transform duration-200 ${
          sidebarOpen
            ? 'translate-x-0'
            : adminLang === 'ar'
              ? 'translate-x-full lg:translate-x-0'
              : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="space-y-1.5 min-w-0">
            <ParkLogo
              variant="light"
              compact
              src={data?.settings?.logoUrl || bootstrap?.settings?.logoUrl}
              alt={tAdmin(adminLang, 'مجموعة بارك المتحدة', 'United Park Co.')}
            />
            <div className="text-[11px] text-sky-200 truncate">
              {tAdmin(adminLang, 'منصة الإدارة المؤسسية (CMS)', 'Enterprise CMS Portal')}
            </div>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {ADMIN_SIDEBAR_ITEMS.map((item) => {
            const Icon = TAB_ICONS[item.id];
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabSwitch(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#D93829] text-white shadow-sm'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tAdmin(adminLang, item.ar, item.en)}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2 text-xs">
          <div className="truncate font-bold text-white">{dbUser.displayName || dbUser.email}</div>
          <div className="text-[11px] text-sky-200">{dbUser.roleName}</div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-1.5 rounded bg-white/10 hover:bg-white/20 text-[11px] font-semibold"
            >
              {tAdmin(adminLang, 'الموقع العام', 'View Site')}
            </button>
            <button
              type="button"
              onClick={signOut}
              className="p-1.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-200"
              title={tAdmin(adminLang, 'تسجيل الخروج', 'Sign Out')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                {activeNavMeta ? tAdmin(adminLang, activeNavMeta.ar, activeNavMeta.en) : ''}
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {tAdmin(
                  adminLang,
                  'كافة التغييرات تحفظ مباشرة في Cloud SQL PostgreSQL وتنعكس على الموقع العام.',
                  'All edits persist directly to Cloud SQL PostgreSQL and update the public site live.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdminLang((l) => (l === 'ar' ? 'en' : 'ar'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{adminLang === 'ar' ? 'EN' : 'العربية'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTheme((th) => (th === 'light' ? 'dark' : 'light'))}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              title={tAdmin(adminLang, 'تبديل المظهر الفاتح/الداكن', 'Toggle Light/Dark Theme')}
            >
              {adminTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              type="button"
              onClick={fetchOverview}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              title={tAdmin(adminLang, 'تحديث البيانات', 'Refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {toast && (
          <div className="px-4 sm:px-6 pt-4">
            <div
              className={`px-4 py-3 rounded-xl text-xs font-bold border ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
              }`}
            >
              {toast.text}
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">
          {!data || !moduleProps ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-sm text-slate-500">
              {tAdmin(adminLang, 'جاري تحميل بيانات لوحة التحكم...', 'Loading Enterprise CMS workspace...')}
            </div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewModule {...moduleProps} />}
              {activeTab === 'content' && <WebsiteContentHubModule {...moduleProps} />}
              {activeTab === 'pages' && <PagesBuilderModule {...moduleProps} />}
              {activeTab === 'homepage' && <HomepageBannersModule {...moduleProps} />}
              {activeTab === 'sectors' && <SectorsModule {...moduleProps} />}
              {activeTab === 'products' && <ProductsModule {...moduleProps} />}
              {activeTab === 'categories' && <CategoriesModule {...moduleProps} />}
              {activeTab === 'services' && <ServicesModule {...moduleProps} />}
              {activeTab === 'projects' && <ProjectsModule {...moduleProps} />}
              {activeTab === 'media' && <MediaLibraryModule {...moduleProps} />}
              {activeTab === 'blog' && <BlogModule {...moduleProps} />}
              {activeTab === 'seo' && <SeoModule {...moduleProps} />}
              {activeTab === 'navigation' && <NavigationModule {...moduleProps} />}
              {activeTab === 'leads' && <LeadsModule {...moduleProps} />}
              {activeTab === 'users' && <UsersPermissionsModule {...moduleProps} />}
              {activeTab === 'settings' && <SettingsModule {...moduleProps} />}
              {activeTab === 'backups' && <BackupsModule {...moduleProps} />}
              {activeTab === 'logs' && <LogsModule {...moduleProps} />}
            </>
          )}
        </main>
      </div>

      {/* Global Media Picker Modal */}
      {data && (
        <MediaPickerModal
          open={Boolean(mediaPickerCallback)}
          onClose={() => setMediaPickerCallback(null)}
          onSelect={(url) => {
            if (mediaPickerCallback) mediaPickerCallback(url);
          }}
          data={data}
          adminLang={adminLang}
          authToken={authToken}
          reloadData={reloadAll}
          showToast={showToast}
        />
      )}
    </div>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  FileText,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

type AdminTab =
  | 'overview'
  | 'leads'
  | 'products'
  | 'partners'
  | 'pages'
  | 'projects'
  | 'news'
  | 'media'
  | 'seo'
  | 'settings'
  | 'users';

interface AdminOverviewPayload {
  settings: Record<string, string>;
  pages: Array<{
    id: number;
    slug: string;
    en: Record<string, string> | null;
    ar: Record<string, string> | null;
  }>;
  services: Array<{
    id: number;
    slug: string;
    isPublished: boolean;
    en: { title: string; shortDescription: string; fullDescription: string } | null;
    ar: { title: string; shortDescription: string; fullDescription: string } | null;
  }>;
  partners: Array<{
    id: number;
    slug: string;
    name: string;
    logoUrl: string;
    websiteUrl: string;
    country: string;
    categoryLabelEn: string;
    categoryLabelAr: string;
    sortOrder: number;
    isFeatured: boolean;
    isPublished: boolean;
    en: { displayName: string; tagline: string; description: string } | null;
    ar: { displayName: string; tagline: string; description: string } | null;
  }>;
  categories: Array<{ id: number; slug: string; nameEn: string; nameAr: string }>;
  products: Array<{
    id: number;
    sku: string;
    slug: string;
    categoryId: number | null;
    partnerId: number | null;
    imageUrl: string;
    datasheetUrl: string;
    division: string;
    isFeatured: boolean;
    isPublished: boolean;
    sortOrder: number;
    en: { name: string; summary: string; description: string; specificationsJson: Array<{ label: string; value: string; unit?: string }> } | null;
    ar: { name: string; summary: string; description: string; specificationsJson: Array<{ label: string; value: string; unit?: string }> } | null;
  }>;
  projects: Array<{
    id: number;
    slug: string;
    category: string;
    division: string;
    locationEn: string;
    locationAr: string;
    completionYear: string;
    imageUrl: string;
    isPublished: boolean;
    en: { title: string; summary: string; scopeOfWork: string; outcomeNotes: string } | null;
    ar: { title: string; summary: string; scopeOfWork: string; outcomeNotes: string } | null;
  }>;
  blogPosts: Array<{
    id: number;
    slug: string;
    categoryEn: string;
    categoryAr: string;
    coverImageUrl: string;
    readTimeMinutes: number;
    isPublished: boolean;
    titleEn: string;
    titleAr: string;
    excerptEn: string;
    excerptAr: string;
    contentEn: string;
    contentAr: string;
  }>;
  menus: Array<{
    id: number;
    location: string;
    name: string;
    items: Array<{ id: number; url: string; labelEn: string; labelAr: string; sortOrder: number; isVisible: boolean }>;
  }>;
  socialLinks: Array<{ id: number; platform: string; label: string; url: string; isVisible: boolean }>;
  seoMetadata: Array<{
    id: number;
    routeKey: string;
    locale: 'en' | 'ar';
    metaTitle: string;
    metaDescription: string;
    canonicalPath: string;
    keywords: string;
  }>;
  contactMessages: Array<{
    id: number;
    fullName: string;
    email: string;
    phone: string;
    company: string;
    subject: string;
    message: string;
    status: string;
    adminNotes: string;
    createdAt: string;
  }>;
  quoteRequests: Array<{
    id: number;
    fullName: string;
    companyName: string;
    businessEmail: string;
    phone: string;
    productOrService: string;
    estimatedQuantity: string;
    projectDescription: string;
    preferredContactMethod: string;
    attachmentAssetId: number | null;
    attachmentName: string;
    status: string;
    adminNotes: string;
    createdAt: string;
  }>;
  mediaAssets: Array<{
    id: number;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    folder: string;
    createdAt: string;
  }>;
  activityLogs: Array<{
    id: number;
    userEmail: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
    createdAt: string;
  }>;
  users: Array<{
    id: number;
    email: string;
    displayName: string;
    roleId: number | null;
    isActive: boolean;
    lastLoginAt: string;
  }>;
  roles: Array<{ id: number; slug: string; name: string }>;
}

export const AdminDashboard: React.FC = () => {
  const {
    firebaseUser,
    dbUser,
    authToken,
    authLoading,
    authError,
    signInWithGoogle,
    signOut,
    navigate,
    refreshBootstrap,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AdminOverviewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected entity editors
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [pageFormEn, setPageFormEn] = useState<Record<string, string>>({});
  const [pageFormAr, setPageFormAr] = useState<Record<string, string>>({});

  const [editingProductId, setEditingProductId] = useState<number | 'new' | null>(null);
  const [productForm, setProductForm] = useState({
    sku: '',
    slug: '',
    categoryId: '',
    partnerId: '',
    imageUrl: '/images/product-pump.jpg',
    datasheetUrl: '',
    nameEn: '',
    summaryEn: '',
    descriptionEn: '',
    nameAr: '',
    summaryAr: '',
    descriptionAr: '',
    isFeatured: true,
  });

  const [editingPartnerId, setEditingPartnerId] = useState<number | 'new' | null>(null);
  const [partnerForm, setPartnerForm] = useState({
    slug: '',
    name: '',
    logoUrl: '',
    websiteUrl: '',
    country: '',
    categoryLabelEn: '',
    categoryLabelAr: '',
    displayNameEn: '',
    taglineEn: '',
    descriptionEn: '',
    displayNameAr: '',
    taglineAr: '',
    descriptionAr: '',
  });

  const [editingBlogId, setEditingBlogId] = useState<number | 'new' | null>(null);
  const [blogForm, setBlogForm] = useState({
    slug: '',
    categoryEn: 'Corporate News',
    categoryAr: 'أخبار الشركة',
    coverImageUrl: '/images/facility-pump-room.jpg',
    readTimeMinutes: 4,
    titleEn: '',
    titleAr: '',
    excerptEn: '',
    excerptAr: '',
    contentEn: '',
    contentAr: '',
  });

  const [seoForm, setSeoForm] = useState({
    routeKey: 'home',
    locale: 'en' as 'en' | 'ar',
    metaTitle: '',
    metaDescription: '',
    canonicalPath: '/',
    keywords: '',
  });

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  const notify = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 5000);
  };

  const fetchOverview = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to load CMS data');
      }
      const payload: AdminOverviewPayload = await res.json();
      setData(payload);
      if (payload.settings) setSettingsForm(payload.settings);
      if (payload.pages.length > 0 && !selectedPageId) {
        const first = payload.pages[0];
        setSelectedPageId(first.id);
        setPageFormEn({
          title: first.en?.title || '',
          heroHeading: first.en?.heroHeading || '',
          heroSubheading: first.en?.heroSubheading || '',
          heroCtaText: first.en?.heroCtaText || '',
          heroCtaUrl: first.en?.heroCtaUrl || '/quote',
          introBannerText: first.en?.introBannerText || '',
          introBannerCtaText: first.en?.introBannerCtaText || '',
          bodyContent: first.en?.bodyContent || '',
        });
        setPageFormAr({
          title: first.ar?.title || '',
          heroHeading: first.ar?.heroHeading || '',
          heroSubheading: first.ar?.heroSubheading || '',
          heroCtaText: first.ar?.heroCtaText || '',
          heroCtaUrl: first.ar?.heroCtaUrl || '/quote',
          introBannerText: first.ar?.introBannerText || '',
          introBannerCtaText: first.ar?.introBannerCtaText || '',
          bodyContent: first.ar?.bodyContent || '',
        });
      }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to load CMS overview');
    } finally {
      setLoading(false);
    }
  }, [authToken, selectedPageId]);

  useEffect(() => {
    if (authToken && dbUser && dbUser.roleSlug !== 'viewer') {
      fetchOverview();
    }
  }, [authToken, dbUser, fetchOverview]);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${authToken}`,
      },
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || 'Request failed');
    await refreshBootstrap();
    return payload;
  };

  // Unauthenticated Gate
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Verifying administrator session...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 space-y-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#133D68]/10 text-[#133D68] flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#133D68]">PARK Admin CMS Portal</h1>
            <p className="text-sm text-slate-600">
              Sign in with your authorized Google administrator account to manage bilingual pages, products, partners, SEO, and incoming quotation requests.
            </p>
          </div>
          {authError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
              {authError}
            </div>
          )}
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full py-3 px-5 bg-[#133D68] hover:bg-[#0C2B4B] text-white text-sm font-semibold rounded-md transition-colors"
          >
            Sign in with Google
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-[#133D68]"
          >
            ← Return to Public Website
          </button>
        </div>
      </div>
    );
  }

  // Authenticated but viewer role (RBAC protection)
  if (dbUser && dbUser.roleSlug === 'viewer') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 space-y-5 text-center">
          <h1 className="text-xl font-bold text-slate-900">Administrator Role Required</h1>
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-semibold">{dbUser.email}</span>. Your account currently has the <span className="font-mono-tabular">viewer</span> role. Ask a Super Administrator to promote your account under Users & Roles.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={signOut}
              className="px-4 py-2 border border-slate-300 text-sm rounded-md"
            >
              Sign Out
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#133D68] text-white text-sm rounded-md"
            >
              Public Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'leads', label: 'Quotes & Messages', icon: Inbox },
    { id: 'products', label: 'Products & Categories', icon: Package },
    { id: 'partners', label: 'Partners & Logos', icon: Globe },
    { id: 'pages', label: 'Pages (EN / AR)', icon: FileText },
    { id: 'projects', label: 'Projects & Services', icon: FolderKanban },
    { id: 'news', label: 'News & Insights', icon: Activity },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'seo', label: 'SEO & Menus', icon: Globe },
    { id: 'settings', label: 'Site Settings', icon: Settings },
    { id: 'users', label: 'Users & Audit Logs', icon: Users },
  ];

  const handleSavePageTranslations = async () => {
    if (!selectedPageId) return;
    try {
      await authFetch(`/api/admin/pages/${selectedPageId}/translations/en`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageFormEn),
      });
      await authFetch(`/api/admin/pages/${selectedPageId}/translations/ar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageFormAr),
      });
      notify('success', 'Saved English & Arabic page content to Cloud SQL PostgreSQL.');
      await fetchOverview();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      sku: productForm.sku,
      slug: productForm.slug,
      categoryId: productForm.categoryId ? Number(productForm.categoryId) : null,
      partnerId: productForm.partnerId ? Number(productForm.partnerId) : null,
      imageUrl: productForm.imageUrl,
      datasheetUrl: productForm.datasheetUrl,
      division: 'pumps',
      isFeatured: productForm.isFeatured,
      isPublished: true,
      sortOrder: 0,
      en: {
        name: productForm.nameEn,
        summary: productForm.summaryEn,
        description: productForm.descriptionEn,
        specificationsJson: [],
        applicationsJson: [],
      },
      ar: {
        name: productForm.nameAr,
        summary: productForm.summaryAr,
        description: productForm.descriptionAr,
        specificationsJson: [],
        applicationsJson: [],
      },
    };
    try {
      if (editingProductId === 'new') {
        await authFetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        notify('success', 'Product created.');
      } else if (typeof editingProductId === 'number') {
        await authFetch(`/api/admin/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        notify('success', 'Product updated.');
      }
      setEditingProductId(null);
      await fetchOverview();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      slug: partnerForm.slug,
      name: partnerForm.name,
      logoUrl: partnerForm.logoUrl,
      websiteUrl: partnerForm.websiteUrl,
      country: partnerForm.country,
      categoryLabelEn: partnerForm.categoryLabelEn,
      categoryLabelAr: partnerForm.categoryLabelAr,
      sortOrder: 0,
      isFeatured: true,
      isPublished: true,
      en: {
        displayName: partnerForm.displayNameEn || partnerForm.name,
        tagline: partnerForm.taglineEn,
        description: partnerForm.descriptionEn,
        highlightsJson: [],
      },
      ar: {
        displayName: partnerForm.displayNameAr || partnerForm.name,
        tagline: partnerForm.taglineAr,
        description: partnerForm.descriptionAr,
        highlightsJson: [],
      },
    };
    try {
      if (editingPartnerId === 'new') {
        await authFetch('/api/admin/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        notify('success', 'Partner created.');
      } else if (typeof editingPartnerId === 'number') {
        await authFetch(`/api/admin/partners/${editingPartnerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        notify('success', 'Partner updated.');
      }
      setEditingPartnerId(null);
      await fetchOverview();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to save partner');
    }
  };

  const handleMediaUpload = async (file: File, folder = 'cms') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    try {
      const uploaded = await authFetch('/api/admin/media', { method: 'POST', body: fd });
      notify('success', `Uploaded ${uploaded.filename} -> ${uploaded.url}`);
      await fetchOverview();
      return uploaded.url as string;
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Upload failed');
      return null;
    }
  };

  return (
    <div dir="ltr" className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (260px fixed per SaaS dashboard guidelines) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0B192C] text-slate-200 flex flex-col border-r border-slate-800 transform transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="font-display font-bold text-white text-base tracking-tight">
              PARK CMS
            </span>
            <p className="text-[11px] text-slate-400">United Park Group</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors text-left ${
                  active
                    ? 'bg-[#16487A] text-white font-semibold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="text-xs">
            <p className="font-semibold text-white truncate">{dbUser?.displayName || dbUser?.email}</p>
            <p className="text-slate-400">{dbUser?.roleName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-1.5 px-2.5 text-xs bg-white/10 hover:bg-white/15 rounded text-white"
            >
              View Site
            </button>
            <button
              type="button"
              onClick={signOut}
              className="py-1.5 px-2.5 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-200 rounded inline-flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded border border-slate-200"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-sm text-slate-500">
              <span>CMS</span> /{' '}
              <span className="font-semibold text-slate-900 capitalize">{activeTab}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </header>

        {toast && (
          <div className="mx-6 mt-4">
            <div
              className={`px-4 py-3 rounded-md text-sm font-medium border ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {toast.text}
            </div>
          </div>
        )}

        <main className="flex-1 p-6 space-y-6">
          {!data && loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-white border border-slate-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            data && (
              <>
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Quote Requests', val: data.quoteRequests.length },
                        { label: 'Contact Inquiries', val: data.contactMessages.length },
                        { label: 'Catalog Products', val: data.products.length },
                        { label: 'Global Partners', val: data.partners.length },
                      ].map((kpi) => (
                        <div key={kpi.label} className="bg-white border border-slate-200 rounded-lg p-5">
                          <p className="text-xs text-slate-500">{kpi.label}</p>
                          <p className="text-2xl font-bold text-[#133D68] font-mono-tabular mt-1">
                            {kpi.val}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900">Recent Quote Requests</h2>
                        <button
                          type="button"
                          onClick={() => setActiveTab('leads')}
                          className="text-xs font-semibold text-[#133D68] hover:underline"
                        >
                          Manage All →
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2.5 text-left">ID</th>
                              <th className="px-4 py-2.5 text-left">Company</th>
                              <th className="px-4 py-2.5 text-left">Product / Service</th>
                              <th className="px-4 py-2.5 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {data.quoteRequests.slice(0, 5).map((q) => (
                              <tr key={q.id} className="h-10">
                                <td className="px-4 font-mono-tabular">#{q.id}</td>
                                <td className="px-4 font-medium">{q.companyName}</td>
                                <td className="px-4 text-slate-600">{q.productOrService}</td>
                                <td className="px-4 capitalize text-xs font-semibold text-[#133D68]">
                                  {q.status}
                                </td>
                              </tr>
                            ))}
                            {data.quoteRequests.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-slate-500 text-xs">
                                  No quote requests submitted yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* LEADS TAB (Quotes & Contact Messages) */}
                {activeTab === 'leads' && (
                  <div className="space-y-8">
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-200">
                        <h2 className="text-base font-bold text-slate-900">
                          Quotation Requests ({data.quoteRequests.length})
                        </h2>
                      </div>
                      <div className="divide-y divide-slate-200">
                        {data.quoteRequests.map((q) => (
                          <div key={q.id} className="p-5 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-mono-tabular text-xs text-slate-400">#{q.id}</span>{' '}
                                <span className="font-bold text-slate-900">{q.companyName}</span> —{' '}
                                <span className="text-sm text-slate-600">{q.fullName}</span>
                              </div>
                              <select
                                value={q.status}
                                onChange={async (e) => {
                                  await authFetch(`/api/admin/quotes/${q.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: e.target.value, adminNotes: q.adminNotes || '' }),
                                  });
                                  notify('success', `Quote #${q.id} marked ${e.target.value}`);
                                  fetchOverview();
                                }}
                                className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                              >
                                <option value="new">New</option>
                                <option value="in_review">In Review</option>
                                <option value="quoted">Quoted</option>
                                <option value="archived">Archived</option>
                              </select>
                            </div>
                            <p className="text-xs text-slate-600">
                              Email: {q.businessEmail} · Phone: {q.phone} · Preferred: {q.preferredContactMethod} · Product: <strong>{q.productOrService}</strong> ({q.estimatedQuantity || 'Qty unspecified'})
                            </p>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
                              {q.projectDescription}
                            </p>
                            {q.attachmentAssetId && (
                              <a
                                href={`/api/media/${q.attachmentAssetId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-xs font-semibold text-[#133D68] hover:underline"
                              >
                                Download Attachment: {q.attachmentName}
                              </a>
                            )}
                          </div>
                        ))}
                        {data.quoteRequests.length === 0 && (
                          <p className="p-6 text-sm text-slate-500">No quote requests yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-200">
                        <h2 className="text-base font-bold text-slate-900">
                          Contact Submissions ({data.contactMessages.length})
                        </h2>
                      </div>
                      <div className="divide-y divide-slate-200">
                        {data.contactMessages.map((m) => (
                          <div key={m.id} className="p-5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-900">
                                {m.subject} — {m.fullName} ({m.email})
                              </span>
                              <select
                                value={m.status}
                                onChange={async (e) => {
                                  await authFetch(`/api/admin/contacts/${m.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: e.target.value, adminNotes: m.adminNotes || '' }),
                                  });
                                  notify('success', `Message #${m.id} updated`);
                                  fetchOverview();
                                }}
                                className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                              >
                                <option value="new">New</option>
                                <option value="responded">Responded</option>
                                <option value="archived">Archived</option>
                              </select>
                            </div>
                            <p className="text-sm text-slate-700">{m.message}</p>
                          </div>
                        ))}
                        {data.contactMessages.length === 0 && (
                          <p className="p-6 text-sm text-slate-500">No contact inquiries yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900">Products Catalog</h2>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProductId('new');
                          setProductForm({
                            sku: '',
                            slug: '',
                            categoryId: String(data.categories[0]?.id || ''),
                            partnerId: String(data.partners[0]?.id || ''),
                            imageUrl: '/images/product-pump.jpg',
                            datasheetUrl: '',
                            nameEn: '',
                            summaryEn: '',
                            descriptionEn: '',
                            nameAr: '',
                            summaryAr: '',
                            descriptionAr: '',
                            isFeatured: true,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-md"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                      </button>
                    </div>

                    {editingProductId !== null && (
                      <form
                        onSubmit={handleSaveProduct}
                        className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-900">
                            {editingProductId === 'new' ? 'Create Product' : 'Edit Product'}
                          </h3>
                          <button type="button" onClick={() => setEditingProductId(null)} className="text-xs text-slate-500">
                            Cancel
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            required
                            placeholder="SKU (e.g. PRK-100)"
                            value={productForm.sku}
                            onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <input
                            required
                            placeholder="Slug (e.g. booster-100)"
                            value={productForm.slug}
                            onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <input
                            placeholder="Image URL"
                            value={productForm.imageUrl}
                            onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <select
                            value={productForm.categoryId}
                            onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                          >
                            <option value="">Select Category</option>
                            {data.categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nameEn}
                              </option>
                            ))}
                          </select>
                          <select
                            value={productForm.partnerId}
                            onChange={(e) => setProductForm({ ...productForm, partnerId: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                          >
                            <option value="">Select Partner</option>
                            {data.partners.map((pt) => (
                              <option key={pt.id} value={pt.id}>
                                {pt.name}
                              </option>
                            ))}
                          </select>
                          <input
                            placeholder="Datasheet URL (optional)"
                            value={productForm.datasheetUrl}
                            onChange={(e) => setProductForm({ ...productForm, datasheetUrl: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3 p-4 bg-slate-50 rounded border border-slate-200">
                            <p className="text-xs font-bold text-slate-700">English Content</p>
                            <input
                              required
                              placeholder="English Product Name"
                              value={productForm.nameEn}
                              onChange={(e) => setProductForm({ ...productForm, nameEn: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                            />
                            <input
                              required
                              placeholder="English Summary"
                              value={productForm.summaryEn}
                              onChange={(e) => setProductForm({ ...productForm, summaryEn: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                            />
                            <textarea
                              rows={3}
                              placeholder="English Full Description"
                              value={productForm.descriptionEn}
                              onChange={(e) => setProductForm({ ...productForm, descriptionEn: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                            />
                          </div>
                          <div dir="rtl" className="space-y-3 p-4 bg-slate-50 rounded border border-slate-200">
                            <p className="text-xs font-bold text-slate-700">المحتوى العربي</p>
                            <input
                              required
                              placeholder="اسم المنتج بالعربية"
                              value={productForm.nameAr}
                              onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                            />
                            <input
                              required
                              placeholder="ملخص قصير"
                              value={productForm.summaryAr}
                              onChange={(e) => setProductForm({ ...productForm, summaryAr: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                            />
                            <textarea
                              rows={3}
                              placeholder="الوصف الكامل بالعربية"
                              value={productForm.descriptionAr}
                              onChange={(e) => setProductForm({ ...productForm, descriptionAr: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-[#133D68] text-white text-xs font-semibold rounded-md"
                        >
                          Save Product
                        </button>
                      </form>
                    )}

                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5 text-left">SKU</th>
                            <th className="px-4 py-2.5 text-left">English Name</th>
                            <th className="px-4 py-2.5 text-left">Arabic Name</th>
                            <th className="px-4 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.products.map((pr) => (
                            <tr key={pr.id} className="h-11">
                              <td className="px-4 font-mono-tabular text-xs">{pr.sku}</td>
                              <td className="px-4 font-medium">{pr.en?.name}</td>
                              <td className="px-4 text-slate-600">{pr.ar?.name}</td>
                              <td className="px-4 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProductId(pr.id);
                                    setProductForm({
                                      sku: pr.sku,
                                      slug: pr.slug,
                                      categoryId: pr.categoryId ? String(pr.categoryId) : '',
                                      partnerId: pr.partnerId ? String(pr.partnerId) : '',
                                      imageUrl: pr.imageUrl || '/images/product-pump.jpg',
                                      datasheetUrl: pr.datasheetUrl || '',
                                      nameEn: pr.en?.name || '',
                                      summaryEn: pr.en?.summary || '',
                                      descriptionEn: pr.en?.description || '',
                                      nameAr: pr.ar?.name || '',
                                      summaryAr: pr.ar?.summary || '',
                                      descriptionAr: pr.ar?.description || '',
                                      isFeatured: pr.isFeatured,
                                    });
                                  }}
                                  className="text-xs font-semibold text-[#133D68] hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!window.confirm(`Delete product ${pr.sku}?`)) return;
                                    await authFetch(`/api/admin/products/${pr.id}`, { method: 'DELETE' });
                                    notify('success', 'Product deleted');
                                    fetchOverview();
                                  }}
                                  className="text-xs text-red-600 hover:underline inline-flex items-center gap-0.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* PARTNERS TAB */}
                {activeTab === 'partners' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900">Partners & Manufacturer Logos</h2>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPartnerId('new');
                          setPartnerForm({
                            slug: '',
                            name: '',
                            logoUrl: '',
                            websiteUrl: '',
                            country: '',
                            categoryLabelEn: '',
                            categoryLabelAr: '',
                            displayNameEn: '',
                            taglineEn: '',
                            descriptionEn: '',
                            displayNameAr: '',
                            taglineAr: '',
                            descriptionAr: '',
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-md"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Partner</span>
                      </button>
                    </div>

                    {editingPartnerId !== null && (
                      <form onSubmit={handleSavePartner} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            required
                            placeholder="Slug (e.g. grundfos)"
                            value={partnerForm.slug}
                            onChange={(e) => setPartnerForm({ ...partnerForm, slug: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <input
                            required
                            placeholder="Brand Name"
                            value={partnerForm.name}
                            onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <input
                            placeholder="Country"
                            value={partnerForm.country}
                            onChange={(e) => setPartnerForm({ ...partnerForm, country: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <input
                            placeholder="Official Website URL"
                            value={partnerForm.websiteUrl}
                            onChange={(e) => setPartnerForm({ ...partnerForm, websiteUrl: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <div className="md:col-span-2 flex items-center gap-3">
                            <input
                              placeholder="Logo URL (upload or paste)"
                              value={partnerForm.logoUrl}
                              onChange={(e) => setPartnerForm({ ...partnerForm, logoUrl: e.target.value })}
                              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded"
                            />
                            <label className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded cursor-pointer hover:bg-slate-50 inline-flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Logo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  const url = await handleMediaUpload(f, 'partners');
                                  if (url) setPartnerForm((prev) => ({ ...prev, logoUrl: url }));
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 p-4 bg-slate-50 rounded border border-slate-200">
                            <p className="text-xs font-bold">English Profile</p>
                            <input
                              placeholder="Display Name (EN)"
                              value={partnerForm.displayNameEn}
                              onChange={(e) => setPartnerForm({ ...partnerForm, displayNameEn: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                            />
                            <textarea
                              rows={3}
                              required
                              placeholder="Description (EN)"
                              value={partnerForm.descriptionEn}
                              onChange={(e) => setPartnerForm({ ...partnerForm, descriptionEn: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                            />
                          </div>
                          <div dir="rtl" className="space-y-2 p-4 bg-slate-50 rounded border border-slate-200">
                            <p className="text-xs font-bold">الملف بالعربية</p>
                            <input
                              placeholder="الاسم بالعربية"
                              value={partnerForm.displayNameAr}
                              onChange={(e) => setPartnerForm({ ...partnerForm, displayNameAr: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                            />
                            <textarea
                              rows={3}
                              required
                              placeholder="الوصف بالعربية"
                              value={partnerForm.descriptionAr}
                              onChange={(e) => setPartnerForm({ ...partnerForm, descriptionAr: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button type="submit" className="px-5 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-md">
                            Save Partner
                          </button>
                          <button type="button" onClick={() => setEditingPartnerId(null)} className="px-4 py-2 text-xs text-slate-600">
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                      {data.partners.map((pt) => (
                        <div key={pt.id} className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-sm text-slate-900">{pt.name}</p>
                            <p className="text-xs text-slate-500">{pt.country} · {pt.websiteUrl}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPartnerId(pt.id);
                                setPartnerForm({
                                  slug: pt.slug,
                                  name: pt.name,
                                  logoUrl: pt.logoUrl || '',
                                  websiteUrl: pt.websiteUrl || '',
                                  country: pt.country || '',
                                  categoryLabelEn: pt.categoryLabelEn || '',
                                  categoryLabelAr: pt.categoryLabelAr || '',
                                  displayNameEn: pt.en?.displayName || pt.name,
                                  taglineEn: pt.en?.tagline || '',
                                  descriptionEn: pt.en?.description || '',
                                  displayNameAr: pt.ar?.displayName || pt.name,
                                  taglineAr: pt.ar?.tagline || '',
                                  descriptionAr: pt.ar?.description || '',
                                });
                              }}
                              className="text-xs font-semibold text-[#133D68] hover:underline"
                            >
                              Edit / Logo
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!window.confirm(`Delete partner ${pt.name}?`)) return;
                                await authFetch(`/api/admin/partners/${pt.id}`, { method: 'DELETE' });
                                notify('success', 'Partner deleted');
                                fetchOverview();
                              }}
                              className="text-xs text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAGES (EN / AR) TAB */}
                {activeTab === 'pages' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <select
                        value={selectedPageId || ''}
                        onChange={(e) => {
                          const p = data.pages.find((pg) => pg.id === Number(e.target.value));
                          if (!p) return;
                          setSelectedPageId(p.id);
                          setPageFormEn({
                            title: p.en?.title || '',
                            heroHeading: p.en?.heroHeading || '',
                            heroSubheading: p.en?.heroSubheading || '',
                            heroCtaText: p.en?.heroCtaText || '',
                            heroCtaUrl: p.en?.heroCtaUrl || '/quote',
                            introBannerText: p.en?.introBannerText || '',
                            introBannerCtaText: p.en?.introBannerCtaText || '',
                            bodyContent: p.en?.bodyContent || '',
                          });
                          setPageFormAr({
                            title: p.ar?.title || '',
                            heroHeading: p.ar?.heroHeading || '',
                            heroSubheading: p.ar?.heroSubheading || '',
                            heroCtaText: p.ar?.heroCtaText || '',
                            heroCtaUrl: p.ar?.heroCtaUrl || '/quote',
                            introBannerText: p.ar?.introBannerText || '',
                            introBannerCtaText: p.ar?.introBannerCtaText || '',
                            bodyContent: p.ar?.bodyContent || '',
                          });
                        }}
                        className="px-4 py-2 text-sm border border-slate-300 rounded-md bg-white font-semibold"
                      >
                        {data.pages.map((p) => (
                          <option key={p.id} value={p.id}>
                            Page: {p.slug}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleSavePageTranslations}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#133D68] text-white text-xs font-semibold rounded-md"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Bilingual Page</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                        <h3 className="font-bold text-sm text-[#133D68]">English Version</h3>
                        <input
                          placeholder="Title"
                          value={pageFormEn.title || ''}
                          onChange={(e) => setPageFormEn({ ...pageFormEn, title: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <input
                          placeholder="Hero Heading"
                          value={pageFormEn.heroHeading || ''}
                          onChange={(e) => setPageFormEn({ ...pageFormEn, heroHeading: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <textarea
                          rows={2}
                          placeholder="Hero Subheading"
                          value={pageFormEn.heroSubheading || ''}
                          onChange={(e) => setPageFormEn({ ...pageFormEn, heroSubheading: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <input
                          placeholder="Intro Banner Text"
                          value={pageFormEn.introBannerText || ''}
                          onChange={(e) => setPageFormEn({ ...pageFormEn, introBannerText: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <textarea
                          rows={5}
                          placeholder="Body Content"
                          value={pageFormEn.bodyContent || ''}
                          onChange={(e) => setPageFormEn({ ...pageFormEn, bodyContent: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                      </div>

                      <div dir="rtl" className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                        <h3 className="font-bold text-sm text-[#133D68]">النسخة العربية</h3>
                        <input
                          placeholder="العنوان"
                          value={pageFormAr.title || ''}
                          onChange={(e) => setPageFormAr({ ...pageFormAr, title: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <input
                          placeholder="العنوان الرئيسي"
                          value={pageFormAr.heroHeading || ''}
                          onChange={(e) => setPageFormAr({ ...pageFormAr, heroHeading: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <textarea
                          rows={2}
                          placeholder="الوصف الرئيسي"
                          value={pageFormAr.heroSubheading || ''}
                          onChange={(e) => setPageFormAr({ ...pageFormAr, heroSubheading: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <input
                          placeholder="نص الشريط التعريفي"
                          value={pageFormAr.introBannerText || ''}
                          onChange={(e) => setPageFormAr({ ...pageFormAr, introBannerText: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <textarea
                          rows={5}
                          placeholder="المحتوى التفصيلي"
                          value={pageFormAr.bodyContent || ''}
                          onChange={(e) => setPageFormAr({ ...pageFormAr, bodyContent: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PROJECTS & SERVICES TAB */}
                {activeTab === 'projects' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                      <h2 className="font-bold text-base text-slate-900">Reference Projects ({data.projects.length})</h2>
                      <div className="divide-y divide-slate-100">
                        {data.projects.map((prj) => (
                          <div key={prj.id} className="py-3 flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-sm text-slate-900">{prj.en?.title}</p>
                              <p className="text-xs text-slate-500">{prj.category} · {prj.locationEn}</p>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!window.confirm(`Delete project ${prj.slug}?`)) return;
                                await authFetch(`/api/admin/projects/${prj.id}`, { method: 'DELETE' });
                                notify('success', 'Project deleted');
                                fetchOverview();
                              }}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                      <h2 className="font-bold text-base text-slate-900">Core Engineering Services ({data.services.length})</h2>
                      <div className="divide-y divide-slate-100">
                        {data.services.map((srv) => (
                          <div key={srv.id} className="py-3 flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-sm text-slate-900">{srv.en?.title} / {srv.ar?.title}</p>
                              <p className="text-xs text-slate-500">{srv.en?.shortDescription}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* NEWS TAB */}
                {activeTab === 'news' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900">News & Insights Articles</h2>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBlogId('new');
                          setBlogForm({
                            slug: '',
                            categoryEn: 'Corporate News',
                            categoryAr: 'أخبار الشركة',
                            coverImageUrl: '/images/facility-pump-room.jpg',
                            readTimeMinutes: 4,
                            titleEn: '',
                            titleAr: '',
                            excerptEn: '',
                            excerptAr: '',
                            contentEn: '',
                            contentAr: '',
                          });
                        }}
                        className="px-4 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-md"
                      >
                        + Publish Article
                      </button>
                    </div>

                    {editingBlogId !== null && (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const method = editingBlogId === 'new' ? 'POST' : 'PUT';
                          const url =
                            editingBlogId === 'new'
                              ? '/api/admin/blog'
                              : `/api/admin/blog/${editingBlogId}`;
                          await authFetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...blogForm, isPublished: true }),
                          });
                          notify('success', 'Article saved.');
                          setEditingBlogId(null);
                          fetchOverview();
                        }}
                        className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            required
                            placeholder="Slug"
                            value={blogForm.slug}
                            onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <input
                            required
                            placeholder="Title (EN)"
                            value={blogForm.titleEn}
                            onChange={(e) => setBlogForm({ ...blogForm, titleEn: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <input
                            required
                            dir="rtl"
                            placeholder="العنوان (AR)"
                            value={blogForm.titleAr}
                            onChange={(e) => setBlogForm({ ...blogForm, titleAr: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <textarea
                            required
                            rows={2}
                            placeholder="Excerpt (EN)"
                            value={blogForm.excerptEn}
                            onChange={(e) => setBlogForm({ ...blogForm, excerptEn: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <textarea
                            required
                            dir="rtl"
                            rows={2}
                            placeholder="المقتطف (AR)"
                            value={blogForm.excerptAr}
                            onChange={(e) => setBlogForm({ ...blogForm, excerptAr: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <textarea
                            required
                            rows={4}
                            placeholder="Article Content (EN)"
                            value={blogForm.contentEn}
                            onChange={(e) => setBlogForm({ ...blogForm, contentEn: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <textarea
                            required
                            dir="rtl"
                            rows={4}
                            placeholder="محتوى المقال (AR)"
                            value={blogForm.contentAr}
                            onChange={(e) => setBlogForm({ ...blogForm, contentAr: e.target.value })}
                            className="px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button type="submit" className="px-5 py-2 bg-[#133D68] text-white text-xs font-semibold rounded">
                            Save Article
                          </button>
                          <button type="button" onClick={() => setEditingBlogId(null)} className="text-xs text-slate-600">
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                      {data.blogPosts.map((b) => (
                        <div key={b.id} className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-sm text-slate-900">{b.titleEn}</p>
                            <p className="text-xs text-slate-500">{b.titleAr}</p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm('Delete this article?')) return;
                              await authFetch(`/api/admin/blog/${b.id}`, { method: 'DELETE' });
                              notify('success', 'Article deleted');
                              fetchOverview();
                            }}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MEDIA LIBRARY TAB */}
                {activeTab === 'media' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h2 className="font-bold text-base text-slate-900">Upload Media Asset</h2>
                        <p className="text-xs text-slate-500">
                          Upload PNG, JPG, WEBP, SVG logos, or PDF technical datasheets directly into Cloud SQL media storage.
                        </p>
                      </div>
                      <label className="px-5 py-2.5 bg-[#133D68] text-white text-xs font-semibold rounded-md cursor-pointer inline-flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>Select File to Upload</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleMediaUpload(f, 'library');
                          }}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.mediaAssets.map((m) => (
                        <div key={m.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                          <p className="font-semibold text-sm text-slate-900 truncate">{m.filename}</p>
                          <p className="text-xs text-slate-500 font-mono-tabular">
                            {m.mimeType} · {(m.sizeBytes / 1024).toFixed(1)} KB
                          </p>
                          <input
                            readOnly
                            value={m.url}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-slate-50 border border-slate-200 rounded"
                          />
                        </div>
                      ))}
                      {data.mediaAssets.length === 0 && (
                        <p className="text-sm text-slate-500">No uploaded files yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* SEO & MENUS TAB */}
                {activeTab === 'seo' && (
                  <div className="space-y-6">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await authFetch('/api/admin/seo', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(seoForm),
                        });
                        notify('success', 'SEO metadata saved.');
                        fetchOverview();
                      }}
                      className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
                    >
                      <h2 className="font-bold text-base text-slate-900">Bilingual SEO Metadata Editor</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input
                          required
                          placeholder="Route Key (home, products, partners)"
                          value={seoForm.routeKey}
                          onChange={(e) => setSeoForm({ ...seoForm, routeKey: e.target.value })}
                          className="px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <select
                          value={seoForm.locale}
                          onChange={(e) => setSeoForm({ ...seoForm, locale: e.target.value as 'en' | 'ar' })}
                          className="px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                        >
                          <option value="en">English (en)</option>
                          <option value="ar">Arabic (ar)</option>
                        </select>
                        <input
                          required
                          placeholder="Canonical Path (/ or /ar)"
                          value={seoForm.canonicalPath}
                          onChange={(e) => setSeoForm({ ...seoForm, canonicalPath: e.target.value })}
                          className="px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                      </div>
                      <input
                        required
                        placeholder="Meta Title (30-60 chars)"
                        value={seoForm.metaTitle}
                        onChange={(e) => setSeoForm({ ...seoForm, metaTitle: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                      />
                      <textarea
                        required
                        rows={2}
                        placeholder="Meta Description (120-160 chars)"
                        value={seoForm.metaDescription}
                        onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                      />
                      <button type="submit" className="px-5 py-2 bg-[#133D68] text-white text-xs font-semibold rounded">
                        Save SEO Entry
                      </button>
                    </form>

                    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                      <h3 className="font-bold text-sm text-slate-900">Configured SEO Entries</h3>
                      <div className="divide-y divide-slate-100">
                        {data.seoMetadata.map((s) => (
                          <div key={s.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                            <div>
                              <span className="font-mono-tabular font-bold uppercase text-[#133D68]">
                                {s.routeKey} ({s.locale})
                              </span>
                              <p className="text-slate-700 mt-0.5">{s.metaTitle}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSeoForm({
                                  routeKey: s.routeKey,
                                  locale: s.locale,
                                  metaTitle: s.metaTitle,
                                  metaDescription: s.metaDescription,
                                  canonicalPath: s.canonicalPath,
                                  keywords: s.keywords || '',
                                })
                              }
                              className="text-[#133D68] font-semibold hover:underline"
                            >
                              Load
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await authFetch('/api/admin/settings', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(settingsForm),
                        });
                        notify('success', 'Corporate settings updated.');
                        fetchOverview();
                      }}
                      className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
                    >
                      <h2 className="font-bold text-base text-slate-900">Corporate Website Settings</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          value={settingsForm.companyNameEn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, companyNameEn: e.target.value })}
                          placeholder="Company Name (EN)"
                          className="px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <input
                          dir="rtl"
                          value={settingsForm.companyNameAr || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, companyNameAr: e.target.value })}
                          placeholder="اسم الشركة (AR)"
                          className="px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <input
                          value={settingsForm.phone || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                          placeholder="Phone"
                          className="px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <input
                          value={settingsForm.email || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                          placeholder="Email"
                          className="px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <input
                          value={settingsForm.addressEn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, addressEn: e.target.value })}
                          placeholder="Address (EN)"
                          className="px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                        <input
                          dir="rtl"
                          value={settingsForm.addressAr || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, addressAr: e.target.value })}
                          placeholder="العنوان (AR)"
                          className="px-3 py-2 text-sm border border-slate-300 rounded"
                        />
                      </div>
                      <button type="submit" className="px-5 py-2.5 bg-[#133D68] text-white text-xs font-semibold rounded">
                        Save Settings
                      </button>
                    </form>

                    {/* Social Links */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
                      <h3 className="font-bold text-sm text-slate-900">Social Media Links</h3>
                      <div className="divide-y divide-slate-100">
                        {data.socialLinks.map((soc) => (
                          <div key={soc.id} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                            <span className="font-semibold w-28">{soc.label}</span>
                            <input
                              defaultValue={soc.url}
                              onBlur={async (e) => {
                                if (e.target.value === soc.url) return;
                                await authFetch(`/api/admin/social-links/${soc.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ url: e.target.value, isVisible: soc.isVisible }),
                                });
                                notify('success', `Updated ${soc.label} URL`);
                              }}
                              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* USERS & AUDIT LOGS TAB */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-200">
                        <h2 className="font-bold text-base text-slate-900">Administrator Accounts & Roles</h2>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5 text-left">User</th>
                            <th className="px-4 py-2.5 text-left">Email</th>
                            <th className="px-4 py-2.5 text-left">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.users.map((u) => (
                            <tr key={u.id} className="h-11">
                              <td className="px-4 font-medium">{u.displayName}</td>
                              <td className="px-4 text-slate-600">{u.email}</td>
                              <td className="px-4">
                                <select
                                  value={u.roleId || ''}
                                  disabled={u.id === dbUser?.id}
                                  onChange={async (e) => {
                                    await authFetch(`/api/admin/users/${u.id}/role`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ roleId: Number(e.target.value), isActive: u.isActive }),
                                    });
                                    notify('success', `Updated role for ${u.email}`);
                                    fetchOverview();
                                  }}
                                  className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                                >
                                  {data.roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-200">
                        <h2 className="font-bold text-base text-slate-900">Activity Audit Logs</h2>
                      </div>
                      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                        {data.activityLogs.map((log) => (
                          <div key={log.id} className="px-5 py-2.5 text-xs flex items-center justify-between gap-4">
                            <div>
                              <span className="font-mono-tabular font-bold text-[#133D68]">{log.action}</span>{' '}
                              <span className="text-slate-600">[{log.entityType}]</span> —{' '}
                              <span className="text-slate-900">{log.details}</span>
                            </div>
                            <span className="text-slate-400 font-mono-tabular shrink-0">
                              {log.userEmail}
                            </span>
                          </div>
                        ))}
                        {data.activityLogs.length === 0 && (
                          <p className="p-5 text-xs text-slate-500">No audit entries recorded yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )
          )}
        </main>
      </div>
    </div>
  );
};

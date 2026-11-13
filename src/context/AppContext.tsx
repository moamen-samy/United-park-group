import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { DbUser, Locale, PublicBootstrapData } from '../types/cms';

interface AppContextValue {
  locale: Locale;
  isRtl: boolean;
  setLocale: (loc: Locale) => void;
  toggleLocale: () => void;
  currentPath: string;
  navigate: (to: string) => void;
  bootstrap: PublicBootstrapData | null;
  loading: boolean;
  error: string | null;
  refreshBootstrap: () => Promise<void>;
  firebaseUser: User | null;
  dbUser: DbUser | null;
  authToken: string | null;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  preselectedProduct: string;
  setPreselectedProduct: (val: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const params = new URLSearchParams(window.location.search);
  const qLang = params.get('lang');
  if (qLang === 'ar' || qLang === 'en') return qLang;
  if (window.location.pathname.startsWith('/ar')) return 'ar';
  const stored = window.sessionStorage.getItem('park_locale');
  return stored === 'ar' ? 'ar' : 'en';
}

function normalizePath(rawPath: string): string {
  const clean = rawPath.split('?')[0].split('#')[0];
  if (clean === '/ar') return '/';
  if (clean.startsWith('/ar/')) return clean.slice(3);
  return clean || '/';
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' ? normalizePath(window.location.pathname) : '/'
  );
  const [bootstrap, setBootstrap] = useState<PublicBootstrapData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [preselectedProduct, setPreselectedProduct] = useState<string>('');

  const isRtl = locale === 'ar';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    window.sessionStorage.setItem('park_locale', locale);
  }, [locale, isRtl]);

  const fetchBootstrap = useCallback(async (targetLocale: Locale) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/bootstrap?lang=${targetLocale}`);
      if (!res.ok) {
        throw new Error('Unable to load corporate data from server.');
      }
      const data: PublicBootstrapData = await res.json();
      setBootstrap(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error loading website data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrap(locale);
  }, [locale, fetchBootstrap]);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
      const params = new URLSearchParams(window.location.search);
      const qLang = params.get('lang');
      if (qLang === 'ar' || qLang === 'en') {
        setLocaleState(qLang);
      } else if (window.location.pathname.startsWith('/ar')) {
        setLocaleState('ar');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setAuthToken(null);
        setDbUser(null);
        setAuthLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        setAuthToken(token);
        const meRes = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const payload = await meRes.json();
          setDbUser(payload.user || null);
          setAuthError(null);
        } else {
          const errPayload = await meRes.json().catch(() => ({}));
          setAuthError(errPayload.error || 'Unable to verify administrator profile.');
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        setAuthError('Failed to verify session.');
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const navigate = useCallback(
    (to: string) => {
      const [rawPath, hashPart] = to.split('#');
      const clean = normalizePath(rawPath);
      const targetUrl = locale === 'ar' && clean !== '/admin'
        ? `${clean === '/' ? '/ar' : `/ar${clean}`}${hashPart ? `#${hashPart}` : ''}`
        : `${clean}${hashPart ? `#${hashPart}` : ''}`;

      window.history.pushState({}, '', targetUrl);
      setCurrentPath(clean);

      if (hashPart) {
        setTimeout(() => {
          document.getElementById(hashPart)?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [locale]
  );

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      const clean = normalizePath(window.location.pathname);
      const targetUrl =
        nextLocale === 'ar' && clean !== '/admin'
          ? clean === '/'
            ? '/ar'
            : `/ar${clean}`
          : clean;
      window.history.replaceState({}, '', targetUrl);
    },
    []
  );

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  }, [locale, setLocale]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const token = await cred.user.getIdToken();
      setAuthToken(token);
      const meRes = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const payload = await meRes.json();
        setDbUser(payload.user || null);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      setAuthToken(token);
      const meRes = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const payload = await meRes.json();
        setDbUser(payload.user || null);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Email sign-in failed.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    setAuthError(null);
    await sendPasswordResetEmail(auth, email);
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
    setFirebaseUser(null);
    setAuthToken(null);
    setDbUser(null);
  }, []);

  // Enforce DB Redirects on navigation
  useEffect(() => {
    if (!bootstrap?.redirects?.length) return;
    if (currentPath.startsWith('/admin')) return;
    const matchedRedirect = bootstrap.redirects.find(
      (r) => r.isActive && r.fromPath === currentPath
    );
    if (matchedRedirect && matchedRedirect.toPath && matchedRedirect.toPath !== currentPath) {
      fetch(`/api/public/redirects/${matchedRedirect.id}/hit`, { method: 'POST' }).catch(() => {});
      navigate(matchedRedirect.toPath);
    }
  }, [bootstrap, currentPath, navigate]);

  // Dynamic Document Title, Meta, Canonical, hreflang, Robots & JSON-LD
  useEffect(() => {
    if (!bootstrap) return;
    const routeKey =
      currentPath === '/'
        ? 'home'
        : currentPath.startsWith('/products')
          ? 'products'
          : currentPath.startsWith('/partners')
            ? 'partners'
            : currentPath.replace(/^\//, '').split('/')[0] || 'home';

    const matchedSeo = bootstrap.seo.find((s) => s.routeKey === routeKey);
    const defaultTitle =
      locale === 'ar'
        ? 'مجموعة بارك المتحدة (PARK) – مضخات صناعية ومقاولات وحلول المياه'
        : 'United Park Group (PARK) – Industrial Pumps, Contracting & Water Solutions';
    const defaultDesc =
      locale === 'ar'
        ? 'الموقع الرسمي لمجموعة بارك المتحدة في جدة منذ ١٩٨٩. أنظمة ضخ ومعالجة المياه والمقاولات في المملكة العربية السعودية.'
        : 'Official corporate website of United Park Group (PARK) in Jeddah, Saudi Arabia since 1989. Pumps, contracting, and water solutions.';

    const title = matchedSeo?.metaTitle || defaultTitle;
    const desc = matchedSeo?.metaDescription || defaultDesc;
    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.includes('property=')) {
          el.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else {
          el.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[name="robots"]', 'content', matchedSeo?.noIndex ? 'noindex, nofollow' : 'index, follow');
    setMeta('meta[property="og:title"]', 'content', matchedSeo?.ogTitle || title);
    setMeta('meta[property="og:description"]', 'content', matchedSeo?.ogDescription || desc);
    setMeta('meta[property="og:type"]', 'content', matchedSeo?.ogType || 'website');
    if (matchedSeo?.ogImageUrl) {
      setMeta('meta[property="og:image"]', 'content', matchedSeo.ogImageUrl);
    }
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', desc);

    const origin = window.location.origin;
    const canonicalHref = `${origin}${locale === 'ar' ? (currentPath === '/' ? '/ar' : `/ar${currentPath}`) : currentPath}`;

    const ensureLink = (id: string, rel: string, href: string, hreflang?: string) => {
      let link = document.getElementById(id) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.id = id;
        link.rel = rel;
        if (hreflang) link.hreflang = hreflang;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    ensureLink('park-canonical', 'canonical', canonicalHref);
    ensureLink('park-hreflang-en', 'alternate', `${origin}${currentPath}`, 'en');
    ensureLink(
      'park-hreflang-ar',
      'alternate',
      `${origin}${currentPath === '/' ? '/ar' : `/ar${currentPath}`}`,
      'ar'
    );
    ensureLink('park-hreflang-default', 'alternate', `${origin}${currentPath}`, 'x-default');

    // Organization + Breadcrumb JSON-LD
    let ldScript = document.getElementById('park-jsonld') as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.id = 'park-jsonld';
      ldScript.type = 'application/ld+json';
      document.head.appendChild(ldScript);
    }

    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: bootstrap.settings?.companyNameEn || 'United Park Group (PARK)',
      alternateName: bootstrap.settings?.companyNameAr || 'مجموعة بارك المتحدة',
      url: origin,
      telephone: bootstrap.settings?.phone || '+966 12 6604411',
      email: bootstrap.settings?.email || 'info@park.com.sa',
      foundingDate: '1989',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Hammouri Buildings, Azizeyyah District, Al-Baliyah Street',
        addressLocality: 'Jeddah',
        addressCountry: 'SA',
      },
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: locale === 'ar' ? 'الرئيسية' : 'Home',
          item: origin,
        },
        ...(currentPath !== '/'
          ? [
              {
                '@type': 'ListItem',
                position: 2,
                name: title.split('|')[0].trim(),
                item: canonicalHref,
              },
            ]
          : []),
      ],
    };

    ldScript.textContent = JSON.stringify([orgSchema, breadcrumbSchema]);
  }, [bootstrap, currentPath, locale]);

  // Optional Google Analytics integration driven by CMS Website Settings
  useEffect(() => {
    const gaId = bootstrap?.settings?.analyticsMeasurementId?.trim();
    if (!gaId || !/^(G|AW|UA)-[A-Z0-9-]+$/i.test(gaId)) return;
    if (document.getElementById('park-gtag-js')) return;

    const script = document.createElement('script');
    script.id = 'park-gtag-js';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);

    const inline = document.createElement('script');
    inline.id = 'park-gtag-init';
    inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`;
    document.head.appendChild(inline);
  }, [bootstrap?.settings?.analyticsMeasurementId]);

  return (
    <AppContext.Provider
      value={{
        locale,
        isRtl,
        setLocale,
        toggleLocale,
        currentPath,
        navigate,
        bootstrap,
        loading,
        error,
        refreshBootstrap: () => fetchBootstrap(locale),
        firebaseUser,
        dbUser,
        authToken,
        authLoading,
        authError,
        signInWithGoogle,
        signInWithEmail,
        sendPasswordReset,
        signOut,
        preselectedProduct,
        setPreselectedProduct,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

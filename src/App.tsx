import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { PartnersPage } from './pages/PartnersPage';
import {
  AboutPage,
  ContactPage,
  DivisionPage,
  NewsPage,
  ProjectsPage,
  QuotePage,
  ServicesPage,
} from './pages/SecondaryPages';
import { AdminDashboard } from './pages/AdminDashboard';

const AppRouter: React.FC = () => {
  const { currentPath, loading, error, bootstrap, refreshBootstrap, navigate, locale } = useApp();
  const isAr = locale === 'ar';

  // Admin portal renders its own full-viewport workspace layout
  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    return <AdminDashboard />;
  }

  const renderPage = () => {
    if (loading && !bootstrap) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-6">
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-44 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-44 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </div>
      );
    }

    if (error && !bootstrap) {
      return (
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#133D68]">
            {isAr ? 'تعذر تحميل البيانات' : 'Unable to Load Corporate Content'}
          </h1>
          <p className="text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={refreshBootstrap}
            className="px-5 py-2.5 bg-[#133D68] text-white text-sm font-semibold rounded-md"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      );
    }

    if (currentPath === '/' || currentPath === '/home') {
      return <HomePage />;
    }
    if (currentPath === '/about') {
      return <AboutPage />;
    }
    if (currentPath === '/services') {
      return <ServicesPage />;
    }
    if (currentPath === '/products') {
      return <ProductsPage />;
    }
    if (currentPath.startsWith('/products/')) {
      return <ProductsPage slug={currentPath.replace('/products/', '')} />;
    }
    if (currentPath === '/partners') {
      return <PartnersPage />;
    }
    if (currentPath.startsWith('/partners/')) {
      return <PartnersPage slug={currentPath.replace('/partners/', '')} />;
    }
    if (currentPath === '/projects') {
      return <ProjectsPage />;
    }
    if (currentPath.startsWith('/projects/')) {
      return <ProjectsPage slug={currentPath.replace('/projects/', '')} />;
    }
    if (currentPath === '/news') {
      return <NewsPage />;
    }
    if (currentPath.startsWith('/news/')) {
      return <NewsPage slug={currentPath.replace('/news/', '')} />;
    }
    if (currentPath === '/divisions/industrial-engineering' || currentPath === '/divisions/pumps') {
      return <DivisionPage division="industrial-engineering" />;
    }
    if (currentPath === '/divisions/contracting') {
      return <DivisionPage division="contracting" />;
    }
    if (currentPath === '/divisions/real-estate') {
      return <DivisionPage division="real-estate" />;
    }
    if (currentPath === '/divisions/healthcare') {
      return <DivisionPage division="healthcare" />;
    }
    if (currentPath === '/divisions/solar-energy') {
      return <DivisionPage division="solar-energy" />;
    }
    if (currentPath === '/contact') {
      return <ContactPage />;
    }
    if (currentPath === '/quote') {
      return <QuotePage />;
    }

    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-3xl font-bold text-[#133D68]">404</h1>
        <p className="text-slate-600">
          {isAr ? 'الصفحة المطلوبة غير موجودة.' : 'The requested page could not be found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-[#133D68] text-white text-sm font-semibold rounded-md"
        >
          {isAr ? 'العودة للرئيسية' : 'Return Home'}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Header />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

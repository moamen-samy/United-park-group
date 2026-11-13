import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Search, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ResilientImage } from '../components/ResilientImage';
import type { LocalizedProduct } from '../types/cms';

function parseNumericPrice(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = Number(String(raw).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function getStockLabel(status: string, isAr: boolean): { label: string; cls: string } {
  switch (status) {
    case 'in_stock':
      return {
        label: isAr ? 'متوفر بالمخزون' : 'In Stock',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'out_of_stock':
      return {
        label: isAr ? 'غير متوفر مؤقتاً' : 'Out of Stock',
        cls: 'bg-red-50 text-red-700 border-red-200',
      };
    default:
      return {
        label: isAr ? 'توريد حسب الطلب' : 'Made to Order',
        cls: 'bg-sky-50 text-[#133D68] border-sky-200',
      };
  }
}

export const ProductPriceBadge: React.FC<{
  product: LocalizedProduct;
  isAr: boolean;
  defaultCurrency?: string;
  compact?: boolean;
}> = ({ product, isAr, defaultCurrency = 'SAR', compact = false }) => {
  const regular = parseNumericPrice(product.regularPrice);
  const discount = parseNumericPrice(product.discountPrice);
  const currency = product.currency || defaultCurrency || 'SAR';

  if (!product.showPrice || regular <= 0) {
    return (
      <div className={compact ? 'text-xs font-semibold text-slate-500' : 'text-sm font-semibold text-[#133D68]'}>
        {isAr ? 'التسعير حسب الطلب (RFQ)' : 'Price Upon Technical Quote'}
      </div>
    );
  }

  const hasPromo = discount > 0 && discount < regular;
  const pct = hasPromo ? Math.round(((regular - discount) / regular) * 100) : 0;
  const activePrice = hasPromo ? discount : regular;
  const taxNum = parseNumericPrice(product.taxRate);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={`${compact ? 'text-base' : 'text-2xl'} font-extrabold font-mono-tabular text-[#133D68]`}>
          {activePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
        </span>
        {hasPromo && (
          <>
            <span className="text-xs font-mono-tabular text-slate-400 line-through">
              {regular.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#D93829] text-white rounded">
              <Tag className="w-3 h-3" aria-hidden="true" />
              -{pct}%
            </span>
          </>
        )}
      </div>
      {!compact && taxNum > 0 && (
        <p className="text-xs text-slate-500">
          {isAr
            ? `غير شامل ضريبة القيمة المضافة (${taxNum}%)`
            : `Excludes ${taxNum}% VAT · Official Tax Invoice Available`}
        </p>
      )}
    </div>
  );
};

export const ProductsPage: React.FC<{ slug?: string }> = ({ slug }) => {
  const { locale, isRtl, navigate, bootstrap, setPreselectedProduct } = useApp();
  const isAr = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeImageUrl, setActiveImageUrl] = useState<string>('');

  const products = bootstrap?.products || [];
  const categories = bootstrap?.categories || [];
  const partners = bootstrap?.partners || [];
  const defaultCurrency = bootstrap?.settings?.defaultCurrency || 'SAR';

  const activeProduct = useMemo(
    () => (slug ? products.find((p) => p.slug === slug) : null),
    [slug, products]
  );

  useEffect(() => {
    if (activeProduct) {
      setActiveImageUrl(activeProduct.imageUrl || '/images/product-pump.jpg');
    }
  }, [activeProduct]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) return false;
      if (selectedPartnerId !== 'all' && p.partnerId !== selectedPartnerId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (p.translation?.name || '').toLowerCase();
        const summary = (p.translation?.summary || '').toLowerCase();
        const sku = p.sku.toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const model = (p.modelNumber || '').toLowerCase();
        return (
          name.includes(q) ||
          summary.includes(q) ||
          sku.includes(q) ||
          brand.includes(q) ||
          model.includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategoryId, selectedPartnerId, searchQuery]);

  // Product Detail Page
  if (slug) {
    if (!activeProduct) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#133D68]">
            {isAr ? 'المنتج غير موجود' : 'Product Not Found'}
          </h1>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#133D68] rounded-md"
          >
            {isAr ? 'العودة إلى الكتالوج' : 'Back to Product Catalog'}
          </button>
        </div>
      );
    }

    const category = categories.find((c) => c.id === activeProduct.categoryId);
    const partner = partners.find((pt) => pt.id === activeProduct.partnerId);
    const related = products.filter((p) => p.id !== activeProduct.id).slice(0, 3);
    const specs = activeProduct.translation?.specificationsJson || [];
    const apps = activeProduct.translation?.applicationsJson || [];
    const features = activeProduct.translation?.featuresJson || [];
    const galleryImages = Array.from(
      new Set([activeProduct.imageUrl, ...(activeProduct.galleryImagesJson || [])].filter(Boolean))
    );
    const stockBadge = getStockLabel(activeProduct.stockStatus, isAr);

    return (
      <div className="bg-white">
        <div className="bg-[#F4F6F9] border-b border-slate-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <button type="button" onClick={() => navigate('/')} className="hover:text-[#133D68]">
              {isAr ? 'الرئيسية' : 'Home'}
            </button>
            <span>/</span>
            <button type="button" onClick={() => navigate('/products')} className="hover:text-[#133D68]">
              {isAr ? 'المنتجات' : 'Products'}
            </button>
            <span>/</span>
            <span className="font-semibold text-[#133D68]">
              {activeProduct.translation?.name || activeProduct.sku}
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-3">
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <ResilientImage
                  src={activeImageUrl || activeProduct.imageUrl}
                  alt={activeProduct.translation?.name || activeProduct.sku}
                  lazy={false}
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>

              {galleryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2.5">
                  {galleryImages.map((imgUrl) => {
                    const selected = (activeImageUrl || activeProduct.imageUrl) === imgUrl;
                    return (
                      <button
                        key={imgUrl}
                        type="button"
                        onClick={() => setActiveImageUrl(imgUrl)}
                        className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors ${
                          selected ? 'border-[#133D68]' : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <ResilientImage
                          src={imgUrl}
                          alt={activeProduct.translation?.name || activeProduct.sku}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono-tabular">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                  SKU: {activeProduct.sku}
                </span>
                {activeProduct.modelNumber && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {isAr ? 'الموديل:' : 'Model:'} {activeProduct.modelNumber}
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded border font-sans font-semibold ${stockBadge.cls}`}>
                  {stockBadge.label}
                </span>
                {category && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-sans">{isAr ? category.nameAr : category.nameEn}</span>
                  </>
                )}
                {partner && (
                  <>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/partners/${partner.slug}`)}
                      className="font-sans text-[#133D68] font-semibold hover:underline"
                    >
                      {partner.name}
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-2">
                {activeProduct.brand && (
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {activeProduct.brand}
                  </p>
                )}
                <h1 className="text-3xl font-bold text-[#133D68] tracking-tight">
                  {activeProduct.translation?.name}
                </h1>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <ProductPriceBadge
                  product={activeProduct}
                  isAr={isAr}
                  defaultCurrency={defaultCurrency}
                />
                <span className="text-xs text-slate-500">
                  {isAr ? 'شامل الدعم الهندسي والضمان' : 'Engineering Support & Warranty Included'}
                </span>
              </div>

              <p className="text-base text-slate-600 leading-relaxed">
                {activeProduct.translation?.description || activeProduct.translation?.summary}
              </p>

              {/* Features & Benefits */}
              {features.length > 0 && (
                <div className="space-y-2.5">
                  <h2 className="text-sm font-bold text-slate-900">
                    {isAr ? 'المميزات والفوائد الهندسية' : 'Key Features & Benefits'}
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                    {features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#133D68] mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Specifications Table */}
              {specs.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900">
                      {isAr ? 'المواصفات الفنية' : 'Technical Specifications'}
                    </h2>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-200">
                      {specs.map((row) => (
                        <tr key={row.label} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3 font-medium text-slate-700">{row.label}</td>
                          <td className="px-5 py-3 text-end font-mono-tabular font-semibold text-slate-900">
                            {row.value} {row.unit || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {apps.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    {isAr ? 'التطبيقات الرئيسية' : 'Key Applications'}
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                    {apps.map((appItem) => (
                      <li key={appItem} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#133D68]" aria-hidden="true" />
                        <span>{appItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setPreselectedProduct(`${activeProduct.translation?.name} (${activeProduct.sku})`);
                    navigate('/quote');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#133D68] hover:bg-[#0C2B4B] text-white text-sm font-semibold rounded-md transition-colors"
                >
                  <span>{isAr ? 'اطلب عرض سعر لهذا المنتج' : 'Request a Quotation'}</span>
                  <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                </button>

                {activeProduct.datasheetUrl && (
                  <a
                    href={activeProduct.datasheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 border border-slate-300 text-slate-700 hover:border-[#133D68] text-sm font-semibold rounded-md"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    <span>{isAr ? 'تحميل النشرة الفنية' : 'Technical Datasheet'}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="pt-10 border-t border-slate-200">
              <h2 className="text-xl font-bold text-[#133D68] mb-6">
                {isAr ? 'منتجات ذات صلة' : 'Related Equipment'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((rel) => (
                  <article
                    key={rel.id}
                    onClick={() => navigate(`/products/${rel.slug}`)}
                    className="cursor-pointer border border-slate-200 rounded-lg p-5 hover:border-[#133D68] transition-colors space-y-2"
                  >
                    <p className="text-xs font-mono-tabular text-slate-500">{rel.sku}</p>
                    <h3 className="font-bold text-slate-900">{rel.translation?.name}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{rel.translation?.summary}</p>
                    <div className="pt-1">
                      <ProductPriceBadge product={rel} isAr={isAr} defaultCurrency={defaultCurrency} compact />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Product Catalog Listing Page
  return (
    <div className="bg-white">
      <section className="bg-[#133D68] text-white py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <p className="text-xs uppercase tracking-wider text-slate-300">
            {isAr ? 'بارك للمضخات · المعدات الصناعية' : 'Park Pumps · Equipment Catalog'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {isAr ? 'كتالوج المنتجات والأنظمة' : 'Industrial Products & Pump Systems'}
          </h1>
          <p className="text-slate-200 max-w-2xl text-sm sm:text-base">
            {isAr
              ? 'استعرض أنظمة رفع الضغط والمحركات وخزانات التمدد وأنظمة التعقيم ولوحات التحكم المعتمدة.'
              : 'Explore engineered pump packages, motors, disinfection skids, pressure vessels, and control instrumentation.'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                selectedCategoryId === 'all'
                  ? 'bg-[#133D68] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'جميع الفئات' : 'All Categories'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                  selectedCategoryId === cat.id
                    ? 'bg-[#133D68] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isAr ? cat.nameAr : cat.nameEn}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedPartnerId}
              onChange={(e) =>
                setSelectedPartnerId(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              aria-label={isAr ? 'تصفية حسب الشريك' : 'Filter by partner'}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-700"
            >
              <option value="all">{isAr ? 'كل الشركات المصنعة' : 'All Partners'}</option>
              {partners.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search
                className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
                  isRtl ? 'right-3' : 'left-3'
                }`}
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث باسم المنتج أو SKU...' : 'Search product, brand, or SKU...'}
                className={`w-full sm:w-64 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#133D68] ${
                  isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-300 rounded-xl space-y-3">
            <p className="text-slate-600 font-medium">
              {isAr ? 'لا توجد منتجات مطابقة لبحثك.' : 'No products match your current filter.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId('all');
                setSelectedPartnerId('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-xs font-semibold text-[#133D68] border border-[#133D68] rounded-md"
            >
              {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => {
              const cat = categories.find((c) => c.id === prod.categoryId);
              const partner = partners.find((pt) => pt.id === prod.partnerId);
              const stock = getStockLabel(prod.stockStatus, isAr);
              return (
                <article
                  key={prod.id}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col justify-between hover:border-[#133D68]/50 transition-colors"
                >
                  <div>
                    <div
                      onClick={() => navigate(`/products/${prod.slug}`)}
                      className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer"
                    >
                      <ResilientImage
                        src={prod.imageUrl}
                        alt={prod.translation?.name || prod.sku}
                        className="w-full h-full object-cover"
                      />
                      <span
                        className={`absolute top-3 ${
                          isRtl ? 'left-3' : 'right-3'
                        } px-2.5 py-0.5 text-[11px] font-semibold rounded border shadow-xs ${stock.cls}`}
                      >
                        {stock.label}
                      </span>
                    </div>
                    <div className="p-6 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono-tabular">{prod.sku}</span>
                        {cat && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{isAr ? cat.nameAr : cat.nameEn}</span>
                          </>
                        )}
                        {(prod.brand || partner) && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{prod.brand || partner?.name}</span>
                          </>
                        )}
                      </div>
                      <h2
                        onClick={() => navigate(`/products/${prod.slug}`)}
                        className="text-lg font-bold text-slate-900 cursor-pointer hover:text-[#133D68]"
                      >
                        {prod.translation?.name}
                      </h2>
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                        {prod.translation?.summary}
                      </p>
                      <div className="pt-1">
                        <ProductPriceBadge
                          product={prod}
                          isAr={isAr}
                          defaultCurrency={defaultCurrency}
                          compact
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate(`/products/${prod.slug}`)}
                      className="text-xs font-semibold text-[#133D68] hover:underline"
                    >
                      {isAr ? 'عرض التفاصيل والمواصفات' : 'View Details & Specs'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreselectedProduct(`${prod.translation?.name} (${prod.sku})`);
                        navigate('/quote');
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-[#133D68] hover:bg-[#0C2B4B] rounded-md"
                    >
                      {isAr ? 'اطلب عرض سعر' : 'Get Quote'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


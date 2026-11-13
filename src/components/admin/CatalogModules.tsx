import React, { useMemo, useState } from 'react';
import { History, Plus, Search, Trash2 } from 'lucide-react';
import { AdminModuleProps } from './AdminTypes';
import { tAdmin } from './AdminTranslations';

export const ProductsModule: React.FC<AdminModuleProps> = ({
  data,
  adminLang,
  apiRequest,
  showToast,
  reloadData,
  openMediaPicker,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [historyProductId, setHistoryProductId] = useState<number | null>(null);

  const [form, setForm] = useState({
    sku: '',
    slug: '',
    categoryId: '',
    partnerId: '',
    imageUrl: '/images/product-pump.jpg',
    galleryText: '',
    datasheetUrl: '',
    division: 'pumps',
    brand: '',
    modelNumber: '',
    stockStatus: 'in_stock' as 'in_stock' | 'made_to_order' | 'out_of_stock',
    regularPrice: '0',
    discountPrice: '',
    currency: data.settings?.defaultCurrency || 'SAR',
    taxRate: data.settings?.defaultTaxRate || '15',
    showPrice: false,
    status: 'published' as 'draft' | 'published' | 'archived',
    isFeatured: true,
    sortOrder: 0,
    priceChangeNote: '',
    seoTitleEn: '',
    seoTitleAr: '',
    seoDescEn: '',
    seoDescAr: '',
    nameEn: '',
    summaryEn: '',
    descriptionEn: '',
    specsTextEn: '',
    featuresTextEn: '',
    nameAr: '',
    summaryAr: '',
    descriptionAr: '',
    specsTextAr: '',
    featuresTextAr: '',
  });

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.products.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.sku.toLowerCase().includes(q) ||
        (p.en?.name || '').toLowerCase().includes(q) ||
        (p.ar?.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    });
  }, [data.products, search, statusFilter]);

  const computedDiscountPct = useMemo(() => {
    const reg = parseFloat(form.regularPrice);
    const disc = parseFloat(form.discountPrice);
    if (Number.isFinite(reg) && reg > 0 && Number.isFinite(disc) && disc > 0 && disc < reg) {
      return Math.round(((reg - disc) / reg) * 100);
    }
    return 0;
  }, [form.regularPrice, form.discountPrice]);

  const parseSpecs = (raw: string) =>
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, value, unit] = line.split('|').map((s) => s.trim());
        return { label: label || 'Spec', value: value || '-', unit: unit || undefined };
      });

  const startEdit = (p: (typeof data.products)[number]) => {
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      slug: p.slug,
      categoryId: p.categoryId ? String(p.categoryId) : '',
      partnerId: p.partnerId ? String(p.partnerId) : '',
      imageUrl: p.imageUrl || '/images/product-pump.jpg',
      galleryText: (p.galleryImagesJson || []).join('\n'),
      datasheetUrl: p.datasheetUrl || '',
      division: p.division || 'pumps',
      brand: p.brand || '',
      modelNumber: p.modelNumber || '',
      stockStatus: p.stockStatus || 'in_stock',
      regularPrice: p.regularPrice || '0',
      discountPrice: p.discountPrice || '',
      currency: p.currency || 'SAR',
      taxRate: p.taxRate || '15',
      showPrice: Boolean(p.showPrice),
      status: p.status || (p.isPublished ? 'published' : 'draft'),
      isFeatured: p.isFeatured,
      sortOrder: p.sortOrder || 0,
      priceChangeNote: '',
      seoTitleEn: p.seoTitleEn || '',
      seoTitleAr: p.seoTitleAr || '',
      seoDescEn: p.seoDescEn || '',
      seoDescAr: p.seoDescAr || '',
      nameEn: p.en?.name || '',
      summaryEn: p.en?.summary || '',
      descriptionEn: p.en?.description || '',
      specsTextEn: (p.en?.specificationsJson || [])
        .map((s) => `${s.label} | ${s.value}${s.unit ? ` | ${s.unit}` : ''}`)
        .join('\n'),
      featuresTextEn: (p.en?.featuresJson || p.en?.applicationsJson || []).join('\n'),
      nameAr: p.ar?.name || '',
      summaryAr: p.ar?.summary || '',
      descriptionAr: p.ar?.description || '',
      specsTextAr: (p.ar?.specificationsJson || [])
        .map((s) => `${s.label} | ${s.value}${s.unit ? ` | ${s.unit}` : ''}`)
        .join('\n'),
      featuresTextAr: (p.ar?.featuresJson || p.ar?.applicationsJson || []).join('\n'),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editingId === 'new';
    const payload = {
      sku: form.sku,
      slug: form.slug,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      partnerId: form.partnerId ? Number(form.partnerId) : null,
      imageUrl: form.imageUrl,
      galleryImagesJson: form.galleryText.split('\n').map((s) => s.trim()).filter(Boolean),
      datasheetUrl: form.datasheetUrl,
      division: form.division,
      brand: form.brand,
      modelNumber: form.modelNumber,
      stockStatus: form.stockStatus,
      regularPrice: form.regularPrice || '0',
      discountPrice: form.discountPrice || '',
      currency: form.currency || 'SAR',
      taxRate: form.taxRate || '15',
      showPrice: form.showPrice,
      status: form.status,
      isFeatured: form.isFeatured,
      isPublished: form.status === 'published',
      sortOrder: Number(form.sortOrder) || 0,
      priceChangeNote: form.priceChangeNote,
      seoTitleEn: form.seoTitleEn,
      seoTitleAr: form.seoTitleAr,
      seoDescEn: form.seoDescEn,
      seoDescAr: form.seoDescAr,
      en: {
        name: form.nameEn,
        summary: form.summaryEn,
        description: form.descriptionEn,
        specificationsJson: parseSpecs(form.specsTextEn),
        applicationsJson: form.featuresTextEn.split('\n').map((s) => s.trim()).filter(Boolean),
        featuresJson: form.featuresTextEn.split('\n').map((s) => s.trim()).filter(Boolean),
      },
      ar: {
        name: form.nameAr,
        summary: form.summaryAr,
        description: form.descriptionAr,
        specificationsJson: parseSpecs(form.specsTextAr),
        applicationsJson: form.featuresTextAr.split('\n').map((s) => s.trim()).filter(Boolean),
        featuresJson: form.featuresTextAr.split('\n').map((s) => s.trim()).filter(Boolean),
      },
    };

    const res = await apiRequest(
      isNew ? '/api/admin/products' : `/api/admin/products/${editingId}`,
      { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(payload) }
    );
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم حفظ المنتج والأسعار بنجاح', 'Product & pricing saved'));
      setEditingId(null);
      await reloadData();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast('error', err.error || 'Failed to save product');
    }
  };

  const historyProduct = data.products.find((p) => p.id === historyProductId) || null;

  return (
    <div className="space-y-6">
      {/* Top Filter & Create Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tAdmin(adminLang, 'بحث بالاسم أو SKU أو الماركة...', 'Search SKU, name, brand...')}
              className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="all">{tAdmin(adminLang, 'كل الحالات', 'All Statuses')}</option>
            <option value="published">{tAdmin(adminLang, 'منشور', 'Published')}</option>
            <option value="draft">{tAdmin(adminLang, 'مسودة', 'Draft')}</option>
            <option value="archived">{tAdmin(adminLang, 'مؤرشف', 'Archived')}</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingId('new');
            setForm({
              sku: '',
              slug: '',
              categoryId: '',
              partnerId: '',
              imageUrl: '/images/product-pump.jpg',
              galleryText: '',
              datasheetUrl: '',
              division: 'pumps',
              brand: '',
              modelNumber: '',
              stockStatus: 'in_stock',
              regularPrice: '0',
              discountPrice: '',
              currency: data.settings?.defaultCurrency || 'SAR',
              taxRate: data.settings?.defaultTaxRate || '15',
              showPrice: false,
              status: 'draft',
              isFeatured: false,
              sortOrder: data.products.length + 1,
              priceChangeNote: '',
              seoTitleEn: '',
              seoTitleAr: '',
              seoDescEn: '',
              seoDescAr: '',
              nameEn: '',
              summaryEn: '',
              descriptionEn: '',
              specsTextEn: '',
              featuresTextEn: '',
              nameAr: '',
              summaryAr: '',
              descriptionAr: '',
              specsTextAr: '',
              featuresTextAr: '',
            });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{tAdmin(adminLang, 'إضافة منتج جديد', 'Add Product')}</span>
        </button>
      </div>

      {/* Product Editor Form */}
      {editingId && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5"
        >
          <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            {editingId === 'new'
              ? tAdmin(adminLang, 'إضافة منتج جديد للكتالوج', 'New Catalog Product')
              : `${tAdmin(adminLang, 'تعديل المنتج', 'Edit Product')} — ${form.sku}`}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1">SKU</label>
              <input
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">Slug</label>
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">{tAdmin(adminLang, 'التصنيف', 'Category')}</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">--</option>
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {adminLang === 'ar' ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">{tAdmin(adminLang, 'الشريك / المصنع', 'Brand / Partner')}</label>
              <select
                value={form.partnerId}
                onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">--</option>
                {data.partners.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder={tAdmin(adminLang, 'العلامة التجارية', 'Brand Name')}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={form.modelNumber}
              onChange={(e) => setForm({ ...form, modelNumber: e.target.value })}
              placeholder={tAdmin(adminLang, 'رقم الموديل', 'Model Number')}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <select
              value={form.stockStatus}
              onChange={(e) => setForm({ ...form, stockStatus: e.target.value as 'in_stock' | 'made_to_order' | 'out_of_stock' })}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="in_stock">{tAdmin(adminLang, 'متوفر في المخزون', 'In Stock')}</option>
              <option value="made_to_order">{tAdmin(adminLang, 'حسب الطلب الهندسي', 'Made to Order')}</option>
              <option value="out_of_stock">{tAdmin(adminLang, 'غير متوفر حالياً', 'Out of Stock')}</option>
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' | 'archived' })}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="published">{tAdmin(adminLang, 'منشور', 'Published')}</option>
              <option value="draft">{tAdmin(adminLang, 'مسودة', 'Draft')}</option>
              <option value="archived">{tAdmin(adminLang, 'مؤرشف', 'Archived')}</option>
            </select>
          </div>

          {/* Pricing Box (SAR Default & RFQ Switch) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#133D68] dark:text-sky-400">
                {tAdmin(adminLang, 'إعدادات التسعير والعملة (الافتراضي: ريال سعودي SAR)', 'Pricing & Currency Control (Default: SAR)')}
              </span>
              {computedDiscountPct > 0 && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[11px] font-bold">
                  {tAdmin(adminLang, `نسبة الخصم: ${computedDiscountPct}%`, `Discount: ${computedDiscountPct}%`)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1">{tAdmin(adminLang, 'العملة', 'Currency')}</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {(data.settings?.supportedCurrenciesJson || ['SAR', 'USD', 'AED', 'EUR']).map((cur) => (
                    <option key={cur} value={cur}>
                      {cur}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">{tAdmin(adminLang, 'السعر الأساسي', 'Regular Price')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.regularPrice}
                  onChange={(e) => setForm({ ...form, regularPrice: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">{tAdmin(adminLang, 'سعر العرض / الخصم', 'Promo Price')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.discountPrice}
                  onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">{tAdmin(adminLang, 'الضريبة %', 'VAT Rate %')}</label>
                <input
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showPrice}
                    onChange={(e) => setForm({ ...form, showPrice: e.target.checked })}
                  />
                  <span>{tAdmin(adminLang, 'إظهار السعر (بدل اطلب عرض سعر)', 'Show Public Price')}</span>
                </label>
              </div>
            </div>
            <input
              value={form.priceChangeNote}
              onChange={(e) => setForm({ ...form, priceChangeNote: e.target.value })}
              placeholder={tAdmin(adminLang, 'ملاحظة سبب تحديث السعر (تحفظ في السجل التاريخي)', 'Optional price change audit note')}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          {/* Images & Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'الصورة الرئيسية للمنتج', 'Main Image URL')}</label>
              <div className="flex gap-2">
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() => openMediaPicker((url) => setForm((f) => ({ ...f, imageUrl: url })))}
                  className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
                >
                  {tAdmin(adminLang, 'المكتبة', 'Pick')}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">{tAdmin(adminLang, 'صور المعرض الإضافية (رابط في كل سطر)', 'Gallery Images (one URL per line)')}</label>
              <div className="flex gap-2 items-start">
                <textarea
                  rows={2}
                  value={form.galleryText}
                  onChange={(e) => setForm({ ...form, galleryText: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() =>
                    openMediaPicker((url) =>
                      setForm((f) => ({
                        ...f,
                        galleryText: f.galleryText ? `${f.galleryText}\n${url}` : url,
                      }))
                    )
                  }
                  className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
                >
                  + {tAdmin(adminLang, 'إضافة', 'Add')}
                </button>
              </div>
            </div>
          </div>

          {/* Bilingual Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="text-xs font-bold">البيانات العربية (AR)</h5>
              <input
                required
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                placeholder="اسم المنتج بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                required
                value={form.summaryAr}
                onChange={(e) => setForm({ ...form, summaryAr: e.target.value })}
                placeholder="وصف مختصر بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={3}
                value={form.descriptionAr}
                onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                placeholder="الوصف التفصيلي بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={3}
                value={form.specsTextAr}
                onChange={(e) => setForm({ ...form, specsTextAr: e.target.value })}
                placeholder="المواصفات الفنية (اسم | قيمة | وحدة - سطر لكل مواصفة)"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <h5 className="text-xs font-bold">English Content (EN)</h5>
              <input
                required
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                placeholder="Product Name (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                required
                value={form.summaryEn}
                onChange={(e) => setForm({ ...form, summaryEn: e.target.value })}
                placeholder="Short Summary (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={3}
                value={form.descriptionEn}
                onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                placeholder="Detailed Description (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={3}
                value={form.specsTextEn}
                onChange={(e) => setForm({ ...form, specsTextEn: e.target.value })}
                placeholder="Technical Specs (Label | Value | Unit — one per line)"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              />
              <span>{tAdmin(adminLang, 'منتج مميز في الصفحة الرئيسية', 'Featured Product')}</span>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs border rounded-lg">
                {tAdmin(adminLang, 'إلغاء', 'Cancel')}
              </button>
              <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-[#133D68] text-white rounded-lg">
                {tAdmin(adminLang, 'حفظ المنتج والتسعير', 'Save Product')}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500">
              <tr>
                <th className="py-3 px-4 text-start">SKU</th>
                <th className="py-3 px-4 text-start">{tAdmin(adminLang, 'المنتج', 'Product')}</th>
                <th className="py-3 px-4 text-start">{tAdmin(adminLang, 'السعر / العرض', 'Pricing')}</th>
                <th className="py-3 px-4 text-start">{tAdmin(adminLang, 'الحالة', 'Status')}</th>
                <th className="py-3 px-4 text-end">{tAdmin(adminLang, 'الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-[#133D68] dark:text-sky-400">{p.sku}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} alt={p.sku} className="w-10 h-10 rounded object-cover" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {adminLang === 'ar' ? p.ar?.name : p.en?.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.brand || '-'} {p.modelNumber ? `• ${p.modelNumber}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {p.showPrice ? (
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {p.discountPrice ? p.discountPrice : p.regularPrice} {p.currency}
                        </span>
                        {p.discountPrice && (
                          <span className="ms-2 line-through text-slate-400">{p.regularPrice}</span>
                        )}
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                        {tAdmin(adminLang, 'طلب عرض سعر (RFQ)', 'Request Quote')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : p.status === 'draft'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-end space-x-2 rtl:space-x-reverse">
                    <button
                      type="button"
                      onClick={() => setHistoryProductId(historyProductId === p.id ? null : p.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 text-[11px]"
                      title="Price History"
                    >
                      <History className="w-3 h-3" />
                      <span>{p.priceHistory?.length || 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="px-2.5 py-1 rounded bg-[#133D68] text-white text-[11px] font-semibold"
                    >
                      {tAdmin(adminLang, 'تعديل', 'Edit')}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(tAdmin(adminLang, `حذف المنتج ${p.sku}؟`, `Delete ${p.sku}?`))) {
                          await apiRequest(`/api/admin/products/${p.id}`, { method: 'DELETE' });
                          await reloadData();
                        }
                      }}
                      className="p-1 text-rose-600"
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

      {historyProduct && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold">
              {tAdmin(adminLang, 'سجل تغييرات السعر للمنتج:', 'Price History Audit Log:')} {historyProduct.sku}
            </h4>
            <button type="button" onClick={() => setHistoryProductId(null)} className="text-xs text-slate-500">
              {tAdmin(adminLang, 'إغلاق', 'Close')}
            </button>
          </div>
          {historyProduct.priceHistory.length === 0 ? (
            <p className="text-xs text-slate-500">{tAdmin(adminLang, 'لا توجد تعديلات أسعار مسجلة بعد.', 'No price revisions logged yet.')}</p>
          ) : (
            <div className="space-y-1.5 text-xs">
              {historyProduct.priceHistory.map((h) => (
                <div key={h.id} className="flex flex-wrap justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                  <span>
                    {h.previousPrice} → <strong>{h.newPrice} {h.currency}</strong> {h.note ? `(${h.note})` : ''}
                  </span>
                  <span className="text-slate-500">{h.changedByEmail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CategoriesModule: React.FC<AdminModuleProps> = ({
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
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    imageUrl: '/images/product-pump.jpg',
    sortOrder: 0,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editingId === 'new';
    const res = await apiRequest(
      isNew ? '/api/admin/categories' : `/api/admin/categories/${editingId}`,
      { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(form) }
    );
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم حفظ التصنيف', 'Category saved'));
      setEditingId(null);
      await reloadData();
    } else {
      showToast('error', 'Failed to save category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-bold">{tAdmin(adminLang, 'تصنيفات المنتجات', 'Product Categories')} ({data.categories.length})</h3>
        <button
          type="button"
          onClick={() => {
            setEditingId('new');
            setForm({
              slug: '',
              nameEn: '',
              nameAr: '',
              descriptionEn: '',
              descriptionAr: '',
              imageUrl: '/images/product-pump.jpg',
              sortOrder: data.categories.length + 1,
            });
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{tAdmin(adminLang, 'إضافة تصنيف', 'Add Category')}</span>
        </button>
      </div>

      {editingId && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="Slug"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              placeholder="Order"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <div className="flex gap-2">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              value={form.nameAr}
              onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              placeholder="الاسم بالعربية"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              required
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              placeholder="Category Name (EN)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={form.descriptionAr}
              onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
              placeholder="الوصف بالعربية"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={form.descriptionEn}
              onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
              placeholder="Description (EN)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs border rounded-lg">
              {tAdmin(adminLang, 'إلغاء', 'Cancel')}
            </button>
            <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-[#133D68] text-white rounded-lg">
              {tAdmin(adminLang, 'حفظ التصنيف', 'Save Category')}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.categories.map((cat) => (
          <div key={cat.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={cat.imageUrl} alt={cat.nameEn} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{adminLang === 'ar' ? cat.nameAr : cat.nameEn}</div>
                <div className="text-[11px] font-mono text-slate-400">/{cat.slug}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(cat.id);
                  setForm({
                    slug: cat.slug,
                    nameEn: cat.nameEn,
                    nameAr: cat.nameAr,
                    descriptionEn: cat.descriptionEn,
                    descriptionAr: cat.descriptionAr,
                    imageUrl: cat.imageUrl || '/images/product-pump.jpg',
                    sortOrder: cat.sortOrder,
                  });
                }}
                className="text-xs font-semibold text-[#133D68] dark:text-sky-400"
              >
                {tAdmin(adminLang, 'تعديل', 'Edit')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(tAdmin(adminLang, 'حذف هذا التصنيف؟', 'Delete category?'))) {
                    await apiRequest(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
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
  );
};

export const ProjectsModule: React.FC<AdminModuleProps> = ({
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
    clientName: '',
    category: 'Water Infrastructure',
    division: 'contracting',
    status: 'completed' as 'completed' | 'in_progress' | 'upcoming',
    locationEn: 'Jeddah, Saudi Arabia',
    locationAr: 'جدة، المملكة العربية السعودية',
    completionYear: '2026',
    imageUrl: '/images/sector-utilities.jpg',
    galleryText: '',
    isFeatured: true,
    isPublished: true,
    titleEn: '',
    summaryEn: '',
    scopeEn: '',
    titleAr: '',
    summaryAr: '',
    scopeAr: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editingId === 'new';
    const res = await apiRequest(isNew ? '/api/admin/projects' : `/api/admin/projects/${editingId}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify({
        slug: form.slug,
        clientName: form.clientName,
        category: form.category,
        division: form.division,
        status: form.status,
        locationEn: form.locationEn,
        locationAr: form.locationAr,
        completionYear: form.completionYear,
        imageUrl: form.imageUrl,
        galleryImagesJson: form.galleryText.split('\n').map((s) => s.trim()).filter(Boolean),
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
        en: { title: form.titleEn, summary: form.summaryEn, scopeOfWork: form.scopeEn, outcomeNotes: '' },
        ar: { title: form.titleAr, summary: form.summaryAr, scopeOfWork: form.scopeAr, outcomeNotes: '' },
      }),
    });
    if (res.ok) {
      showToast('success', tAdmin(adminLang, 'تم حفظ المشروع بنجاح', 'Project saved'));
      setEditingId(null);
      await reloadData();
    } else {
      showToast('error', 'Failed to save project');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-bold">{tAdmin(adminLang, 'المشاريع ومعرض الأعمال', 'Projects & Portfolio')} ({data.projects.length})</h3>
        <button
          type="button"
          onClick={() => {
            setEditingId('new');
            setForm({
              slug: '',
              clientName: '',
              category: 'Water Infrastructure',
              division: 'contracting',
              status: 'completed',
              locationEn: 'Jeddah, Saudi Arabia',
              locationAr: 'جدة، المملكة العربية السعودية',
              completionYear: '2026',
              imageUrl: '/images/sector-utilities.jpg',
              galleryText: '',
              isFeatured: true,
              isPublished: true,
              titleEn: '',
              summaryEn: '',
              scopeEn: '',
              titleAr: '',
              summaryAr: '',
              scopeAr: '',
            });
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#133D68] text-white text-xs font-semibold rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{tAdmin(adminLang, 'إضافة مشروع', 'Add Project')}</span>
        </button>
      </div>

      {editingId && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="Project Slug"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              placeholder={tAdmin(adminLang, 'اسم العميل', 'Client Name')}
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
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'completed' | 'in_progress' | 'upcoming' })}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="completed">{tAdmin(adminLang, 'منجز', 'Completed')}</option>
              <option value="in_progress">{tAdmin(adminLang, 'قيد التنفيذ', 'In Progress')}</option>
              <option value="upcoming">{tAdmin(adminLang, 'مخطط', 'Upcoming')}</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={form.locationAr}
              onChange={(e) => setForm({ ...form, locationAr: e.target.value })}
              placeholder="الموقع بالعربية"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={form.locationEn}
              onChange={(e) => setForm({ ...form, locationEn: e.target.value })}
              placeholder="Location (EN)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <div className="flex gap-2">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="Cover Image URL"
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
                placeholder="عنوان المشروع بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={2}
                required
                value={form.summaryAr}
                onChange={(e) => setForm({ ...form, summaryAr: e.target.value })}
                placeholder="ملخص المشروع بالعربية"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <input
                required
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="Project Title (EN)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={2}
                required
                value={form.summaryEn}
                onChange={(e) => setForm({ ...form, summaryEn: e.target.value })}
                placeholder="Summary (EN)"
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
                {tAdmin(adminLang, 'حفظ المشروع', 'Save Project')}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.projects.map((prj) => (
          <div key={prj.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-3">
            <img src={prj.imageUrl} alt={prj.slug} className="w-24 h-20 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#133D68] dark:text-sky-400">
                  {prj.division} • {prj.status}
                </span>
              </div>
              <div className="font-bold text-sm mt-1 truncate">
                {adminLang === 'ar' ? prj.ar?.title : prj.en?.title}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {adminLang === 'ar' ? prj.locationAr : prj.locationEn}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(prj.id);
                    setForm({
                      slug: prj.slug,
                      clientName: prj.clientName || '',
                      category: prj.category,
                      division: prj.division,
                      status: prj.status || 'completed',
                      locationEn: prj.locationEn,
                      locationAr: prj.locationAr,
                      completionYear: prj.completionYear,
                      imageUrl: prj.imageUrl,
                      galleryText: (prj.galleryImagesJson || []).join('\n'),
                      isFeatured: prj.isFeatured,
                      isPublished: prj.isPublished,
                      titleEn: prj.en?.title || '',
                      summaryEn: prj.en?.summary || '',
                      scopeEn: prj.en?.scopeOfWork || '',
                      titleAr: prj.ar?.title || '',
                      summaryAr: prj.ar?.summary || '',
                      scopeAr: prj.ar?.scopeOfWork || '',
                    });
                  }}
                  className="text-xs font-semibold text-[#133D68] dark:text-sky-400"
                >
                  {tAdmin(adminLang, 'تعديل', 'Edit')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(tAdmin(adminLang, 'حذف المشروع؟', 'Delete project?'))) {
                      await apiRequest(`/api/admin/projects/${prj.id}`, { method: 'DELETE' });
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

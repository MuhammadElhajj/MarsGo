// src/components/AdminCoponent/ExternalStoreImport/ExternalStoreImport.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import {
  FiSearch, FiArrowUp, FiArrowDown, FiStar, FiFilter, FiSave, FiRefreshCw, FiX,
  FiPlus, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiFolder, FiSettings,
} from 'react-icons/fi';

// استيراد المكونات الفرعية
import { SubCategoryManager } from './components/SubCategoryManager';
import { CategoryMappingManager } from './components/CategoryMappingManager';
import { ProductCardItem } from './components/ProductCardItem';
import { useParentItems } from './hooks/useParentItems';
import { useProducts } from './hooks/useProducts';
import { generateSlug, getQuantityType } from './utils/helpers';

import './ExternalStoreImport.css';

export default function ExternalStoreImport() {
  // استخدام hooks
  const { products, loading: productsLoading, loadProducts } = useProducts();
  const [markupPercent, setMarkupPercent] = useState(10);
  const [selectedTargetCategoryId, setSelectedTargetCategoryId] = useState('games');
  const [globalCategoryImage, setGlobalCategoryImage] = useState('');
  const [productImages, setProductImages] = useState({});
  const [popularProducts, setPopularProducts] = useState(new Set());
  const [categoryMappings, setCategoryMappings] = useState({});
  const [hierarchicalConfig, setHierarchicalConfig] = useState({ games: { separator: ' - ' }, apps: { separator: ' - ' } });
  const [showMappingManager, setShowMappingManager] = useState(false);
  const { items: parentItems, refetch: refetchParents } = useParentItems(selectedTargetCategoryId);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedParentGlobalImage, setSelectedParentGlobalImage] = useState('');

  // فلترة وترتيب
  const [visibleCount, setVisibleCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterExternalCategory, setFilterExternalCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);
  const [importing, setImporting] = useState({});

  // جلب إعدادات التصنيف
  const loadMappingSettings = useCallback(async () => {
    try {
      const mappingsDoc = await getDoc(doc(db, 'config', 'categoryMappings'));
      if (mappingsDoc.exists()) setCategoryMappings(mappingsDoc.data());
      const hierarchicalDoc = await getDoc(doc(db, 'config', 'hierarchicalConfig'));
      if (hierarchicalDoc.exists()) setHierarchicalConfig(hierarchicalDoc.data());
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    loadProducts();
    loadMappingSettings();
  }, []);

  // عند تغيير التصنيف المستهدف، نعيد تعيين الأب المختار
  useEffect(() => {
    setSelectedParentId(null);
    setSelectedParentGlobalImage('');
  }, [selectedTargetCategoryId]);

  // البيانات المشتقة
  const externalCategories = useMemo(() => [...new Set(products.map(p => p.category_name).filter(Boolean))], [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];
    if (filterExternalCategory) filtered = filtered.filter(p => p.category_name === filterExternalCategory);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || String(p.id).includes(term));
    }
    if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
    if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
    if (showOnlyPopular) filtered = filtered.filter(p => popularProducts.has(p.id));
    filtered.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'name') { valA = a.name; valB = b.name; }
      else if (sortBy === 'price') { valA = a.price; valB = b.price; }
      else { valA = a.id; valB = b.id; }
      if (typeof valA === 'string') return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
    return filtered;
  }, [products, filterExternalCategory, searchTerm, minPrice, maxPrice, showOnlyPopular, popularProducts, sortBy, sortOrder]);

  const displayedProducts = useMemo(() => filteredAndSortedProducts.slice(0, visibleCount), [filteredAndSortedProducts, visibleCount]);
  const hasMore = visibleCount < filteredAndSortedProducts.length;

  const loadMore = useCallback(() => {
    setIsLoadingMore(true);
    setVisibleCount(prev => prev + 50);
    setIsLoadingMore(false);
  }, []);

  // منطق الاستيراد – مع إضافة الحقول الجديدة
  const importToPackages = useCallback(async (productsToImport) => {
    if (!selectedTargetCategoryId || (selectedTargetCategoryId !== 'games' && selectedTargetCategoryId !== 'apps')) {
      showToast('الاستيراد ممكن فقط للألعاب أو التطبيقات', 'error');
      return false;
    }
    if (!selectedParentId) {
      showToast('اختر لعبة أو تطبيقاً أولاً', 'error');
      return false;
    }

    const collectionName = selectedTargetCategoryId;
    const packagesRef = collection(db, collectionName, selectedParentId, 'packages');
    const batch = writeBatch(db);
    let addedCount = 0;

    for (const prod of productsToImport) {
      const finalPrice = prod.price * (1 + markupPercent / 100);
      const imageUrl = selectedParentGlobalImage || productImages[prod.id] || globalCategoryImage || prod.image || null;
      const packageId = prod.id.toString();
      const packageDocRef = doc(packagesRef, packageId);

      // ✅ إضافة معطيات الكمية المتغيرة
      const qtyValues = prod.qty_values || { min: 1, max: 1 };
      const quantityType = getQuantityType(qtyValues);

      const packageData = {
        name: prod.name,
        price: finalPrice,
        originalPrice: prod.price,
        currency: 'USD',
        discount: 0,
        type: 'normal',
        order: 0,
        imageUrl: imageUrl,
        note: `منتج مستورد من المتجر الخارجي (ID: ${prod.id})`,
        externalProductId: prod.id,
        externalAnyKey: '',
        isPopular: popularProducts.has(prod.id),
        // ✅ الحقول الجديدة للكمية المتغيرة
        quantityType: quantityType,
        minQuantity: qtyValues.min ?? 1,
        maxQuantity: qtyValues.max ?? 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      batch.set(packageDocRef, packageData, { merge: true });
      addedCount++;
    }

    try {
      await batch.commit();
      showToast(`تم استيراد ${addedCount} باقة بنجاح`, 'success');
      refetchParents();
      return true;
    } catch (err) {
      console.error(err);
      showToast(`فشل الاستيراد: ${err.message}`, 'error');
      return false;
    }
  }, [selectedTargetCategoryId, selectedParentId, markupPercent, selectedParentGlobalImage, productImages, globalCategoryImage, popularProducts, refetchParents]);

  const handleImportSingle = useCallback(async (product) => {
    if (!selectedParentId) { showToast('اختر لعبة أو تطبيقاً أولاً', 'error'); return; }
    setImporting(prev => ({ ...prev, [product.id]: true }));
    await importToPackages([product]);
    setImporting(prev => ({ ...prev, [product.id]: false }));
  }, [selectedParentId, importToPackages]);

  const handleImportAll = useCallback(async () => {
    if (!selectedParentId) { showToast('اختر لعبة أو تطبيقاً أولاً', 'error'); return; }
    setLoading(true);
    await importToPackages(filteredAndSortedProducts);
    setLoading(false);
  }, [selectedParentId, importToPackages, filteredAndSortedProducts]);

  // معالجات أخرى
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFilterExternalCategory('');
    setMinPrice('');
    setMaxPrice('');
    setShowOnlyPopular(false);
    setSortBy('name');
    setSortOrder('asc');
  }, []);

  const togglePopular = useCallback((productId, imageUrl = null) => {
    if (imageUrl !== null) {
      setProductImages(prev => ({ ...prev, [productId]: imageUrl }));
    } else {
      setPopularProducts(prev => {
        const newSet = new Set(prev);
        newSet.has(productId) ? newSet.delete(productId) : newSet.add(productId);
        return newSet;
      });
    }
  }, []);

  const saveCategoryImage = useCallback(async () => {
    if (selectedTargetCategoryId && globalCategoryImage) {
      await setDoc(doc(db, 'categoryImages', selectedTargetCategoryId), { imageUrl: globalCategoryImage, updatedAt: new Date().toISOString() }, { merge: true });
      showToast('تم حفظ صورة القسم', 'success');
    }
  }, [selectedTargetCategoryId, globalCategoryImage]);

  if (productsLoading && products.length === 0) return <div className="import-loading">جاري تحميل البيانات...</div>;

  const selectedParent = parentItems.find(p => p.id === selectedParentId);
  const titleLabel = selectedTargetCategoryId === 'games' ? 'اللعبة' : 'التطبيق';

  return (
    <div className="external-store-import" dir="rtl">
      <div style={{ marginBottom: '1rem' }}>
        <GoBackButton text="رجوع إلى لوحة الإدارة" />
      </div>

      <div className="import-header">
        <h2>استيراد منتجات من المتجر الخارجي</h2>
        <p>اختر التصنيف (ألعاب/تطبيقات) ثم اختر {titleLabel}، وارفع صورة موحدة (اختياري) ثم استورد الباقات داخلها</p>
      </div>

      {/* الإعدادات الرئيسية */}
      <div className="card settings-card">
        <div className="settings-row">
          <div className="target-selector">
            <label>التصنيف المستهدف:</label>
            <select value={selectedTargetCategoryId} onChange={e => setSelectedTargetCategoryId(e.target.value)}>
              <option value="games">ألعاب</option>
              <option value="apps">تطبيقات</option>
            </select>
          </div>
          <div className="markup-input">
            <Input label="نسبة الربح (%)" type="number" step="1" min="0" value={markupPercent} onChange={e => setMarkupPercent(Number(e.target.value))} />
            <p className="hint">السعر النهائي = السعر الأصلي × (1 + نسبة الربح/100)</p>
          </div>
          <Button onClick={() => setShowMappingManager(!showMappingManager)} variant="outline" size="sm"><FiFilter /> إدارة التصنيفات</Button>
        </div>
        {showMappingManager && (
          <CategoryMappingManager
            externalCategories={externalCategories}
            initialMappings={categoryMappings}
            initialHierarchicalConfig={hierarchicalConfig}
            onMappingChange={({ mappings, hierarchicalConfig: newConfig }) => {
              setCategoryMappings(mappings);
              setHierarchicalConfig(newConfig);
              showToast('تم تحديث الإعدادات', 'info');
            }}
          />
        )}
        <div className="global-image-section">
          <label>صورة عامة للقسم (تظهر في الباقات إذا لم ترفع صورة خاصة):</label>
          <div className="image-upload-row">
            <ImageUpload onUploadComplete={setGlobalCategoryImage} maxSizeMB={0.5} storagePath={`store_import/global/${selectedTargetCategoryId}`} label="رفع صورة" />
            {globalCategoryImage && (
              <div className="image-preview">
                <img src={globalCategoryImage} alt="قسم" />
                <button onClick={() => setGlobalCategoryImage('')} className="remove-btn"><FiX /></button>
              </div>
            )}
          </div>
          <Button onClick={saveCategoryImage} variant="secondary" size="sm"><FiSave /> حفظ صورة القسم</Button>
        </div>
      </div>

      {/* قائمة الألعاب/التطبيقات الحالية */}
      <div className="card parents-selection">
        <h4><FiFolder /> اختر {titleLabel} التي تريد إضافة الباقات إليها</h4>
        {parentItems.length === 0 ? (
          <p className="no-parents">لا توجد {titleLabel === 'اللعبة' ? 'ألعاب' : 'تطبيقات'} مضافة بعد. قم بإضافتها من لوحة الإدارة أولاً.</p>
        ) : (
          <div className="parents-grid">
            {parentItems.map(parent => (
              <div
                key={parent.id}
                className={`parent-card ${selectedParentId === parent.id ? 'selected' : ''}`}
                onClick={() => setSelectedParentId(parent.id)}
              >
                <div className="parent-image">
                  {parent.imageUrl ? (
                    <img src={parent.imageUrl} alt={parent.name} loading="lazy" />
                  ) : (
                    <div className="parent-placeholder">{selectedTargetCategoryId === 'games' ? '🎮' : '📱'}</div>
                  )}
                </div>
                <div className="parent-info">
                  <h5>{parent.name}</h5>
                  <p className="parent-description">{parent.description?.slice(0, 60)}</p>
                  <span className="parent-product-count">📦 {parent.packageCount} باقة</span>
                </div>
                {selectedParentId === parent.id && <div className="parent-selected-badge">✓</div>}
              </div>
            ))}
          </div>
        )}
        {selectedParent && (
          <div className="selected-parent-details">
            <div className="selected-parent-header">
              <strong>القسم المختار:</strong> {selectedParent.name}
              <Button variant="outline" size="sm" onClick={() => { setSelectedParentId(null); setSelectedParentGlobalImage(''); }}>
                تغيير
              </Button>
            </div>
            <div className="parent-global-image">
              <label>صورة موحدة لجميع الباقات المستوردة لهذا القسم (اختياري):</label>
              <ImageUpload onUploadComplete={handleParentImageUpload} maxSizeMB={0.5} storagePath={`store_import/parent/${selectedParent.id}`} label="رفع صورة موحدة" />
              {selectedParentGlobalImage && (
                <div className="image-preview">
                  <img src={selectedParentGlobalImage} alt="صورة موحدة" />
                  <button onClick={() => setSelectedParentGlobalImage('')} className="remove-btn"><FiX /></button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* الفلترة وعرض المنتجات */}
      <div className="card filters-card">
        <div className="filters-header"><h4>فلترة المنتجات الخارجية</h4><Button onClick={resetFilters} variant="outline" size="sm"><FiRefreshCw /> إعادة ضبط</Button></div>
        <div className="filters-grid">
          <div className="filter-item search-box"><FiSearch className="search-icon" /><input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
          <div className="filter-item"><select value={filterExternalCategory} onChange={e => setFilterExternalCategory(e.target.value)}><option value="">كل التصنيفات الخارجية</option>{externalCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
          <div className="filter-item price-range"><input type="number" placeholder="الحد الأدنى" value={minPrice} onChange={e => setMinPrice(e.target.value)} /><span>-</span><input type="number" placeholder="الحد الأعلى" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} /></div>
          <div className="filter-item"><label className="checkbox-label"><input type="checkbox" checked={showOnlyPopular} onChange={e => setShowOnlyPopular(e.target.checked)} /> المميزة فقط</label></div>
          <div className="filter-item sort-controls"><select value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="name">الاسم</option><option value="price">السعر</option><option value="id">المعرف</option></select><button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="sort-order-btn">{sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />}</button></div>
        </div>
      </div>

      {/* شبكة المنتجات */}
      <div className="products-grid">
        {displayedProducts.map(product => {
          const isPopular = popularProducts.has(product.id);
          const imageUrl = selectedParentGlobalImage || productImages[product.id] || globalCategoryImage || product.image;
          return (
            <ProductCardItem
              key={product.id}
              product={product}
              markupPercent={markupPercent}
              isPopular={isPopular}
              imageUrl={imageUrl}
              onTogglePopular={togglePopular}
              onImportSingle={handleImportSingle}
              isImporting={importing[product.id]}
              selectedParentId={selectedParentId}
            />
          );
        })}
      </div>
      {hasMore && (
        <div className="load-more-button" style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Button onClick={loadMore} disabled={isLoadingMore} variant="secondary">
            {isLoadingMore ? 'جاري التحميل...' : `تحميل المزيد (${filteredAndSortedProducts.length - visibleCount} منتج متبقي)`}
          </Button>
        </div>
      )}

      {selectedParentId && filteredAndSortedProducts.length > 0 && (
        <div className="import-all-button">
          <Button onClick={handleImportAll} variant="secondary" disabled={loading}>
            استيراد جميع المنتجات المعروضة كباقات ({filteredAndSortedProducts.length})
          </Button>
        </div>
      )}
    </div>
  );
}
// src/components/AdminCoponent/ExternalStoreImport/ExternalStoreImport.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import Button from '../../GeneralComponents/Button/Button';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import { FiSearch, FiArrowUp, FiArrowDown, FiStar, FiFilter, FiSave, FiRefreshCw, FiX } from 'react-icons/fi';

// المكونات الجديدة
import ImportSettings from './components/ImportSettings/ImportSettings';
import ParentSelector from './components/ParentSelector/ParentSelector';
import ProductFilters from './components/ProductFilters/ProductFilters';
import ProductGrid from './components/ProductGrid/ProductGrid';

import { useParentItems } from './hooks/useParentItems';
import { useProducts } from './hooks/useProducts';
import { getQuantityType } from './utils/helpers';

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
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    setSelectedParentId(null);
    setSelectedParentGlobalImage('');
  }, [selectedTargetCategoryId]);

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

  // منطق الاستيراد
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

  if (productsLoading && products.length === 0) return <div className="import-loading">جاري تحميل البيانات...</div>;

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

      <ImportSettings
        selectedTargetCategoryId={selectedTargetCategoryId}
        setSelectedTargetCategoryId={setSelectedTargetCategoryId}
        markupPercent={markupPercent}
        setMarkupPercent={setMarkupPercent}
        showMappingManager={showMappingManager}
        setShowMappingManager={setShowMappingManager}
        externalCategories={externalCategories}
        categoryMappings={categoryMappings}
        setCategoryMappings={setCategoryMappings}
        hierarchicalConfig={hierarchicalConfig}
        setHierarchicalConfig={setHierarchicalConfig}
        globalCategoryImage={globalCategoryImage}
        setGlobalCategoryImage={setGlobalCategoryImage}
        saveCategoryImage={saveCategoryImage}
      />

      <ParentSelector
        parentItems={parentItems}
        selectedParentId={selectedParentId}
        setSelectedParentId={setSelectedParentId}
        selectedParentGlobalImage={selectedParentGlobalImage}
        setSelectedParentGlobalImage={setSelectedParentGlobalImage}
        titleLabel={titleLabel}
      />

      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterExternalCategory={filterExternalCategory}
        setFilterExternalCategory={setFilterExternalCategory}
        externalCategories={externalCategories}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        showOnlyPopular={showOnlyPopular}
        setShowOnlyPopular={setShowOnlyPopular}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        resetFilters={resetFilters}
      />

      <ProductGrid
        displayedProducts={displayedProducts}
        markupPercent={markupPercent}
        popularProducts={popularProducts}
        togglePopular={togglePopular}
        selectedParentId={selectedParentId}
        handleImportSingle={handleImportSingle}
        importing={importing}
        selectedParentGlobalImage={selectedParentGlobalImage}
        productImages={productImages}
        globalCategoryImage={globalCategoryImage}
        hasMore={hasMore}
        loadMore={loadMore}
        isLoadingMore={isLoadingMore}
        filteredAndSortedProducts={filteredAndSortedProducts}
        visibleCount={visibleCount}
        handleImportAll={handleImportAll}
        loading={loading}
      />
    </div>
  );
}
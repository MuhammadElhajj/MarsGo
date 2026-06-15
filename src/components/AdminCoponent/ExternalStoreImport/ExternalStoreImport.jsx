// src/components/AdminCoponent/ExternalStoreImport/ExternalStoreImport.jsx
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import { fetchStoreProducts } from '../../../services/apiStoreService';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import {
  FiSearch, FiArrowUp, FiArrowDown, FiStar, FiFilter, FiSave, FiRefreshCw, FiX,
  FiPlus, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiFolder, FiSettings,
} from 'react-icons/fi';
import './ExternalStoreImport.css';

// -------------------- Helper --------------------
function generateSlug(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

// -------------------- SubCategory Manager (للتصنيفات الأخرى) --------------------
function SubCategoryManager({ categoryId, onSubCategoriesChange }) {
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    imageUrl: '',
    description: '',
    available: true,
  });

  const loadSubCategories = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      const q = query(collection(db, `subCategories_${categoryId}`), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubCategories(items);
      if (onSubCategoriesChange) onSubCategoriesChange(items);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل الأقسام الفرعية', 'error');
    } finally {
      setLoading(false);
    }
  }, [categoryId, onSubCategoriesChange]);

  useEffect(() => { loadSubCategories(); }, [loadSubCategories]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const saveSubCategory = async () => {
    if (!formData.name.trim()) {
      showToast('الاسم مطلوب', 'error');
      return;
    }
    if (!formData.slug.trim()) {
      showToast('الـ slug مطلوب', 'error');
      return;
    }
    const existing = subCategories.find(sc => sc.slug === formData.slug && sc.id !== editing);
    if (existing) {
      showToast('هذا الـ slug موجود مسبقاً', 'error');
      return;
    }
    const id = editing || formData.slug;
    const dataToSave = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl,
      available: formData.available,
      order: subCategories.length,
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, `subCategories_${categoryId}`, id), dataToSave, { merge: true });
      showToast(editing ? 'تم التعديل' : 'تمت الإضافة', 'success');
      setEditing(null);
      setFormData({ name: '', slug: '', imageUrl: '', description: '', available: true });
      loadSubCategories();
    } catch (err) {
      console.error(err);
      showToast('فشل الحفظ', 'error');
    }
  };

  const deleteSubCategory = async (id, name) => {
    if (!window.confirm(`حذف "${name}"؟ سيؤثر على المنتجات المرتبطة.`)) return;
    try {
      await deleteDoc(doc(db, `subCategories_${categoryId}`, id));
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('parentId', '==', id));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await setDoc(doc(db, 'products', docSnap.id), { parentId: null }, { merge: true });
      }
      showToast('تم الحذف', 'success');
      loadSubCategories();
    } catch (err) {
      console.error(err);
      showToast('فشل الحذف', 'error');
    }
  };

  const editSubCategory = (item) => {
    setEditing(item.id);
    setFormData({
      name: item.name,
      slug: item.slug,
      imageUrl: item.imageUrl || '',
      description: item.description || '',
      available: item.available !== false,
    });
  };

  const toggleAvailable = async (item) => {
    try {
      await setDoc(doc(db, `subCategories_${categoryId}`, item.id), {
        available: !item.available,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      showToast(`${item.name} ${!item.available ? 'تم تفعيله' : 'تم تعطيله'}`, 'success');
      loadSubCategories();
    } catch (err) {
      console.error(err);
      showToast('فشل التحديث', 'error');
    }
  };

  if (loading) return <div className="loading-placeholder">⏳ جاري التحميل...</div>;

  return (
    <div className="subcategory-manager card">
      <h4><FiFolder /> إدارة الأقسام الفرعية ({categoryId === 'games' ? 'ألعاب' : categoryId === 'apps' ? 'تطبيقات' : 'خدمات'})</h4>
      <div className="subcategory-form">
        <Input placeholder="الاسم (مثال: ببجي عالمي)" value={formData.name} onChange={handleNameChange} />
        <Input placeholder="Slug (للرابط)" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })} />
        <Input placeholder="وصف قصير" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        <ImageUpload onUploadComplete={(url) => setFormData({ ...formData, imageUrl: url })} maxSizeMB={0.5} storagePath={`subcategories/${categoryId}`} label="صورة" />
        <label className="checkbox-label"><input type="checkbox" checked={formData.available} onChange={(e) => setFormData({ ...formData, available: e.target.checked })} /> متاح</label>
        <div className="form-actions">
          <Button onClick={saveSubCategory} size="sm"><FiSave /> {editing ? 'تعديل' : 'إضافة'}</Button>
          {editing && <Button onClick={() => { setEditing(null); setFormData({ name: '', slug: '', imageUrl: '', description: '', available: true }); }} variant="outline" size="sm">إلغاء</Button>}
        </div>
      </div>
      <div className="subcategories-list">
        {subCategories.map(item => (
          <div key={item.id} className="subcategory-item">
            {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="subcat-thumb" />}
            <div className="subcat-info">
              <strong>{item.name}</strong>
              <span className="slug">{item.slug}</span>
              {item.description && <p>{item.description}</p>}
            </div>
            <div className="subcat-actions">
              <button onClick={() => toggleAvailable(item)} className="icon-btn">{item.available ? <FiToggleRight color="green" /> : <FiToggleLeft />}</button>
              <button onClick={() => editSubCategory(item)} className="icon-btn"><FiEdit /></button>
              <button onClick={() => deleteSubCategory(item.id, item.name)} className="icon-btn delete"><FiTrash2 /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------- CategoryMappingManager --------------------
function CategoryMappingManager({ externalCategories, onMappingChange, initialMappings, initialHierarchicalConfig }) {
  const [mappings, setMappings] = useState(initialMappings || {});
  const [hierarchicalConfig, setHierarchicalConfig] = useState(
    initialHierarchicalConfig || { games: { separator: ' - ' }, apps: { separator: ' - ' } }
  );
  const [loading, setLoading] = useState(false);
  const internalOptions = [
    { value: 'games', label: 'ألعاب' }, { value: 'apps', label: 'تطبيقات' },
    { value: 'services', label: 'خدمات' }, { value: 'topup', label: 'شحن رصيد' }, { value: 'crypto', label: 'عملات رقمية' }
  ];
  const saveSettings = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'config', 'categoryMappings'), mappings);
      await setDoc(doc(db, 'config', 'hierarchicalConfig'), hierarchicalConfig);
      showToast('تم حفظ إعدادات التصنيف', 'success');
      if (onMappingChange) onMappingChange({ mappings, hierarchicalConfig });
    } catch (err) { showToast('فشل الحفظ', 'error'); }
    setLoading(false);
  };
  return (
    <div className="mapping-manager card">
      <h4><FiSettings /> تعيين التصنيفات الخارجية</h4>
      <div className="mapping-grid">
        {externalCategories.map(cat => (
          <div key={cat} className="mapping-row">
            <span className="external-cat">{cat}</span>
            <select value={mappings[cat] || 'services'} onChange={(e) => setMappings({ ...mappings, [cat]: e.target.value })}>
              {internalOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        ))}
      </div>
      <h4>إعدادات الفاصل</h4>
      <div className="hierarchical-config">
        <Input label="ألعاب - الفاصل" value={hierarchicalConfig.games?.separator || ' - '} onChange={(e) => setHierarchicalConfig({ ...hierarchicalConfig, games: { separator: e.target.value } })} />
        <Input label="تطبيقات - الفاصل" value={hierarchicalConfig.apps?.separator || ' - '} onChange={(e) => setHierarchicalConfig({ ...hierarchicalConfig, apps: { separator: e.target.value } })} />
      </div>
      <Button onClick={saveSettings} disabled={loading} variant="secondary" size="sm"><FiSave /> حفظ</Button>
    </div>
  );
}

// -------------------- مكون بطاقة المنتج المحسن (memoized) --------------------
const ProductCardItem = memo(({ 
  product, 
  markupPercent, 
  isPopular, 
  imageUrl, 
  onTogglePopular, 
  onImportSingle, 
  isImporting,
  selectedParentId 
}) => {
  const finalPrice = product.price * (1 + markupPercent / 100);
  const [localImageUrl, setLocalImageUrl] = useState(imageUrl);

  const handleImageUpload = (url) => {
    setLocalImageUrl(url);
    // إعلام المكون الرئيسي بتحديث الصورة (نمرر url مع المعرّف)
    onTogglePopular(product.id, url);
  };

  const handleTogglePopular = () => {
    onTogglePopular(product.id);
  };

  return (
    <div className="product-card">
      <div className="product-card__image">
        {localImageUrl ? <img src={localImageUrl} alt={product.name} loading="lazy" /> : <div className="image-placeholder">📦</div>}
        <div className="image-upload-wrapper">
          <ImageUpload 
            onUploadComplete={handleImageUpload} 
            maxSizeMB={0.5} 
            storagePath={`store_import/products/${product.id}`} 
            label="صورة خاصة" 
            className="small-upload" 
          />
        </div>
      </div>
      <div className="product-card__info">
        <h3 title={product.name}>{product.name}</h3>
        <span className="category-badge">{product.category_name || 'عام'}</span>
        <div className="prices">
          <span className="original-price">{product.price} $</span>
          <span className="final-price">{finalPrice.toFixed(2)} $</span>
        </div>
        <div className="stock">المخزون: {product.stock ?? 'غير محدد'}</div>
      </div>
      <div className="product-card__actions">
        <button className={`popular-btn ${isPopular ? 'active' : ''}`} onClick={handleTogglePopular}>
          <FiStar /> {isPopular ? 'مميز' : 'تمييز'}
        </button>
        <Button onClick={() => onImportSingle(product)} disabled={!selectedParentId || isImporting}>
          {isImporting ? 'جاري...' : 'استيراد كباقة'}
        </Button>
      </div>
    </div>
  );
});

// -------------------- المكون الرئيسي --------------------
export default function ExternalStoreImport() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState({});
  const [markupPercent, setMarkupPercent] = useState(10);
  const [selectedTargetCategoryId, setSelectedTargetCategoryId] = useState('games');
  const [globalCategoryImage, setGlobalCategoryImage] = useState('');
  const [productImages, setProductImages] = useState({});
  const [popularProducts, setPopularProducts] = useState(new Set());
  const [categoryMappings, setCategoryMappings] = useState({});
  const [hierarchicalConfig, setHierarchicalConfig] = useState({ games: { separator: ' - ' }, apps: { separator: ' - ' } });
  const [showMappingManager, setShowMappingManager] = useState(false);

  const [parentItems, setParentItems] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedParentGlobalImage, setSelectedParentGlobalImage] = useState('');

  const [visibleCount, setVisibleCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterExternalCategory, setFilterExternalCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);

  // --- جلب الألعاب/التطبيقات ---
  const loadParentItems = useCallback(async () => {
    if (selectedTargetCategoryId !== 'games' && selectedTargetCategoryId !== 'apps') return;
    try {
      const collectionName = selectedTargetCategoryId;
      const q = query(collection(db, collectionName), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const counts = {};
      for (const item of items) {
        const packagesRef = collection(db, collectionName, item.id, 'packages');
        const packagesSnap = await getDocs(packagesRef);
        counts[item.id] = packagesSnap.size;
      }

      const itemsWithCounts = items.map(item => ({
        ...item,
        packageCount: counts[item.id] || 0,
      }));
      setParentItems(itemsWithCounts);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل الألعاب/التطبيقات', 'error');
    }
  }, [selectedTargetCategoryId]);

  useEffect(() => {
    if (selectedTargetCategoryId === 'games' || selectedTargetCategoryId === 'apps') {
      loadParentItems();
    } else {
      setParentItems([]);
    }
    setSelectedParentId(null);
    setSelectedParentGlobalImage('');
  }, [selectedTargetCategoryId, loadParentItems]);

  // --- جلب المنتجات الخارجية ---
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStoreProducts();
      setProducts(data);
      setProductImages({});
      setGlobalCategoryImage('');
      setPopularProducts(new Set());
      setVisibleCount(50);
    } catch (err) { showToast('فشل تحميل المنتجات', 'error'); }
    finally { setLoading(false); }
  }, []);

  const loadMappingSettings = useCallback(async () => {
    try {
      const mappingsDoc = await getDoc(doc(db, 'config', 'categoryMappings'));
      if (mappingsDoc.exists()) setCategoryMappings(mappingsDoc.data());
      const hierarchicalDoc = await getDoc(doc(db, 'config', 'hierarchicalConfig'));
      if (hierarchicalDoc.exists()) setHierarchicalConfig(hierarchicalDoc.data());
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadProducts(); loadMappingSettings(); }, []);

  // --- البيانات المشتقة ---
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

  // --- منطق الاستيراد ---
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      batch.set(packageDocRef, packageData, { merge: true });
      addedCount++;
    }

    try {
      await batch.commit();
      showToast(`تم استيراد ${addedCount} باقة بنجاح`, 'success');
      loadParentItems();
      return true;
    } catch (err) {
      console.error(err);
      showToast(`فشل الاستيراد: ${err.message}`, 'error');
      return false;
    }
  }, [selectedTargetCategoryId, selectedParentId, markupPercent, selectedParentGlobalImage, productImages, globalCategoryImage, popularProducts, loadParentItems]);

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

  // --- معالجات واجهة المستخدم ---
  const handleParentImageUpload = useCallback((url) => {
    setSelectedParentGlobalImage(url);
    showToast('تم رفع الصورة الموحدة للباقات', 'success');
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

  const saveCategoryImage = useCallback(async () => {
    if (selectedTargetCategoryId && globalCategoryImage) {
      await setDoc(doc(db, 'categoryImages', selectedTargetCategoryId), { imageUrl: globalCategoryImage, updatedAt: new Date().toISOString() }, { merge: true });
      showToast('تم حفظ صورة القسم', 'success');
    }
  }, [selectedTargetCategoryId, globalCategoryImage]);

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

  // --- العرض ---
  if (loading && products.length === 0) return <div className="import-loading">جاري تحميل البيانات...</div>;

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
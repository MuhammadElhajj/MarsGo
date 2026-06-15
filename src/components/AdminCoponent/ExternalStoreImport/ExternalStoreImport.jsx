// src/components/AdminCoponent/ExternalStoreImport/ExternalStoreImport.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { app, db } from '../../../firebase';
import { fetchStoreProducts } from '../../../services/apiStoreService';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import {
  FiSearch, FiArrowUp, FiArrowDown, FiStar, FiFilter, FiSave, FiRefreshCw, FiX,
  FiPlus, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiFolder, FiSettings,
} from 'react-icons/fi';
import './ExternalStoreImport.css';

// -------------------- Helper --------------------
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function extractParentName(productName, separator = ' - ') {
  if (!productName) return null;
  if (productName.includes(separator)) {
    return productName.split(separator)[0].trim();
  }
  return null;
}

// -------------------- SubCategory Manager (محسّن مع slug) --------------------
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
    // التحقق من تفرد الـ slug
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
      // تحديث المنتجات المرتبطة (اختياري: إزالة parentId)
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

// -------------------- CategoryMappingManager (كما هو مع تحسين بسيط) --------------------
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

// -------------------- Main Component --------------------
export default function ExternalStoreImport() {
  // Core states
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

  // SubCategories (parents)
  const [subCategories, setSubCategories] = useState([]);
  const [productSubCategoryMap, setProductSubCategoryMap] = useState({}); // productId -> parentId (slug)

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterExternalCategory, setFilterExternalCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);

  // --- Data Loading ---
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStoreProducts();
      setProducts(data);
      setProductImages({});
      setGlobalCategoryImage('');
      setPopularProducts(new Set());
      setProductSubCategoryMap({});
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

  const loadSubCategoriesFromFirestore = useCallback(async () => {
    if (!selectedTargetCategoryId) return;
    try {
      const q = query(collection(db, `subCategories_${selectedTargetCategoryId}`), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubCategories(items.filter(i => i.available !== false));
    } catch (err) { console.error(err); }
  }, [selectedTargetCategoryId]);

  useEffect(() => { loadProducts(); loadMappingSettings(); }, []);
  useEffect(() => { loadSubCategoriesFromFirestore(); }, [loadSubCategoriesFromFirestore]);

  // --- Derived Data ---
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

  // --- Import Logic (using parentId) ---
  const importToDynamicProducts = useCallback(async (productsToImport) => {
    if (!selectedTargetCategoryId) { showToast('اختر التصنيف المستهدف', 'error'); return false; }
    const productsForImport = productsToImport.map(prod => {
      let parentId = productSubCategoryMap[prod.id];
      if (!parentId && subCategories.length > 0) {
        const separator = hierarchicalConfig[selectedTargetCategoryId]?.separator || ' - ';
        const autoParentName = extractParentName(prod.name, separator);
        const matched = subCategories.find(sc => sc.name === autoParentName || sc.slug === autoParentName);
        if (matched) parentId = matched.id;
      }
      return {
        id: prod.id,
        name: prod.name,
        category_name: prod.category_name,
        price: prod.price,
        image: prod.image,
        stock: prod.stock,
        customImageUrl: productImages[prod.id] || null,
        subItemImageUrl: parentId ? (subCategories.find(sc => sc.id === parentId)?.imageUrl || null) : null,
        isPopular: popularProducts.has(prod.id),
        parentId: parentId,              // 🔥 إرسال parentId بدلاً من parentName
      };
    });
    const functionsInstance = getFunctions(app);
    const importFunc = httpsCallable(functionsInstance, 'importProductsFromExternal');
    try {
      const result = await importFunc({
        products: productsForImport,
        markupPercent,
        globalImageUrl: globalCategoryImage || null,
        targetCategoryId: selectedTargetCategoryId,
        categoryMappings,
        hierarchicalConfig,
      });
      return result.data.success;
    } catch (err) { showToast(`فشل الاستيراد: ${err.message}`, 'error'); return false; }
  }, [selectedTargetCategoryId, categoryMappings, hierarchicalConfig, productImages, popularProducts, markupPercent, globalCategoryImage, productSubCategoryMap, subCategories]);

  const handleImportSingle = async (product) => {
    if (!productSubCategoryMap[product.id]) { showToast('اختر القسم الفرعي أولاً', 'error'); return; }
    setImporting(prev => ({ ...prev, [product.id]: true }));
    const success = await importToDynamicProducts([product]);
    setImporting(prev => ({ ...prev, [product.id]: false }));
    if (success) showToast(`تم استيراد ${product.name}`, 'success');
  };

  const handleImportAll = async () => {
    const missing = filteredAndSortedProducts.filter(p => !productSubCategoryMap[p.id]);
    if (missing.length) { showToast(`يرجى ربط ${missing.length} منتج أولاً`, 'error'); return; }
    setLoading(true);
    const success = await importToDynamicProducts(filteredAndSortedProducts);
    setLoading(false);
    if (success) showToast(`تم استيراد ${filteredAndSortedProducts.length} منتج`, 'success');
  };

  // --- UI Handlers ---
  const updateProductSubCategory = (productId, parentId) => setProductSubCategoryMap(prev => ({ ...prev, [productId]: parentId }));
  const handleProductImageUpload = (productId, url) => setProductImages(prev => ({ ...prev, [productId]: url }));
  const handleGlobalImageUpload = (url) => { setGlobalCategoryImage(url); showToast('تم رفع الصورة العامة', 'success'); };
  const togglePopular = (productId) => setPopularProducts(prev => { const newSet = new Set(prev); newSet.has(productId) ? newSet.delete(productId) : newSet.add(productId); return newSet; });
  const resetFilters = () => { setSearchTerm(''); setFilterExternalCategory(''); setMinPrice(''); setMaxPrice(''); setShowOnlyPopular(false); setSortBy('name'); setSortOrder('asc'); };
  const saveCategoryImage = async () => { if (selectedTargetCategoryId && globalCategoryImage) { await setDoc(doc(db, 'categoryImages', selectedTargetCategoryId), { imageUrl: globalCategoryImage, updatedAt: new Date().toISOString() }, { merge: true }); showToast('تم حفظ صورة القسم', 'success'); } };

  // --- Render ---
  if (loading && products.length === 0) return <div className="import-loading">جاري تحميل البيانات...</div>;

  return (
    <div className="external-store-import" dir="rtl">
      <div className="import-header"><h2>استيراد منتجات من المتجر الخارجي</h2><p>إدارة التصنيفات، الأقسام الفرعية، ونسبة الربح</p></div>

      {/* إعدادات رئيسية */}
      <div className="card settings-card">
        <div className="settings-row">
          <div className="target-selector"><label>التصنيف المستهدف:</label><select value={selectedTargetCategoryId} onChange={e => setSelectedTargetCategoryId(e.target.value)}><option value="games">ألعاب</option><option value="apps">تطبيقات</option><option value="services">خدمات</option><option value="topup">شحن رصيد</option><option value="crypto">عملات رقمية</option></select></div>
          <div className="markup-input"><Input label="نسبة الربح (%)" type="number" step="1" min="0" value={markupPercent} onChange={e => setMarkupPercent(Number(e.target.value))} /><p className="hint">السعر النهائي = السعر الأصلي × (1 + نسبة الربح/100)</p></div>
          <Button onClick={() => setShowMappingManager(!showMappingManager)} variant="outline" size="sm"><FiFilter /> إدارة التصنيفات</Button>
        </div>
        {showMappingManager && <CategoryMappingManager externalCategories={externalCategories} initialMappings={categoryMappings} initialHierarchicalConfig={hierarchicalConfig} onMappingChange={({ mappings, hierarchicalConfig: newConfig }) => { setCategoryMappings(mappings); setHierarchicalConfig(newConfig); showToast('تم تحديث الإعدادات', 'info'); }} />}
        <SubCategoryManager categoryId={selectedTargetCategoryId} onSubCategoriesChange={setSubCategories} />
        <div className="global-image-section"><label>صورة عامة للقسم:</label><div className="image-upload-row"><ImageUpload onUploadComplete={handleGlobalImageUpload} maxSizeMB={0.5} storagePath={`store_import/global/${selectedTargetCategoryId}`} label="رفع صورة" />{globalCategoryImage && (<div className="image-preview"><img src={globalCategoryImage} alt="قسم" /><button onClick={() => setGlobalCategoryImage('')} className="remove-btn"><FiX /></button></div>)}</div><Button onClick={saveCategoryImage} variant="secondary" size="sm"><FiSave /> حفظ صورة القسم</Button></div>
      </div>

      {/* الفلترة */}
      <div className="card filters-card"><div className="filters-header"><h4>فلترة المنتجات</h4><Button onClick={resetFilters} variant="outline" size="sm"><FiRefreshCw /> إعادة ضبط</Button></div><div className="filters-grid"><div className="filter-item search-box"><FiSearch className="search-icon" /><input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><div className="filter-item"><select value={filterExternalCategory} onChange={e => setFilterExternalCategory(e.target.value)}><option value="">كل التصنيفات الخارجية</option>{externalCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div><div className="filter-item price-range"><input type="number" placeholder="الحد الأدنى" value={minPrice} onChange={e => setMinPrice(e.target.value)} /><span>-</span><input type="number" placeholder="الحد الأعلى" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} /></div><div className="filter-item"><label className="checkbox-label"><input type="checkbox" checked={showOnlyPopular} onChange={e => setShowOnlyPopular(e.target.checked)} /> المميزة فقط</label></div><div className="filter-item sort-controls"><select value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="name">الاسم</option><option value="price">السعر</option><option value="id">المعرف</option></select><button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="sort-order-btn">{sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />}</button></div></div></div>

      {/* شبكة المنتجات */}
      <div className="products-grid">
        {filteredAndSortedProducts.length === 0 ? <div className="no-results">لا توجد منتجات تطابق المعايير</div> :
          filteredAndSortedProducts.map(product => {
            const finalPrice = product.price * (1 + markupPercent / 100);
            const isPopular = popularProducts.has(product.id);
            const currentParentId = productSubCategoryMap[product.id] || '';
            const selectedParent = subCategories.find(sc => sc.id === currentParentId);
            const imageUrl = productImages[product.id] || globalCategoryImage || selectedParent?.imageUrl || product.image;
            return (
              <div key={product.id} className="product-card">
                <div className="product-card__image">{imageUrl ? <img src={imageUrl} alt={product.name} /> : <div className="image-placeholder">📦</div>}<div className="image-upload-wrapper"><ImageUpload onUploadComplete={(url) => handleProductImageUpload(product.id, url)} maxSizeMB={0.5} storagePath={`store_import/products/${product.id}`} label="صورة خاصة" className="small-upload" /></div></div>
                <div className="product-card__info"><h3 title={product.name}>{product.name}</h3><span className="category-badge">{product.category_name || 'عام'}</span><div className="subcategory-select"><label>ربط بالقسم الفرعي:</label><select value={currentParentId} onChange={e => updateProductSubCategory(product.id, e.target.value)} style={{ width: '100%', padding: '0.3rem', marginTop: '0.3rem' }}><option value="">-- اختر --</option>{subCategories.map(sc => (<option key={sc.id} value={sc.id}>{sc.name} {!sc.available ? '(غير متاح)' : ''}</option>))}</select></div><div className="prices"><span className="original-price">{product.price} $</span><span className="final-price">{finalPrice.toFixed(2)} $</span></div><div className="stock">المخزون: {product.stock ?? 'غير محدد'}</div></div>
                <div className="product-card__actions"><button className={`popular-btn ${isPopular ? 'active' : ''}`} onClick={() => togglePopular(product.id)}><FiStar /> {isPopular ? 'مميز' : 'تمييز'}</button><Button onClick={() => handleImportSingle(product)} disabled={!selectedTargetCategoryId || importing[product.id] || !currentParentId}>{importing[product.id] ? 'جاري...' : 'استيراد'}</Button></div>
              </div>
            );
          })}
      </div>
      {selectedTargetCategoryId && filteredAndSortedProducts.length > 0 && (<div className="import-all-button"><Button onClick={handleImportAll} variant="secondary" disabled={loading}>استيراد جميع المنتجات المعروضة ({filteredAndSortedProducts.length})</Button></div>)}
    </div>
  );
}
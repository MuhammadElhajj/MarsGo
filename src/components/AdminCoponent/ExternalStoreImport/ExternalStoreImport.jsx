// src/components/AdminCoponent/ExternalStoreImport/ExternalStoreImport.jsx
import { useState, useEffect, useMemo } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../firebase';
import { fetchStoreProducts } from '../../../services/apiStoreService';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import { FiSearch, FiArrowUp, FiArrowDown, FiStar } from 'react-icons/fi';
import './ExternalStoreImport.css';

export default function ExternalStoreImport() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('games'); // 'games', 'apps', 'services'
  const [markupPercent, setMarkupPercent] = useState(10);
  const [importing, setImporting] = useState({});
  
  // بحث وترتيب
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('');
  
  // تخزين الصور والعلامات المخصصة لكل منتج
  const [productImages, setProductImages] = useState({});
  const [popularProducts, setPopularProducts] = useState(new Set());
  
  // صورة عامة للتصنيف المحدد
  const [globalImageUrl, setGlobalImageUrl] = useState('');

  // قائمة التصنيفات الداخلية (الوجهات)
  const categoryOptions = [
    { id: 'games', name: '🎮 ألعاب' },
    { id: 'apps', name: '📱 تطبيقات' },
    { id: 'services', name: '🛠️ خدمات' }
  ];

  // جلب المنتجات من المتجر الخارجي
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchStoreProducts();
      setProducts(data);
      setProductImages({});
      setPopularProducts(new Set());
      setGlobalImageUrl('');
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل المنتجات من المتجر الخارجي', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // التصنيفات الفريدة من المنتجات الخارجية (للفلتر)
  const externalCategories = useMemo(() => {
    const cats = new Set();
    products.forEach(p => {
      if (p.category_name) cats.add(p.category_name);
    });
    return ['الكل', ...Array.from(cats)];
  }, [products]);

  // فلترة + بحث + ترتيب (بدون فلتر الوجهة القديم)
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];
    if (filterCategory && filterCategory !== 'الكل') {
      filtered = filtered.filter(p => p.category_name === filterCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.id.toString().includes(term)
      );
    }
    filtered.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortBy === 'price') {
        valA = a.price;
        valB = b.price;
      } else {
        valA = a.id;
        valB = b.id;
      }
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });
    return filtered;
  }, [products, filterCategory, searchTerm, sortBy, sortOrder]);

  // دالة استيراد المنتجات (مرنة وديناميكية)
  const importToDynamicProducts = async (productsToImport) => {
    if (!selectedCategoryId) {
      showToast('يرجى اختيار تصنيف الوجهة', 'error');
      return false;
    }

    const productsForImport = productsToImport.map(prod => ({
      id: prod.id,
      name: prod.name,
      category_name: prod.category_name,
      price: prod.price,
      image: prod.image,
      stock: prod.stock,
      customImageUrl: productImages[prod.id] || null,
      isPopular: popularProducts.has(prod.id),
    }));

    const functionsInstance = getFunctions(app);
    const importFunc = httpsCallable(functionsInstance, 'importProductsFromExternal');

    try {
      const result = await importFunc({
        products: productsForImport,
        markupPercent,
        globalImageUrl: globalImageUrl || null,
        targetCategoryId: selectedCategoryId   // نرسل التصنيف الداخلي مباشرة
      });
      return result.data.success;
    } catch (err) {
      console.error(err);
      showToast(`فشل الاستيراد: ${err.message}`, 'error');
      return false;
    }
  };

  const handleImportSingle = async (product) => {
    setImporting(prev => ({ ...prev, [product.id]: true }));
    const success = await importToDynamicProducts([product]);
    setImporting(prev => ({ ...prev, [product.id]: false }));
    if (success) showToast(`تم استيراد المنتج ${product.name} بنجاح`, 'success');
  };

  const handleImportAll = async () => {
    if (filteredAndSortedProducts.length === 0) {
      showToast('لا توجد منتجات للاستيراد', 'error');
      return;
    }
    setLoading(true);
    const success = await importToDynamicProducts(filteredAndSortedProducts);
    setLoading(false);
    if (success) showToast(`تم استيراد ${filteredAndSortedProducts.length} منتج بنجاح`, 'success');
  };

  const handleImageUpload = (productId, url) => {
    setProductImages(prev => ({ ...prev, [productId]: url }));
  };

  const handleGlobalImageUpload = (url) => {
    setGlobalImageUrl(url);
    showToast('تم رفع الصورة العامة للتصنيف بنجاح', 'success');
  };

  const togglePopular = (productId) => {
    setPopularProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

  if (loading) return <div className="import-loading">⏳ جاري تحميل البيانات...</div>;

  return (
    <div className="external-store-import" dir="rtl">
      <div className="import-header">
        <h2>📦 استيراد منتجات من المتجر الخارجي</h2>
        <p>اختر التصنيف المستهدف، نسبة الربح، الصور، ثم استورد المنتجات</p>
      </div>

      {/* إعدادات الاستيراد */}
      <div className="import-settings card">
        <div className="settings-row">
          <div className="target-selector">
            <label>اختر التصنيف المستهدف:</label>
            <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
              {categoryOptions.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="markup-input">
            <Input
              label="نسبة الربح (%)"
              type="number"
              step="1"
              min="0"
              value={markupPercent}
              onChange={(e) => setMarkupPercent(Number(e.target.value))}
            />
            <p className="hint">السعر النهائي = السعر الأصلي × (1 + نسبة الربح/100)</p>
          </div>
        </div>

        {/* رفع صورة عامة للتصنيف */}
        <div className="global-image-upload">
          <label>صورة عامة لهذا التصنيف (تطبق على جميع المنتجات المستوردة ما لم ترفع صورة خاصة):</label>
          <div className="global-upload-wrapper">
            <ImageUpload
              onUploadComplete={handleGlobalImageUpload}
              maxSizeMB={0.5}
              storagePath={`store_import/global/${selectedCategoryId}`}
              label="رفع صورة عامة"
            />
            {globalImageUrl && (
              <div className="global-preview">
                <img src={globalImageUrl} alt="الصورة العامة" />
                <button onClick={() => setGlobalImageUrl('')} className="remove-global">إزالة</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* أدوات البحث والفلترة */}
      <div className="search-filter-bar card">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="ابحث باسم المنتج أو معرفه..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-sort">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            {externalCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">الترتيب حسب الاسم</option>
            <option value="price">الترتيب حسب السعر</option>
            <option value="id">الترتيب حسب المعرف</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="sort-order-btn">
            {sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />}
            {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
          </button>
        </div>
      </div>

      {/* شبكة المنتجات */}
      <div className="products-grid">
        {filteredAndSortedProducts.length === 0 ? (
          <div className="no-results">لا توجد منتجات تطابق المعايير</div>
        ) : (
          filteredAndSortedProducts.map(product => {
            const finalPrice = product.price * (1 + markupPercent / 100);
            const isPopular = popularProducts.has(product.id);
            const imageUrl = productImages[product.id] || globalImageUrl;
            return (
              <div key={product.id} className="product-card">
                <div className="product-card__image">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} />
                  ) : (
                    <div className="image-placeholder">🖼️</div>
                  )}
                  <div className="image-upload-wrapper">
                    <ImageUpload
                      onUploadComplete={(url) => handleImageUpload(product.id, url)}
                      maxSizeMB={0.5}
                      storagePath={`store_import/${product.id}`}
                      label="صورة خاصة"
                      className="small-upload"
                    />
                  </div>
                </div>
                <div className="product-card__info">
                  <h3>{product.name}</h3>
                  <span className="category">{product.category_name || 'عام'}</span>
                  <div className="prices">
                    <span className="original-price">{product.price} $</span>
                    <span className="final-price">{finalPrice.toFixed(2)} $</span>
                  </div>
                  <div className="stock">المخزون: {product.stock ?? 'غير محدد'}</div>
                </div>
                <div className="product-card__actions">
                  <button
                    className={`popular-btn ${isPopular ? 'active' : ''}`}
                    onClick={() => togglePopular(product.id)}
                    title={isPopular ? 'إزالة من الأكثر طلباً' : 'تعيين كأكثر طلباً'}
                  >
                    <FiStar /> {isPopular ? 'مميز' : 'تمييز'}
                  </button>
                  <Button
                    onClick={() => handleImportSingle(product)}
                    disabled={!selectedCategoryId || importing[product.id]}
                    variant="primary"
                  >
                    {importing[product.id] ? 'جاري...' : 'استيراد'}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedCategoryId && filteredAndSortedProducts.length > 0 && (
        <div className="import-all-button">
          <Button onClick={handleImportAll} variant="secondary" disabled={loading}>
            📦 استيراد جميع المنتجات المعروضة ({filteredAndSortedProducts.length})
          </Button>
        </div>
      )}
    </div>
  );
}
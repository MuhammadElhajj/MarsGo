// src/components/AdminCoponent/ExternalStoreImport/ExternalStoreImport.jsx
import { useState, useEffect, useMemo } from 'react';
import { fetchStoreProducts } from '../../../services/apiStoreService';
import { useGames } from '../../../context/GamesContext';
import { useApps } from '../../../context/AppsContext';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import { FiSearch, FiArrowUp, FiArrowDown, FiStar, FiImage, FiGlobe } from 'react-icons/fi';
import './ExternalStoreImport.css';

export default function ExternalStoreImport() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedAppId, setSelectedAppId] = useState('');
  const [markupPercent, setMarkupPercent] = useState(10);
  const [importing, setImporting] = useState({});
  
  // بحث وترتيب
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterByTarget, setFilterByTarget] = useState(false); // فلتر حسب الوجهة المحددة
  
  // تخزين الصور والعلامات المخصصة لكل منتج
  const [productImages, setProductImages] = useState({});
  const [popularProducts, setPopularProducts] = useState(new Set());
  
  // صورة عامة للوجهة المحددة
  const [targetGlobalImage, setTargetGlobalImage] = useState('');
  const [globalImageUrl, setGlobalImageUrl] = useState('');
  const [uploadingGlobal, setUploadingGlobal] = useState(false);

  const { games, loading: gamesLoading } = useGames();
  const { apps, loading: appsLoading } = useApps();
  const { addPackage: addGamePackage } = useGames();
  const { addPackage: addAppPackage } = useApps();

  // جلب المنتجات
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

  // التصنيفات الفريدة
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach(p => {
      if (p.category_name) cats.add(p.category_name);
    });
    return ['الكل', ...Array.from(cats)];
  }, [products]);

  // الحصول على اسم الوجهة المحددة (للفلتر)
  const selectedTargetName = useMemo(() => {
    if (selectedGameId) {
      const game = games.find(g => g.id === selectedGameId);
      return game?.name || '';
    }
    if (selectedAppId) {
      const app = apps.find(a => a.id === selectedAppId);
      return app?.name || '';
    }
    return '';
  }, [selectedGameId, selectedAppId, games, apps]);

  // فلترة + بحث + ترتيب + فلتر الوجهة
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];
    
    // فلتر التصنيف
    if (filterCategory && filterCategory !== 'الكل') {
      filtered = filtered.filter(p => p.category_name === filterCategory);
    }
    
    // فلتر حسب الوجهة المحددة (مطابقة اسم الفئة مع اسم اللعبة/التطبيق)
    if (filterByTarget && selectedTargetName) {
      const targetLower = selectedTargetName.toLowerCase();
      filtered = filtered.filter(p => 
        p.category_name?.toLowerCase().includes(targetLower) || 
        targetLower.includes(p.category_name?.toLowerCase())
      );
    }
    
    // بحث
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.id.toString().includes(term)
      );
    }
    
    // ترتيب
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
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });
    
    return filtered;
  }, [products, filterCategory, searchTerm, sortBy, sortOrder, filterByTarget, selectedTargetName]);

  // استيراد قائمة منتجات
  const importProducts = async (productsToImport) => {
    const targetId = selectedGameId || selectedAppId;
    const targetType = selectedGameId ? 'game' : (selectedAppId ? 'app' : null);
    if (!targetType) {
      showToast('يرجى اختيار لعبة أو تطبيق أولاً', 'error');
      return false;
    }
    const addPackageFunc = targetType === 'game' ? addGamePackage : addAppPackage;

    let successCount = 0;
    let failCount = 0;

    for (const product of productsToImport) {
      const finalPrice = product.price * (1 + markupPercent / 100);
      // أولوية الصورة: صورة المنتج الخاصة > الصورة العامة للوجهة > فارغ
      const finalImageUrl = productImages[product.id] || (filterByTarget ? globalImageUrl : '');
      const packageData = {
        name: product.name,
        price: finalPrice.toFixed(2),
        currency: 'USD',
        discount: 0,
        type: 'normal',
        order: 0,
        imageUrl: finalImageUrl,
        note: `منتج مستورد: ${product.category_name || ''}`,
        externalProductId: product.id,
        externalAnyKey: '',
        isPopular: popularProducts.has(product.id),
      };
      setImporting(prev => ({ ...prev, [product.id]: true }));
      try {
        await addPackageFunc(targetId, packageData);
        successCount++;
      } catch (err) {
        console.error(err);
        failCount++;
      } finally {
        setImporting(prev => ({ ...prev, [product.id]: false }));
      }
    }
    if (successCount > 0) showToast(`تم استيراد ${successCount} منتج بنجاح.`, 'success');
    if (failCount > 0) showToast(`فشل استيراد ${failCount} منتج.`, 'error');
    return successCount > 0;
  };

  const handleImportSingle = async (product) => {
    await importProducts([product]);
  };

  // تحديث صورة المنتج (خاصة)
  const handleImageUpload = (productId, url) => {
    setProductImages(prev => ({ ...prev, [productId]: url }));
  };

  // رفع الصورة العامة للوجهة
  const handleGlobalImageUpload = (url) => {
    setGlobalImageUrl(url);
    setTargetGlobalImage(url);
    showToast('تم رفع الصورة العامة للوجهة بنجاح', 'success');
  };

  // تبديل علامة "الأكثر طلباً"
  const togglePopular = (productId) => {
    setPopularProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

  if (loading || gamesLoading || appsLoading) return <div className="import-loading">⏳ جاري تحميل البيانات...</div>;

  const targetSelected = !!(selectedGameId || selectedAppId);

  return (
    <div className="external-store-import" dir="rtl">
      <div className="import-header">
        <h2>📦 استيراد منتجات من المتجر الخارجي</h2>
        <p>عرض جميع المنتجات المتاحة، إضافة نسبة ربح، تخصيص الصور، وتمييز الأكثر طلباً</p>
      </div>

      {/* إعدادات الاستيراد */}
      <div className="import-settings card">
        <div className="settings-row">
          <div className="target-selector">
            <label>اختر الوجهة:</label>
            <select value={selectedGameId} onChange={(e) => { setSelectedGameId(e.target.value); setSelectedAppId(''); setGlobalImageUrl(''); }}>
              <option value="">-- لعبة --</option>
              {games.map(game => <option key={game.id} value={game.id}>{game.name}</option>)}
            </select>
            <select value={selectedAppId} onChange={(e) => { setSelectedAppId(e.target.value); setSelectedGameId(''); setGlobalImageUrl(''); }}>
              <option value="">-- تطبيق --</option>
              {apps.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}
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

        {/* رفع صورة عامة للوجهة المحددة */}
        {targetSelected && (
          <div className="global-image-upload">
            <label>صورة عامة لهذه الوجهة (تطبق على جميع منتجاتها عند الاستيراد):</label>
            <div className="global-upload-wrapper">
              <ImageUpload
                onUploadComplete={handleGlobalImageUpload}
                maxSizeMB={0.5}
                storagePath={`store_import/global/${selectedGameId || selectedAppId}`}
                label="رفع صورة عامة"
              />
              {globalImageUrl && (
                <div className="global-preview">
                  <img src={globalImageUrl} alt="الصورة العامة" />
                  <button onClick={() => setGlobalImageUrl('')} className="remove-global">إزالة</button>
                </div>
              )}
            </div>
            <p className="hint">إذا رفعت صورة هنا، سيتم استخدامها لكل منتج يتم استيراده لهذه الوجهة ما لم يتم رفع صورة خاصة بالمنتج.</p>
          </div>
        )}
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
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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

      {/* فلتر إضافي: عرض منتجات الوجهة فقط */}
      {targetSelected && (
        <div className="target-filter-card">
          <label className="target-filter-label">
            <input
              type="checkbox"
              checked={filterByTarget}
              onChange={(e) => setFilterByTarget(e.target.checked)}
            />
            عرض منتجات تنتمي إلى "{selectedTargetName}" فقط
          </label>
        </div>
      )}

      {/* شبكة المنتجات */}
      <div className="products-grid">
        {filteredAndSortedProducts.length === 0 ? (
          <div className="no-results">لا توجد منتجات تطابق المعايير</div>
        ) : (
          filteredAndSortedProducts.map(product => {
            const finalPrice = product.price * (1 + markupPercent / 100);
            const isPopular = popularProducts.has(product.id);
            const imageUrl = productImages[product.id] || (filterByTarget ? globalImageUrl : '');
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
                    disabled={!targetSelected || importing[product.id]}
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
    </div>
  );
}
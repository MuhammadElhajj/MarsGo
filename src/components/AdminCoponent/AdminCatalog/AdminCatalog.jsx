// src/components/AdminCoponent/AdminCatalog/AdminCatalog.jsx
import { useState, useCallback } from 'react';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import { FiRefreshCw } from 'react-icons/fi';
import { useAppStore } from '../../../store/store';
import './AdminCatalog.css';

export default function AdminCatalog({ type }) { // type: 'games' أو 'apps'
  const store = useAppStore();
  
  // بيانات العناصر
  const items = type === 'games' ? store.games : store.apps;
  const loading = false; // يمكنك إضافة حالة تحميل إذا أردت
  
  // دوال إدارة العناصر
  const addItem = type === 'games' ? store.addGame : store.addApp;
  const updateItem = type === 'games' ? store.updateGame : store.updateApp;
  const deleteItem = type === 'games' ? store.deleteGame : store.deleteApp;
  
  // دوال إدارة الباقات
  const fetchPackages = type === 'games' ? store.fetchGamePackages : store.fetchAppPackages;
  const addPackage = type === 'games' ? store.addGamePackage : store.addAppPackage;
  const updatePackage = type === 'games' ? store.updateGamePackage : store.updateAppPackage;
  const deletePackage = type === 'games' ? store.deleteGamePackage : store.deleteAppPackage;
  
  const packageTypeOptions = type === 'games' 
    ? ['normal', 'royalPass', 'direct'] 
    : ['normal', 'premium', 'subscription'];
  
  const title = type === 'games' ? '🎮 إدارة الألعاب' : '📱 إدارة التطبيقات';
  const itemLabel = type === 'games' ? 'لعبة' : 'تطبيق';

  // باقي الكود كما هو (لم يتغير)
  const [selectedItem, setSelectedItem] = useState(null);
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);

  const [formItem, setFormItem] = useState({
    name: '', imageUrl: '', note: '', isAvailable: true, unavailableReason: '',
    order: 0, discount: 0, rating: 5.0, sold: '',
  });

  const [formPackage, setFormPackage] = useState({
    name: '', price: '', currency: 'USD', discount: 0,
    type: packageTypeOptions[0] || 'normal', order: 0,
    imageUrl: '', note: '', externalProductId: '', externalAnyKey: '',
  });

  const loadPackages = useCallback(async (item) => {
    if (!item) return;
    setPackagesLoading(true);
    try {
      const pkgs = await fetchPackages(item.id);
      setPackages(pkgs);
    } catch (err) {
      console.error('خطأ في تحميل الباقات:', err);
    } finally {
      setPackagesLoading(false);
    }
  }, [fetchPackages]);

  const refreshPackages = useCallback(async () => {
    if (selectedItem) await loadPackages(selectedItem);
  }, [selectedItem, loadPackages]);

  const handleSelectItem = useCallback(async (item) => {
    setSelectedItem(item);
    await loadPackages(item);
  }, [loadPackages]);

  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormItem({
        name: item.name || '', imageUrl: item.imageUrl || '', note: item.note || '',
        isAvailable: item.isAvailable !== false, unavailableReason: item.unavailableReason || '',
        order: item.order || 0, discount: item.discount || 0,
        rating: item.rating || 5.0, sold: item.sold || '',
      });
    } else {
      setEditingItem(null);
      setFormItem({
        name: '', imageUrl: '', note: '', isAvailable: true, unavailableReason: '',
        order: items.length, discount: 0, rating: 5.0, sold: '',
      });
    }
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: formItem.name, imageUrl: formItem.imageUrl, note: formItem.note,
      isAvailable: formItem.isAvailable, unavailableReason: formItem.unavailableReason,
      order: Number(formItem.order), discount: Number(formItem.discount) || 0,
      rating: Number(formItem.rating) || 5.0, sold: formItem.sold || '',
      updatedAt: new Date(),
    };
    if (editingItem) {
      await updateItem(editingItem.id, data);
      if (selectedItem?.id === editingItem.id) {
        const updated = { ...selectedItem, ...data };
        setSelectedItem(updated);
        await loadPackages(updated);
      }
    } else {
      data.createdAt = new Date();
      await addItem(data);
    }
    setShowItemModal(false);
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`حذف ${itemLabel} "${item.name}" وجميع باقاتها؟ لا يمكن التراجع.`)) {
      await deleteItem(item.id);
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
        setPackages([]);
      }
    }
  };

  const openPackageModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormPackage({
        name: pkg.name || '', price: pkg.price || '', currency: pkg.currency || 'USD',
        discount: pkg.discount || 0, type: pkg.type || (packageTypeOptions[0] || 'normal'),
        order: pkg.order || 0, imageUrl: pkg.imageUrl || '', note: pkg.note || '',
        externalProductId: pkg.externalProductId || '', externalAnyKey: pkg.externalAnyKey || '',
      });
    } else {
      setEditingPackage(null);
      setFormPackage({
        name: '', price: '', currency: 'USD', discount: 0,
        type: packageTypeOptions[0] || 'normal', order: packages.length,
        imageUrl: '', note: '', externalProductId: '', externalAnyKey: '',
      });
    }
    setShowPackageModal(true);
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    const data = {
      name: formPackage.name, price: Number(formPackage.price), currency: formPackage.currency,
      discount: Number(formPackage.discount), type: formPackage.type, order: Number(formPackage.order),
      imageUrl: formPackage.imageUrl, note: formPackage.note,
      externalProductId: formPackage.externalProductId ? Number(formPackage.externalProductId) : null,
      externalAnyKey: formPackage.externalAnyKey || '',
    };
    if (editingPackage) {
      await updatePackage(selectedItem.id, editingPackage.id, data);
    } else {
      await addPackage(selectedItem.id, data);
    }
    setShowPackageModal(false);
    await loadPackages(selectedItem);
  };

  const handleDeletePackage = async (pkg) => {
    if (window.confirm(`حذف باقة "${pkg.name}"؟`)) {
      await deletePackage(selectedItem.id, pkg.id);
      await loadPackages(selectedItem);
    }
  };

  if (loading) return <div className="admin-catalog__loading">جاري تحميل {itemLabel}...</div>;

  return (
    <div className="admin-catalog">
      <div className="admin-catalog__header">
        <h2>{title}</h2>
        <Button onClick={() => openItemModal()}>➕ إضافة {itemLabel} جديد</Button>
      </div>

      {/* قائمة العناصر (ألعاب/تطبيقات) - بطاقات متجاوبة */}
      <div className="admin-catalog__section">
        <h3>قائمة {itemLabel}</h3>
        {items.length === 0 ? (
          <p>لا توجد {itemLabel} مضافة بعد</p>
        ) : (
          <div className="items-grid">
            {items.map(item => (
              <div key={item.id} className={`item-card ${selectedItem?.id === item.id ? 'item-card--selected' : ''}`}>
                <div className="item-card__image">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <span>📦</span>}
                </div>
                <div className="item-card__info">
                  <h4>{item.name}</h4>
                  <div className="item-card__status">
                    <span className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
                      {item.isAvailable ? 'متاحة' : 'غير متاحة'}
                    </span>
                    <span className="item-card__order">ترتيب: {item.order}</span>
                  </div>
                </div>
                <div className="item-card__actions">
                  <Button onClick={() => openItemModal(item)} variant="primary" size="sm">تعديل</Button>
                  <Button onClick={() => handleDeleteItem(item)} variant="danger" size="sm">حذف</Button>
                  <Button onClick={() => handleSelectItem(item)} variant="secondary" size="sm">
                    {selectedItem?.id === item.id ? 'مختارة' : 'إدارة الباقات'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* باقات العنصر المختار */}
      {selectedItem && (
        <div className="admin-catalog__section">
          <div className="packages-header">
            <h3>باقات {selectedItem.name}</h3>
            <div className="packages-actions">
              <Button onClick={refreshPackages} variant="outline" size="sm" disabled={packagesLoading}>
                <FiRefreshCw /> تحديث
              </Button>
              <Button onClick={() => openPackageModal()}>➕ إضافة باقة</Button>
            </div>
          </div>
          {packagesLoading ? (
            <p>جاري تحميل الباقات...</p>
          ) : packages.length === 0 ? (
            <p>لا توجد باقات لهذا {itemLabel}</p>
          ) : (
            <div className="packages-grid">
              {packages.map(pkg => (
                <div key={pkg.id} className="package-card">
                  <div className="package-card__image">
                    {pkg.imageUrl ? <img src={pkg.imageUrl} alt={pkg.name} /> : <span>📦</span>}
                  </div>
                  <div className="package-card__info">
                    <h4>{pkg.name}</h4>
                    <div className="package-card__details">
                      <span><strong>السعر:</strong> {pkg.price} {pkg.currency}</span>
                      <span><strong>الخصم:</strong> {pkg.discount || 0}%</span>
                      <span><strong>النوع:</strong> {pkg.type}</span>
                      <span><strong>الترتيب:</strong> {pkg.order}</span>
                    </div>
                  </div>
                  <div className="package-card__actions">
                    <Button onClick={() => openPackageModal(pkg)} variant="primary" size="sm">تعديل</Button>
                    <Button onClick={() => handleDeletePackage(pkg)} variant="danger" size="sm">حذف</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* المودالات (نفس الكود السابق) */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? `تعديل ${itemLabel}` : `إضافة ${itemLabel} جديد`}</h3>
              <button className="close-btn" onClick={() => setShowItemModal(false)}>✕</button>
            </div>
            <form onSubmit={handleItemSubmit} className="modal-form">
              <Input label={`اسم ${itemLabel} *`} value={formItem.name} onChange={e => setFormItem({...formItem, name: e.target.value})} required />
              <div className="form-field">
                <label>صورة {itemLabel}</label>
                <ImageUpload onUploadComplete={(url) => setFormItem({...formItem, imageUrl: url})} maxSizeMB={0.5} storagePath={`${type}/${editingItem?.id || 'temp'}`} />
                {formItem.imageUrl && <img src={formItem.imageUrl} alt="معاينة" className="preview-img" />}
              </div>
              <Input label="ملاحظة (تظهر تحت الاسم)" value={formItem.note} onChange={e => setFormItem({...formItem, note: e.target.value})} />
              <Input label="الخصم (%)" type="number" step="0.1" min="0" max="100" value={formItem.discount} onChange={e => setFormItem({...formItem, discount: parseFloat(e.target.value) || 0})} />
              <Input label="التقييم (1–5)" type="number" step="0.1" min="1" max="5" value={formItem.rating} onChange={e => setFormItem({...formItem, rating: parseFloat(e.target.value) || 5.0})} />
              <Input label="المبيعات (نص)" value={formItem.sold} onChange={e => setFormItem({...formItem, sold: e.target.value})} placeholder="مثال: 100k+ Sold" />
              <div className="form-field checkbox">
                <label><input type="checkbox" checked={formItem.isAvailable} onChange={e => setFormItem({...formItem, isAvailable: e.target.checked})} /> {itemLabel} متاحة</label>
              </div>
              {!formItem.isAvailable && <Input label="سبب عدم التوفر" value={formItem.unavailableReason} onChange={e => setFormItem({...formItem, unavailableReason: e.target.value})} />}
              <Input label="ترتيب الظهور" type="number" value={formItem.order} onChange={e => setFormItem({...formItem, order: parseInt(e.target.value) || 0})} />
              <div className="modal-actions">
                <Button type="submit">حفظ</Button>
                <Button type="button" variant="danger" onClick={() => setShowItemModal(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPackageModal && (
        <div className="modal-overlay" onClick={() => setShowPackageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPackage ? 'تعديل باقة' : 'إضافة باقة جديدة'}</h3>
              <button className="close-btn" onClick={() => setShowPackageModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePackageSubmit} className="modal-form">
              <Input label="اسم الباقة *" value={formPackage.name} onChange={e => setFormPackage({...formPackage, name: e.target.value})} required />
              <Input label="السعر *" type="number" step="0.01" value={formPackage.price} onChange={e => setFormPackage({...formPackage, price: e.target.value})} required />
              <div className="form-field">
                <label>صورة الباقة</label>
                <ImageUpload onUploadComplete={(url) => setFormPackage({...formPackage, imageUrl: url})} maxSizeMB={0.5} storagePath={`${type}/${selectedItem?.id}/packages/${editingPackage?.id || 'temp'}`} />
                {formPackage.imageUrl && <img src={formPackage.imageUrl} alt="معاينة" className="preview-img" />}
              </div>
              <Input label="ملاحظة الباقة" value={formPackage.note} onChange={e => setFormPackage({...formPackage, note: e.target.value})} />
              <div className="form-field"><label>العملة</label><select value={formPackage.currency} onChange={e => setFormPackage({...formPackage, currency: e.target.value})}><option value="USD">دولار أمريكي ($)</option><option value="SYP">ليرة سورية (ل.س)</option></select></div>
              <Input label="نسبة الخصم" type="number" step="0.1" value={formPackage.discount} onChange={e => setFormPackage({...formPackage, discount: e.target.value})} />
              <div className="form-field"><label>نوع الباقة</label><select value={formPackage.type} onChange={e => setFormPackage({...formPackage, type: e.target.value})}>{packageTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
              <Input label="معرف المنتج في المتجر الخارجي (externalProductId)" type="number" value={formPackage.externalProductId} onChange={e => setFormPackage({...formPackage, externalProductId: e.target.value})} placeholder="مثال: 2054" helperText="مطلوب للطلبات التلقائية عبر API" />
              <Input label="مفتاح إضافي (anyKey) - لمنتجات موبايل ليجند" value={formPackage.externalAnyKey} onChange={e => setFormPackage({...formPackage, externalAnyKey: e.target.value})} placeholder="السيرفر أو أي قيمة إضافية" />
              <Input label="ترتيب الظهور" type="number" value={formPackage.order} onChange={e => setFormPackage({...formPackage, order: parseInt(e.target.value) || 0})} />
              <div className="modal-actions">
                <Button type="submit">حفظ</Button>
                <Button type="button" variant="danger" onClick={() => setShowPackageModal(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
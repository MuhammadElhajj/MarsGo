// src/components/AdminCoponent/AdminCatalog/AdminCatalog.jsx
import { useState } from 'react';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import './AdminCatalog.css'; // سننشئه بنفس نمط القديم

export default function AdminCatalog({
  type,                     // 'games' أو 'apps'
  items,                    // المصفوفة (ألعاب أو تطبيقات)
  loading,
  fetchPackages,            // دالة لجلب الباقات
  addItem,                  // دالة إضافة عنصر (addGame أو addApp)
  updateItem,               // دالة تحديث عنصر
  deleteItem,               // دالة حذف عنصر
  addPackage,               // دالة إضافة باقة
  updatePackage,            // دالة تحديث باقة
  deletePackage,            // دالة حذف باقة
  title = 'إدارة العناصر',
  itemLabel = 'عنصر',
  packageTypeOptions = [],  // مصفوفة من القيم المسموحة لنوع الباقة
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);

  // نموذج العنصر (لعبة أو تطبيق)
  const [formItem, setFormItem] = useState({
    name: '',
    imageBase64: '',
    note: '',
    isAvailable: true,
    unavailableReason: '',
    order: 0,
  });

  // نموذج الباقة
  const [formPackage, setFormPackage] = useState({
    name: '',
    price: '',
    currency: 'USD',
    discount: 0,
    type: packageTypeOptions[0] || 'normal',
    order: 0,
    imageBase64: '',
    note: '',
  });

  const handleSelectItem = async (item) => {
    setSelectedItem(item);
    setPackagesLoading(true);
    const pkgs = await fetchPackages(item.id);
    setPackages(pkgs);
    setPackagesLoading(false);
  };

  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormItem({
        name: item.name || '',
        imageBase64: item.imageBase64 || '',
        note: item.note || '',
        isAvailable: item.isAvailable !== false,
        unavailableReason: item.unavailableReason || '',
        order: item.order || 0,
      });
    } else {
      setEditingItem(null);
      setFormItem({
        name: '',
        imageBase64: '',
        note: '',
        isAvailable: true,
        unavailableReason: '',
        order: items.length,
      });
    }
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: formItem.name,
      imageBase64: formItem.imageBase64,
      note: formItem.note,
      isAvailable: formItem.isAvailable,
      unavailableReason: formItem.unavailableReason,
      order: Number(formItem.order),
      updatedAt: new Date(),
    };
    if (editingItem) {
      await updateItem(editingItem.id, data);
      if (selectedItem?.id === editingItem.id) {
        const updated = { ...selectedItem, ...data };
        setSelectedItem(updated);
        await handleSelectItem(updated);
      }
    } else {
      data.createdAt = new Date();
      await addItem(data);
    }
    setShowItemModal(false);
    // إعادة تحميل القائمة الرئيسية عن طريق تحديث الـ context (الـ parent هو من يمرر items)
    // لكن parent هو من يستدعي context ويجلب البيانات، فهو يتغير تلقائياً.
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
        name: pkg.name || '',
        price: pkg.price || '',
        currency: pkg.currency || 'USD',
        discount: pkg.discount || 0,
        type: pkg.type || (packageTypeOptions[0] || 'normal'),
        order: pkg.order || 0,
        imageBase64: pkg.imageBase64 || '',
        note: pkg.note || '',
      });
    } else {
      setEditingPackage(null);
      setFormPackage({
        name: '',
        price: '',
        currency: 'USD',
        discount: 0,
        type: packageTypeOptions[0] || 'normal',
        order: packages.length,
        imageBase64: '',
        note: '',
      });
    }
    setShowPackageModal(true);
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    const data = {
      name: formPackage.name,
      price: Number(formPackage.price),
      currency: formPackage.currency,
      discount: Number(formPackage.discount),
      type: formPackage.type,
      order: Number(formPackage.order),
      imageBase64: formPackage.imageBase64,
      note: formPackage.note,
    };
    if (editingPackage) {
      await updatePackage(selectedItem.id, editingPackage.id, data);
    } else {
      await addPackage(selectedItem.id, data);
    }
    setShowPackageModal(false);
    const pkgs = await fetchPackages(selectedItem.id);
    setPackages(pkgs);
  };

  const handleDeletePackage = async (pkg) => {
    if (window.confirm(`حذف باقة "${pkg.name}"؟`)) {
      await deletePackage(selectedItem.id, pkg.id);
      const pkgs = await fetchPackages(selectedItem.id);
      setPackages(pkgs);
    }
  };

  if (loading) return <div className="admin-loading">جاري تحميل {itemLabel}...</div>;

  return (
    <div className="admin-catalog" dir="rtl">
      <div className="admin-catalog__header">
        <h2>{title}</h2>
        <Button onClick={() => openItemModal()}>➕ إضافة {itemLabel} جديد</Button>
      </div>

      <div className="admin-catalog__content">
        {/* قائمة العناصر */}
        <div className="items-list">
          <h3>قائمة {itemLabel}</h3>
          {items.length === 0 ? (
            <p>لا توجد {itemLabel} مضافة بعد</p>
          ) : (
            <div className="items-table-wrapper">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>الصورة</th><th>الاسم</th><th>الحالة</th><th>الترتيب</th><th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className={selectedItem?.id === item.id ? 'selected-row' : ''}>
                      <td>{item.imageBase64 ? <img src={item.imageBase64} alt={item.name} className="item-thumb" /> : <span>📦</span>}</td>
                      <td>{item.name}</td>
                      <td><span className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>{item.isAvailable ? 'متاحة' : 'غير متاحة'}</span></td>
                      <td>{item.order}</td>
                      <td>
                        <Button onClick={() => openItemModal(item)} variant="primary">تعديل</Button>
                        <Button onClick={() => handleDeleteItem(item)} variant="danger">حذف</Button>
                        <Button onClick={() => handleSelectItem(item)} variant="secondary">
                          {selectedItem?.id === item.id ? 'مختارة' : 'إدارة الباقات'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* باقات العنصر المختار */}
        {selectedItem && (
          <div className="packages-list">
            <div className="packages-header">
              <h3>باقات {selectedItem.name}</h3>
              <Button onClick={() => openPackageModal()}>➕ إضافة باقة</Button>
            </div>
            {packagesLoading ? (
              <p>جاري تحميل الباقات...</p>
            ) : packages.length === 0 ? (
              <p>لا توجد باقات لهذا {itemLabel}</p>
            ) : (
              <div className="packages-table-wrapper">
                <table className="packages-table">
                  <thead>
                    <tr><th>الاسم</th><th>السعر</th><th>العملة</th><th>الخصم</th><th>النوع</th><th>الترتيب</th><th>إجراءات</th></tr>
                  </thead>
                  <tbody>
                    {packages.map(pkg => (
                      <tr key={pkg.id}>
                        <td>{pkg.name}</td>
                        <td>{pkg.price}</td>
                        <td>{pkg.currency}</td>
                        <td>{pkg.discount || 0}%</td>
                        <td>{pkg.type}</td>
                        <td>{pkg.order}</td>
                        <td>
                          <Button onClick={() => openPackageModal(pkg)} variant="primary">تعديل</Button>
                          <Button onClick={() => handleDeletePackage(pkg)} variant="danger">حذف</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* مودال العنصر */}
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
                <ImageUpload onUploadComplete={(base64) => setFormItem({...formItem, imageBase64: base64})} maxSizeMB={0.5} />
                {formItem.imageBase64 && <img src={formItem.imageBase64} alt="معاينة" className="preview-img" />}
              </div>
              <Input label="ملاحظة (تظهر تحت الاسم)" value={formItem.note} onChange={e => setFormItem({...formItem, note: e.target.value})} />
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

      {/* مودال الباقة */}
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
              <div className="form-field"><label>صورة الباقة</label><ImageUpload onUploadComplete={(base64) => setFormPackage({...formPackage, imageBase64: base64})} maxSizeMB={0.5} />{formPackage.imageBase64 && <img src={formPackage.imageBase64} alt="معاينة" className="preview-img" />}</div>
              <Input label="ملاحظة الباقة" value={formPackage.note} onChange={e => setFormPackage({...formPackage, note: e.target.value})} />
              <div className="form-field"><label>العملة</label><select value={formPackage.currency} onChange={e => setFormPackage({...formPackage, currency: e.target.value})}><option value="USD">دولار أمريكي ($)</option><option value="SYP">ليرة سورية (ل.س)</option></select></div>
              <Input label="نسبة الخصم" type="number" step="0.1" value={formPackage.discount} onChange={e => setFormPackage({...formPackage, discount: e.target.value})} />
              <div className="form-field"><label>نوع الباقة</label><select value={formPackage.type} onChange={e => setFormPackage({...formPackage, type: e.target.value})}>{packageTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
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
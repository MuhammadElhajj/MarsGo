// src/pages/Admin/AdminApps.jsx
import { useState } from 'react';
import { useApps } from '../../context/AppsContext';
import Button from '../../components/GeneralComponents/Button/Button';
import Input from '../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../components/GeneralComponents/ImageUpload/ImageUpload';
import './AdminApps.css';

export default function AdminApps() {
  const {
    apps,
    loading,
    fetchApps,
    fetchPackages,
    addApp,
    updateApp,
    deleteApp,
    addPackage,
    updatePackage,
    deletePackage,
  } = useApps();

  const [selectedApp, setSelectedApp] = useState(null);
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formApp, setFormApp] = useState({
    name: '',
    imageBase64: '',
    note: '',
    isAvailable: true,
    unavailableReason: '',
    order: 0,
  });
  const [formPackage, setFormPackage] = useState({
    name: '',
    price: '',
    currency: 'USD',
    discount: 0,
    type: 'normal',
    order: 0,
  });

  const handleSelectApp = async (app) => {
    setSelectedApp(app);
    setPackagesLoading(true);
    const pkgs = await fetchPackages(app.id);
    setPackages(pkgs);
    setPackagesLoading(false);
  };

  const openAppModal = (app = null) => {
    if (app) {
      setEditingApp(app);
      setFormApp({
        name: app.name || '',
        imageBase64: app.imageBase64 || '',
        note: app.note || '',
        isAvailable: app.isAvailable !== false,
        unavailableReason: app.unavailableReason || '',
        order: app.order || 0,
      });
    } else {
      setEditingApp(null);
      setFormApp({
        name: '',
        imageBase64: '',
        note: '',
        isAvailable: true,
        unavailableReason: '',
        order: apps.length,
      });
    }
    setShowAppModal(true);
  };

  const handleAppSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: formApp.name,
      imageBase64: formApp.imageBase64,
      note: formApp.note,
      isAvailable: formApp.isAvailable,
      unavailableReason: formApp.unavailableReason,
      order: Number(formApp.order),
      updatedAt: new Date(),
    };
    if (editingApp) {
      await updateApp(editingApp.id, data);
      if (selectedApp?.id === editingApp.id) {
        const updatedApp = { ...selectedApp, ...data };
        setSelectedApp(updatedApp);
        await handleSelectApp(updatedApp);
      }
    } else {
      data.createdAt = new Date();
      await addApp(data);
    }
    setShowAppModal(false);
    await fetchApps();
  };

  const handleDeleteApp = async (app) => {
    if (window.confirm(`حذف التطبيق "${app.name}" وجميع بقاته؟ لا يمكن التراجع.`)) {
      await deleteApp(app.id);
      if (selectedApp?.id === app.id) {
        setSelectedApp(null);
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
        type: pkg.type || 'normal',
        order: pkg.order || 0,
      });
    } else {
      setEditingPackage(null);
      setFormPackage({
        name: '',
        price: '',
        currency: 'USD',
        discount: 0,
        type: 'normal',
        order: packages.length,
      });
    }
    setShowPackageModal(true);
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    const data = {
      name: formPackage.name,
      price: Number(formPackage.price),
      currency: formPackage.currency,
      discount: Number(formPackage.discount),
      type: formPackage.type,
      order: Number(formPackage.order),
    };
    if (editingPackage) {
      await updatePackage(selectedApp.id, editingPackage.id, data);
    } else {
      await addPackage(selectedApp.id, data);
    }
    setShowPackageModal(false);
    const pkgs = await fetchPackages(selectedApp.id);
    setPackages(pkgs);
  };

  const handleDeletePackage = async (pkg) => {
    if (window.confirm(`حذف باقة "${pkg.name}"؟`)) {
      await deletePackage(selectedApp.id, pkg.id);
      const pkgs = await fetchPackages(selectedApp.id);
      setPackages(pkgs);
    }
  };

  if (loading) return <div className="admin-loading">جاري تحميل التطبيقات...</div>;

  return (
    <div className="admin-apps" dir="rtl">
      <div className="admin-apps__header">
        <h2>📱 إدارة التطبيقات والباقات</h2>
        <Button onClick={() => openAppModal()}>➕ إضافة تطبيق جديد</Button>
      </div>

      <div className="admin-apps__content">
        {/* قائمة التطبيقات */}
        <div className="admin-apps__apps-list">
          <h3>قائمة التطبيقات</h3>
          {apps.length === 0 ? (
            <p>لا توجد تطبيقات مضافة بعد</p>
          ) : (
            <div className="apps-table-wrapper">
              <table className="apps-table">
                <thead>
                  <tr>
                    <th>الصورة</th>
                    <th>الاسم</th>
                    <th>الحالة</th>
                    <th>الترتيب</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map(app => (
                    <tr key={app.id} className={selectedApp?.id === app.id ? 'selected-row' : ''}>
                      <td>
                        {app.imageBase64 ? (
                          <img src={app.imageBase64} alt={app.name} className="app-thumb" />
                        ) : (
                          <span>📱</span>
                        )}
                      </td>
                      <td>{app.name}</td>
                      <td>
                        <span className={`status-badge ${app.isAvailable ? 'available' : 'unavailable'}`}>
                          {app.isAvailable ? 'متاحة' : 'غير متاحة'}
                        </span>
                      </td>
                      <td>{app.order}</td>
                      <td>
                        <Button onClick={() => openAppModal(app)} variant="primary">تعديل</Button>
                        <Button onClick={() => handleDeleteApp(app)} variant="danger">حذف</Button>
                        <Button onClick={() => handleSelectApp(app)} variant="secondary">
                          {selectedApp?.id === app.id ? 'مختارة' : 'إدارة الباقات'}
                        </Button>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* باقات التطبيق المختار */}
        {selectedApp && (
          <div className="admin-apps__packages">
            <div className="packages-header">
              <h3>باقات تطبيق: {selectedApp.name}</h3>
              <Button onClick={() => openPackageModal()}>➕ إضافة باقة</Button>
            </div>
            {packagesLoading ? (
              <p>جاري تحميل الباقات...</p>
            ) : packages.length === 0 ? (
              <p>لا توجد باقات لهذا التطبيق</p>
            ) : (
              <div className="packages-table-wrapper">
                <table className="packages-table">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>السعر</th>
                      <th>العملة</th>
                      <th>الخصم %</th>
                      <th>النوع</th>
                      <th>الترتيب</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map(pkg => (
                      <tr key={pkg.id}>
                        <td>{pkg.name}</td>
                        <td>{pkg.price}</td>
                        <td>{pkg.currency}</td>
                        <td>{pkg.discount || 0}%</td>
                        <td>
                          {pkg.type === 'normal' && 'عادي'}
                          {pkg.type === 'premium' && 'مميز'}
                          {pkg.type === 'subscription' && 'اشتراك'}
                        </td>
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

      {/* مودال إضافة/تعديل تطبيق */}
      {showAppModal && (
        <div className="modal-overlay" onClick={() => setShowAppModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingApp ? 'تعديل تطبيق' : 'إضافة تطبيق جديد'}</h3>
              <button className="close-btn" onClick={() => setShowAppModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAppSubmit} className="modal-form">
              <Input label="اسم التطبيق *" value={formApp.name} onChange={e => setFormApp({...formApp, name: e.target.value})} required />
              <div className="form-field">
                <label>صورة التطبيق (اختياري)</label>
                <ImageUpload
                  onUploadComplete={(base64) => setFormApp({...formApp, imageBase64: base64})}
                  maxSizeMB={0.5}
                />
                {formApp.imageBase64 && <img src={formApp.imageBase64} alt="معاينة" className="preview-img" />}
              </div>
              <Input label="ملاحظة (تظهر تحت الاسم)" value={formApp.note} onChange={e => setFormApp({...formApp, note: e.target.value})} />
              <div className="form-field checkbox">
                <label>
                  <input type="checkbox" checked={formApp.isAvailable} onChange={e => setFormApp({...formApp, isAvailable: e.target.checked})} />
                  التطبيق متاح
                </label>
              </div>
              {!formApp.isAvailable && (
                <Input label="سبب عدم التوفر" value={formApp.unavailableReason} onChange={e => setFormApp({...formApp, unavailableReason: e.target.value})} />
              )}
              <Input label="ترتيب الظهور (رقم)" type="number" value={formApp.order} onChange={e => setFormApp({...formApp, order: parseInt(e.target.value) || 0})} />
              <div className="modal-actions">
                <Button type="submit">حفظ</Button>
                <Button type="button" variant="danger" onClick={() => setShowAppModal(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال إضافة/تعديل باقة */}
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
                <label>العملة</label>
                <select value={formPackage.currency} onChange={e => setFormPackage({...formPackage, currency: e.target.value})}>
                  <option value="USD">دولار أمريكي ($)</option>
                  <option value="SYP">ليرة سورية (ل.س)</option>
                </select>
              </div>
              <Input label="نسبة الخصم (مثلاً 10 لـ 10%)" type="number" step="0.1" value={formPackage.discount} onChange={e => setFormPackage({...formPackage, discount: e.target.value})} />
              <div className="form-field">
                <label>نوع الباقة</label>
                <select value={formPackage.type} onChange={e => setFormPackage({...formPackage, type: e.target.value})}>
                  <option value="normal">عادي</option>
                  <option value="premium">مميز</option>
                  <option value="subscription">اشتراك</option>
                </select>
              </div>
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
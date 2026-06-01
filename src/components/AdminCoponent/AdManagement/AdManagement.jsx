import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import './AdManagement.css';

export default function AdManagement() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', link: '', imageBase64: '', order: 0 });
  const [uploading, setUploading] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'ads'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      setAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('خطأ في جلب الإعلانات:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', description: '', link: '', imageBase64: '', order: 0 });
    setModalOpen(true);
  };

  const openEdit = (ad) => {
    setEditing(ad);
    setForm({
      title: ad.title || '',
      description: ad.description || '',
      link: ad.link || '',
      imageBase64: ad.imageBase64 || ad.imageUrl || '', // دعم الحقل القديم
      order: ad.order || 0,
    });
    setModalOpen(true);
  };

  const handleImageComplete = (base64) => {
    setForm(prev => ({ ...prev, imageBase64: base64 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('الرجاء إدخال عنوان الإعلان');
      return;
    }
    setUploading(true);
    try {
      const data = {
        title: form.title,
        description: form.description || '',
        link: form.link || '',
        imageBase64: form.imageBase64 || '',
        order: Number(form.order),
        updatedAt: new Date(),
      };
      if (editing) {
        await updateDoc(doc(db, 'ads', editing.id), data);
        alert('✅ تم تحديث الإعلان');
      } else {
        data.createdAt = new Date();
        await addDoc(collection(db, 'ads'), data);
        alert('✅ تمت إضافة الإعلان');
      }
      setModalOpen(false);
      fetchAds();
    } catch (err) {
      console.error(err);
      alert('❌ فشل الحفظ: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (ad) => {
    if (!window.confirm(`حذف الإعلان "${ad.title}"؟`)) return;
    try {
      await deleteDoc(doc(db, 'ads', ad.id));
      fetchAds();
    } catch (err) {
      alert('فشل الحذف');
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      await updateDoc(doc(db, 'ads', ad.id), { isActive: !ad.isActive });
      fetchAds();
    } catch (err) {
      alert('فشل تغيير الحالة');
    }
  };

  if (loading) return <div className="ad-management-loading">⏳ جاري تحميل الإعلانات...</div>;

  return (
    <div className="ad-management" dir="rtl">
      <div className="ad-management__header">
        <h2>📢 إدارة الإعلانات</h2>
        <Button onClick={openAdd}>➕ إضافة إعلان جديد</Button>
      </div>

      {ads.length === 0 ? (
        <div className="ad-management__empty">
          <p>لا توجد إعلانات مضافة حالياً</p>
          <Button onClick={openAdd}>إضافة أول إعلان</Button>
        </div>
      ) : (
        <div className="ad-management__table-wrapper">
          <table className="ad-management__table">
            <thead>
              <tr><th>الصورة</th><th>العنوان</th><th>الوصف</th><th>الترتيب</th><th>الحالة</th><th>الإجراءات</th></tr>
            </thead>
            <tbody>
              {ads.map(ad => (
                <tr key={ad.id}>
                  <td>
                    {ad.imageBase64 ? (
                      <img src={ad.imageBase64} alt={ad.title} className="ad-management__thumb" />
                    ) : '📢'}
                  </td>
                  <td>{ad.title}</td>
                  <td>{ad.description?.slice(0, 40) || '—'}</td>
                  <td>{ad.order}</td>
                  <td>
                    <button onClick={() => handleToggleActive(ad)} className={`ad-management__status ${ad.isActive ? 'active' : 'inactive'}`}>
                      {ad.isActive ? 'نشط' : 'غير نشط'}
                    </button>
                  </td>
                  <td>
                    <Button onClick={() => openEdit(ad)} variant="primary" className="ad-management__btn">تعديل</Button>
                    <Button onClick={() => handleDelete(ad)} variant="danger" className="ad-management__btn">حذف</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* مودال الإضافة/التعديل */}
      {modalOpen && (
        <div className="ad-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
            <div className="ad-modal__header">
              <h3>{editing ? '✏️ تعديل إعلان' : '➕ إضافة إعلان جديد'}</h3>
              <button className="ad-modal__close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="ad-modal__form">
              <Input label="عنوان الإعلان *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              <Input label="الوصف (اختياري)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <Input label="الرابط (URL) - اختياري" type="url" value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="https://example.com" />
              <Input label="ترتيب الظهور" type="number" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value) || 0})} />

              <ImageUpload
                label="صورة الإعلان (اختياري)"
                onUploadComplete={handleImageComplete}
                maxSizeMB={0.5}
                disabled={uploading}
              />
              {form.imageBase64 && !uploading && (
                <div className="ad-modal__current-image">
                  <img src={form.imageBase64} alt="الصورة الحالية" />
                  <button type="button" onClick={() => setForm({...form, imageBase64: ''})}>حذف الصورة</button>
                </div>
              )}

              <div className="ad-modal__actions">
                <Button type="submit" disabled={uploading}>{uploading ? 'جاري الحفظ...' : (editing ? 'حفظ التغييرات' : 'إضافة الإعلان')}</Button>
                <Button type="button" variant="danger" onClick={() => setModalOpen(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// src/pages/Admin/AdminNavLinks.jsx
import { useState } from 'react';
import { useAppStore } from '../../store/store'; // ✅ استخدم الـ store
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Button from '../../components/GeneralComponents/Button/Button';
import Input from '../../components/GeneralComponents/Input/Input';
import toast from 'react-hot-toast';
import './AdminNavLinks.css';

export default function AdminNavLinks() {
  const { navLinks, setNavLinks } = useAppStore((state) => ({
    navLinks: state.navLinks,
    setNavLinks: state.setNavLinks,
  }));

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', url: '', isExternal: false, order: 0, isActive: true, icon: '',
  });

  // دالة جلب الروابط من Firestore وتحديث الـ store
  const fetchNavLinks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'navigationLinks'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNavLinks(links);
    } catch (err) {
      console.error('فشل جلب الروابط:', err);
      toast.error('فشل تحميل روابط التنقل');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', url: '', isExternal: false, order: navLinks.length, isActive: true, icon: '' });
    setModalOpen(true);
  };

  const openEdit = (link) => {
    setEditing(link);
    setForm({
      name: link.name, url: link.url, isExternal: link.isExternal || false,
      order: link.order, isActive: link.isActive !== false, icon: link.icon || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateDoc(doc(db, 'navigationLinks', editing.id), {
          ...form,
          updatedAt: new Date(),
        });
        toast.success('تم تحديث الرابط');
      } else {
        await addDoc(collection(db, 'navigationLinks'), {
          ...form,
          createdAt: new Date(),
        });
        toast.success('تمت إضافة الرابط');
      }
      setModalOpen(false);
      await fetchNavLinks(); // تحديث القائمة
    } catch (err) {
      console.error(err);
      toast.error('فشل الحفظ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف الرابط؟')) return;
    try {
      await deleteDoc(doc(db, 'navigationLinks', id));
      toast.success('تم حذف الرابط');
      await fetchNavLinks();
    } catch (err) {
      console.error(err);
      toast.error('فشل الحذف');
    }
  };

  if (loading) return <div>جاري تحميل الروابط...</div>;

  return (
    <div className="admin-nav-links">
      <div className="admin-header">
        <h2>🌐 إدارة روابط التنقل</h2>
        <Button onClick={openAdd}>➕ إضافة رابط</Button>
      </div>
      <table className="nav-links-table">
        <thead>
          <tr><th>الترتيب</th><th>الأيقونة</th><th>الاسم</th><th>الرابط</th><th>نوع</th><th>الحالة</th><th>إجراءات</th></tr>
        </thead>
        <tbody>
          {navLinks.map(link => (
            <tr key={link.id}>
              <td>{link.order}</td>
              <td>{link.icon || '—'}</td>
              <td>{link.name}</td>
              <td>{link.url}</td>
              <td>{link.isExternal ? 'خارجي' : 'داخلي'}</td>
              <td>{link.isActive ? 'نشط' : 'غير نشط'}</td>
              <td>
                <Button onClick={() => openEdit(link)} variant="primary">تعديل</Button>
                <Button onClick={() => handleDelete(link.id)} variant="danger">حذف</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'تعديل رابط' : 'إضافة رابط'}</h3>
            <form onSubmit={handleSubmit}>
              <Input label="الاسم" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <Input label="الرابط (URL)" value={form.url} onChange={e => setForm({...form, url: e.target.value})} required />
              <Input label="الأيقونة (رمز إيموجي)" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} placeholder="🏠" />
              <label><input type="checkbox" checked={form.isExternal} onChange={e => setForm({...form, isExternal: e.target.checked})} /> رابط خارجي (يفتح في نافذة جديدة)</label>
              <label><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} /> مفعل</label>
              <Input label="ترتيب الظهور" type="number" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value) || 0})} />
              <div className="modal-actions">
                <Button type="submit">حفظ</Button>
                <Button type="button" variant="danger" onClick={() => setModalOpen(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
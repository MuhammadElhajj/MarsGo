import { useState } from 'react';
import { useNavLinks } from '../../context/NavLinksContext';
import Button from '../../components/GeneralComponents/Button/Button';
import Input from '../../components/GeneralComponents/Input/Input';
import './AdminNavLinks.css';

export default function AdminNavLinks() {
  const { links, loading, addLink, updateLink, deleteLink } = useNavLinks();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', url: '', isExternal: false, order: 0, isActive: true, icon: '',
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', url: '', isExternal: false, order: links.length, isActive: true, icon: '' });
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
    if (editing) {
      await updateLink(editing.id, form);
    } else {
      await addLink(form);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('حذف الرابط؟')) await deleteLink(id);
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
          {links.map(link => (
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
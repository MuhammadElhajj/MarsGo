// src/components/AdminCoponent/AdminPageInstructions/AdminPageInstructions.jsx
import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import toast from 'react-hot-toast';
import './AdminPageInstructions.css';

export default function AdminPageInstructions() {
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ page: '', lines: ['', '', ''], active: true });

  const fetchInstructions = async () => {
    try {
      const q = query(collection(db, 'pageInstructions'), orderBy('page', 'asc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInstructions(data);
    } catch (err) {
      console.error(err);
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.page.trim()) return toast.error('اسم الصفحة مطلوب');
    const linesArray = form.lines.filter(l => l.trim() !== '');
    if (linesArray.length === 0) return toast.error('يجب إدخال سطر واحد على الأقل');

    try {
      if (editing) {
        await updateDoc(doc(db, 'pageInstructions', editing.id), {
          page: form.page,
          lines: linesArray,
          active: form.active,
          updatedAt: new Date().toISOString(),
        });
        toast.success('تم التحديث');
      } else {
        await addDoc(collection(db, 'pageInstructions'), {
          page: form.page,
          lines: linesArray,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        toast.success('تمت الإضافة');
      }
      setEditing(null);
      setForm({ page: '', lines: ['', '', ''], active: true });
      fetchInstructions();
    } catch (err) {
      toast.error('فشل الحفظ');
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({
      page: item.page,
      lines: item.lines.length >= 3 ? item.lines : [...item.lines, '', '', ''].slice(0, 3),
      active: item.active,
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه التعليمات؟')) {
      await deleteDoc(doc(db, 'pageInstructions', id));
      toast.success('تم الحذف');
      fetchInstructions();
    }
  };

  const handleLineChange = (idx, value) => {
    const newLines = [...form.lines];
    newLines[idx] = value;
    setForm({ ...form, lines: newLines });
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div className="admin-page-instructions">
      <h2>📋 إدارة تعليمات الصفحات (كيف يعمل)</h2>
      <form onSubmit={handleSubmit} className="instructions-form">
        <Input label="اسم الصفحة (مثال: transfer, gaming, crypto, exchange, dashboard)" value={form.page} onChange={e => setForm({ ...form, page: e.target.value })} required />
        <div className="lines-input">
          <label>الأسطر (3 أسطر مقترحة)</label>
          {form.lines.map((line, idx) => (
            <Input key={idx} placeholder={`سطر ${idx + 1}`} value={line} onChange={e => handleLineChange(idx, e.target.value)} />
          ))}
        </div>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
          مفعل
        </label>
        <Button type="submit">{editing ? 'تحديث' : 'إضافة'}</Button>
        {editing && <Button type="button" variant="danger" onClick={() => { setEditing(null); setForm({ page: '', lines: ['', '', ''], active: true }); }}>إلغاء</Button>}
      </form>

    <div className="instructions-list">
  <h3>التعليمات الحالية</h3>
  <div className="instructions-cards">
    {instructions.map(item => (
      <div key={item.id} className="instruction-card">
        <div className="instruction-card__header">
          <span className="instruction-card__page">{item.page}</span>
          <span className={`status-badge ${item.active ? 'active' : 'inactive'}`}>
            {item.active ? 'نشط' : 'غير نشط'}
          </span>
        </div>
        <div className="instruction-card__content">
          <ul className="instruction-card__lines">
            {item.lines.map((line, idx) => (
              <li key={idx} className="instruction-card__line">{line}</li>
            ))}
          </ul>
        </div>
        <div className="instruction-card__actions">
          <Button onClick={() => handleEdit(item)} variant="primary">تعديل</Button>
          <Button onClick={() => handleDelete(item.id)} variant="danger">حذف</Button>
        </div>
      </div>
    ))}
  </div>
</div>
    </div>
  );
}
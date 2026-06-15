import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiToggleLeft,
  FiToggleRight,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import './AdminSubCategories.css';

export default function AdminSubCategories() {
  const { categoryId } = useParams(); // مثلاً "games" أو "apps"
  const navigate = useNavigate();
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    isActive: true,
    order: 0,
  });

  // جلب الأباء
  const loadSubCategories = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, `subCategories_${categoryId}`),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubCategories(items);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل الأباء', 'error');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadSubCategories();
  }, [loadSubCategories]);

  // توليد slug تلقائيًا من الاسم
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // إزالة الرموز الخاصة
      .replace(/\s+/g, '-')      // مسافات → شرطات
      .replace(/-+/g, '-');      // شرطات متعددة → شرطة واحدة
  };

  // عند تغيير الاسم، نولد slug تلقائيًا
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: generateSlug(newName),
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      isActive: true,
      order: subCategories.length,
    });
  };

  const editItem = (item) => {
    setEditingId(item.id);
    setFormData({
      id: item.id,
      name: item.name,
      slug: item.slug || generateSlug(item.name),
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      isActive: item.isActive !== false,
      order: item.order || 0,
    });
  };

  const saveItem = async () => {
    if (!formData.name.trim()) {
      showToast('الاسم مطلوب', 'error');
      return;
    }
    if (!formData.slug.trim()) {
      showToast('الـ slug مطلوب', 'error');
      return;
    }

    // التحقق من تفرد الـ slug
    const existing = subCategories.find(
      sc => sc.slug === formData.slug && sc.id !== editingId
    );
    if (existing) {
      showToast('هذا الـ slug موجود مسبقًا', 'error');
      return;
    }

    const itemId = editingId || formData.slug;
    const dataToSave = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl,
      isActive: formData.isActive,
      order: Number(formData.order) || 0,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, `subCategories_${categoryId}`, itemId), dataToSave, { merge: true });
      showToast(editingId ? 'تم التعديل' : 'تمت الإضافة', 'success');
      resetForm();
      loadSubCategories();
    } catch (err) {
      console.error(err);
      showToast('فشل الحفظ', 'error');
    }
  };

  const deleteItem = async (id, name) => {
    if (!window.confirm(`حذف "${name}"؟ سيؤثر على المنتجات المرتبطة.`)) return;
    try {
      // حذف الأب
      await deleteDoc(doc(db, `subCategories_${categoryId}`, id));
      // (اختياري) يمكن تحديث المنتجات المرتبطة لجعل parentId = null
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

  const toggleActive = async (item) => {
    try {
      await setDoc(doc(db, `subCategories_${categoryId}`, item.id), {
        isActive: !item.isActive,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      showToast(`${item.name} ${!item.isActive ? 'تم تفعيله' : 'تم تعطيله'}`, 'success');
      loadSubCategories();
    } catch (err) {
      console.error(err);
      showToast('فشل التحديث', 'error');
    }
  };

  const updateOrder = async (id, newOrder) => {
    try {
      await setDoc(doc(db, `subCategories_${categoryId}`, id), { order: newOrder }, { merge: true });
      loadSubCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const prev = subCategories[index - 1];
    const current = subCategories[index];
    updateOrder(prev.id, current.order);
    updateOrder(current.id, prev.order);
  };

  const moveDown = (index) => {
    if (index === subCategories.length - 1) return;
    const next = subCategories[index + 1];
    const current = subCategories[index];
    updateOrder(next.id, current.order);
    updateOrder(current.id, next.order);
  };

  const categoryNames = {
    games: 'الألعاب',
    apps: 'التطبيقات',
    services: 'الخدمات',
  };
  const categoryTitle = categoryNames[categoryId] || categoryId;

  if (loading && subCategories.length === 0) {
    return <div className="admin-sub-loading">جاري تحميل {categoryTitle}...</div>;
  }

  return (
    <div className="admin-sub-categories" dir="rtl">
      <div className="admin-sub-header">
        <button className="back-btn" onClick={() => navigate('/admin')}>← رجوع</button>
        <h2>إدارة {categoryTitle}</h2>
        <Button onClick={resetForm} variant="secondary"><FiPlus /> إضافة جديد</Button>
      </div>

      <div className="sub-form-card card">
        <h3>{editingId ? 'تعديل' : 'إضافة'} {categoryTitle.slice(0, -1)}</h3>
        <div className="form-grid">
          <Input label="الاسم" value={formData.name} onChange={handleNameChange} required />
          <Input label="Slug (للرابط)" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })} required />
          <Input label="الوصف" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <Input label="ترتيب العرض" type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
          <div className="checkbox-item">
            <label><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /> مفعل</label>
          </div>
          <div className="full-width">
            <label>الصورة:</label>
            <ImageUpload onUploadComplete={(url) => setFormData({ ...formData, imageUrl: url })} maxSizeMB={0.5} storagePath={`subcategories/${categoryId}`} label="رفع صورة" />
            {formData.imageUrl && (
              <div className="image-preview-sm">
                <img src={formData.imageUrl} alt="preview" />
                <button onClick={() => setFormData({ ...formData, imageUrl: '' })}><FiX /></button>
              </div>
            )}
          </div>
        </div>
        <div className="form-actions">
          <Button onClick={saveItem}><FiSave /> {editingId ? 'تحديث' : 'إضافة'}</Button>
          {editingId && <Button onClick={resetForm} variant="outline">إلغاء</Button>}
        </div>
      </div>

      <div className="sub-list">
        <h3>قائمة {categoryTitle}</h3>
        {subCategories.length === 0 ? (
          <p>لا توجد عناصر بعد. أضف العنصر الأول.</p>
        ) : (
          <div className="sub-table">
            <div className="sub-table-header">
              <span>الترتيب</span><span>الاسم</span><span>Slug</span><span>الوصف</span><span>الحالة</span><span>الإجراءات</span>
            </div>
            {subCategories.map((item, idx) => (
              <div key={item.id} className="sub-table-row">
                <span className="order-controls">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0}><FiArrowUp /></button>
                  <span>{item.order}</span>
                  <button onClick={() => moveDown(idx)} disabled={idx === subCategories.length - 1}><FiArrowDown /></button>
                </span>
                <span><strong>{item.name}</strong></span>
                <span className="slug">{item.slug}</span>
                <span className="desc">{item.description?.substring(0, 30)}</span>
                <span>
                  <button className={`active-toggle ${item.isActive ? 'active' : ''}`} onClick={() => toggleActive(item)}>
                    {item.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                  </button>
                </span>
                <span className="actions">
                  <button onClick={() => editItem(item)} className="icon-btn"><FiEdit /></button>
                  <button onClick={() => deleteItem(item.id, item.name)} className="icon-btn delete"><FiTrash2 /></button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
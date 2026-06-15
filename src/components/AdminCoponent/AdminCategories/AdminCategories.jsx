// src/components/AdminCoponent/AdminCategories/AdminCategories.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiToggleLeft,
  FiToggleRight,
} from 'react-icons/fi';
import './AdminCategories.css';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    bgImageUrl: '',
    icon: '',
    isActive: true,
    order: 0,
  });

  // جلب الأقسام من Firestore
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(items);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل الأقسام', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // إعادة تعيين النموذج
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      bgImageUrl: '',
      icon: '',
      isActive: true,
      order: categories.length,
    });
  };

  // تحرير قسم
  const editCategory = (cat) => {
    setEditingId(cat.id);
    setFormData({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      bgImageUrl: cat.bgImageUrl || '',
      icon: cat.icon || '',
      isActive: cat.isActive !== false,
      order: cat.order || 0,
    });
  };

  // حفظ (إضافة أو تعديل)
  const saveCategory = async () => {
    if (!formData.id.trim()) {
      showToast('المعرف (ID) مطلوب (مثال: games, apps)', 'error');
      return;
    }
    if (!formData.name.trim()) {
      showToast('الاسم مطلوب', 'error');
      return;
    }

    const categoryId = formData.id.trim().toLowerCase().replace(/\s+/g, '_');
    const dataToSave = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      bgImageUrl: formData.bgImageUrl,
      icon: formData.icon || '📁',
      isActive: formData.isActive,
      order: Number(formData.order) || 0,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'categories', categoryId), dataToSave, { merge: true });
      showToast(editingId ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح', 'success');
      resetForm();
      loadCategories();
    } catch (err) {
      console.error(err);
      showToast('فشل الحفظ', 'error');
    }
  };

  // حذف قسم
  const deleteCategory = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف القسم "${name}"؟ سيتم حذف جميع المنتجات المرتبطة به أيضاً (إذا قمت ببرمجته لاحقاً).`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'categories', id));
      showToast('تم الحذف', 'success');
      loadCategories();
    } catch (err) {
      console.error(err);
      showToast('فشل الحذف', 'error');
    }
  };

  // تبديل حالة التفعيل
  const toggleActive = async (cat) => {
    try {
      await setDoc(
        doc(db, 'categories', cat.id),
        { isActive: !cat.isActive, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      showToast(`${cat.name} ${!cat.isActive ? 'تم تفعيله' : 'تم تعطيله'}`, 'success');
      loadCategories();
    } catch (err) {
      console.error(err);
      showToast('فشل التحديث', 'error');
    }
  };

  // تحديث ترتيب العرض (سحب وإفلات يمكن إضافته لاحقاً)
  const updateOrder = async (id, newOrder) => {
    try {
      await setDoc(
        doc(db, 'categories', id),
        { order: newOrder, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      loadCategories();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && categories.length === 0) {
    return <div className="admin-categories-loading">جاري تحميل الأقسام...</div>;
  }

  return (
    <div className="admin-categories" dir="rtl">
      <div className="admin-categories-header">
        <h2>إدارة أقسام المتجر</h2>
        <Button onClick={resetForm} variant="secondary">
          <FiPlus /> قسم جديد
        </Button>
      </div>

      {/* نموذج الإضافة والتعديل */}
      <div className="category-form-card card">
        <h3>{editingId ? 'تعديل قسم' : 'إضافة قسم جديد'}</h3>
        <div className="form-grid">
          <Input
            label="المعرف (ID) *"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="مثال: games, apps, services"
            disabled={!!editingId}
            helpText="يستخدم في الرابط، لا يمكن تغييره بعد الإنشاء"
          />
          <Input
            label="الاسم *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="مثال: ألعاب"
          />
          <Input
            label="الوصف"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="وصف قصير يظهر في البطاقة"
          />
          <Input
            label="الأيقونة (رمز Unicode أو Emoji)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="🎮 أو 📱 أو 🛠️"
          />
          <Input
            label="ترتيب العرض"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0})}
            placeholder="0, 1, 2, ..."
          />
          <div className="checkbox-item">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              مفعل (يظهر في المتجر)
            </label>
          </div>
          <div className="full-width">
            <label>صورة الخلفية:</label>
            <ImageUpload
              onUploadComplete={(url) => setFormData({ ...formData, bgImageUrl: url })}
              maxSizeMB={0.5}
              storagePath="category_bg_images"
              label="رفع صورة خلفية"
            />
            {formData.bgImageUrl && (
              <div className="image-preview-sm">
                <img src={formData.bgImageUrl} alt="خلفية القسم" />
                <button onClick={() => setFormData({ ...formData, bgImageUrl: '' })}>
                  <FiX />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="form-actions">
          <Button onClick={saveCategory}>
            <FiSave /> {editingId ? 'تحديث' : 'إضافة'}
          </Button>
          {editingId && (
            <Button onClick={resetForm} variant="outline">
              إلغاء
            </Button>
          )}
        </div>
      </div>

      {/* قائمة الأقسام الحالية */}
      <div className="categories-list">
        <h3>الأقسام الحالية</h3>
        {categories.length === 0 ? (
          <p>لا توجد أقسام بعد. أضف قسمك الأول.</p>
        ) : (
          <div className="categories-table">
            <div className="categories-table-header">
              <span>الترتيب</span>
              <span>المعرف</span>
              <span>الاسم</span>
              <span>الوصف</span>
              <span>الحالة</span>
              <span>الإجراءات</span>
            </div>
            {categories.map((cat, index) => (
              <div key={cat.id} className="categories-table-row">
                <span>
                  <input
                    type="number"
                    value={cat.order}
                    onChange={(e) => updateOrder(cat.id, parseInt(e.target.value) || 0)}
                    className="order-input"
                    style={{ width: '60px' }}
                  />
                </span>
                <span className="cat-id">{cat.id}</span>
                <span>
                  {cat.icon && <span style={{ marginLeft: '5px' }}>{cat.icon}</span>}
                  {cat.name}
                </span>
                <span className="cat-desc">{cat.description?.substring(0, 40)}</span>
                <span>
                  <button
                    className={`active-toggle ${cat.isActive ? 'active' : ''}`}
                    onClick={() => toggleActive(cat)}
                    title={cat.isActive ? 'تعطيل' : 'تفعيل'}
                  >
                    {cat.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                  </button>
                </span>
                <span className="actions">
                  <button onClick={() => editCategory(cat)} className="icon-btn" title="تعديل">
                    <FiEdit />
                  </button>
                  <button onClick={() => deleteCategory(cat.id, cat.name)} className="icon-btn delete" title="حذف">
                    <FiTrash2 />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
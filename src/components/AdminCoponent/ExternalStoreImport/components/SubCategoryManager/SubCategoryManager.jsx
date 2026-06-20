// src/components/AdminCoponent/ExternalStoreImport/components/SubCategoryManager/SubCategoryManager.jsx
import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, deleteDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../../../../firebase';
import { FiFolder, FiSave, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import Button from '../../../../GeneralComponents/Button/Button';
import Input from '../../../../GeneralComponents/Input/Input';
import ImageUpload from '../../../../GeneralComponents/ImageUpload/ImageUpload';
import { showToast } from '../../../../GeneralComponents/ToastNotification/ToastNotification';
import { generateSlug } from '../../utils/helpers';
import './SubCategoryManager.css';

export function SubCategoryManager({ categoryId, onSubCategoriesChange }) {
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    imageUrl: '',
    description: '',
    available: true,
  });

  const loadSubCategories = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      const q = query(collection(db, `subCategories_${categoryId}`), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubCategories(items);
      if (onSubCategoriesChange) onSubCategoriesChange(items);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل الأقسام الفرعية', 'error');
    } finally {
      setLoading(false);
    }
  }, [categoryId, onSubCategoriesChange]);

  useEffect(() => { loadSubCategories(); }, [loadSubCategories]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const saveSubCategory = async () => {
    if (!formData.name.trim()) {
      showToast('الاسم مطلوب', 'error');
      return;
    }
    if (!formData.slug.trim()) {
      showToast('الـ slug مطلوب', 'error');
      return;
    }
    const existing = subCategories.find(sc => sc.slug === formData.slug && sc.id !== editing);
    if (existing) {
      showToast('هذا الـ slug موجود مسبقاً', 'error');
      return;
    }
    const id = editing || formData.slug;
    const dataToSave = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl,
      available: formData.available,
      order: subCategories.length,
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, `subCategories_${categoryId}`, id), dataToSave, { merge: true });
      showToast(editing ? 'تم التعديل' : 'تمت الإضافة', 'success');
      setEditing(null);
      setFormData({ name: '', slug: '', imageUrl: '', description: '', available: true });
      loadSubCategories();
    } catch (err) {
      console.error(err);
      showToast('فشل الحفظ', 'error');
    }
  };

  const deleteSubCategory = async (id, name) => {
    if (!window.confirm(`حذف "${name}"؟ سيؤثر على المنتجات المرتبطة.`)) return;
    try {
      await deleteDoc(doc(db, `subCategories_${categoryId}`, id));
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

  const editSubCategory = (item) => {
    setEditing(item.id);
    setFormData({
      name: item.name,
      slug: item.slug,
      imageUrl: item.imageUrl || '',
      description: item.description || '',
      available: item.available !== false,
    });
  };

  const toggleAvailable = async (item) => {
    try {
      await setDoc(doc(db, `subCategories_${categoryId}`, item.id), {
        available: !item.available,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      showToast(`${item.name} ${!item.available ? 'تم تفعيله' : 'تم تعطيله'}`, 'success');
      loadSubCategories();
    } catch (err) {
      console.error(err);
      showToast('فشل التحديث', 'error');
    }
  };

  if (loading) return <div className="loading-placeholder">⏳ جاري التحميل...</div>;

  return (
    <div className="subcategory-manager card">
      <h4><FiFolder /> إدارة الأقسام الفرعية ({categoryId === 'games' ? 'ألعاب' : categoryId === 'apps' ? 'تطبيقات' : 'خدمات'})</h4>
      <div className="subcategory-form">
        <Input placeholder="الاسم (مثال: ببجي عالمي)" value={formData.name} onChange={handleNameChange} />
        <Input placeholder="Slug (للرابط)" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })} />
        <Input placeholder="وصف قصير" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        <ImageUpload onUploadComplete={(url) => setFormData({ ...formData, imageUrl: url })} maxSizeMB={0.5} storagePath={`subcategories/${categoryId}`} label="صورة" />
        <label className="checkbox-label"><input type="checkbox" checked={formData.available} onChange={(e) => setFormData({ ...formData, available: e.target.checked })} /> متاح</label>
        <div className="form-actions">
          <Button onClick={saveSubCategory} size="sm"><FiSave /> {editing ? 'تعديل' : 'إضافة'}</Button>
          {editing && <Button onClick={() => { setEditing(null); setFormData({ name: '', slug: '', imageUrl: '', description: '', available: true }); }} variant="outline" size="sm">إلغاء</Button>}
        </div>
      </div>
      <div className="subcategories-list">
        {subCategories.map(item => (
          <div key={item.id} className="subcategory-item">
            {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="subcat-thumb" />}
            <div className="subcat-info">
              <strong>{item.name}</strong>
              <span className="slug">{item.slug}</span>
              {item.description && <p>{item.description}</p>}
            </div>
            <div className="subcat-actions">
              <button onClick={() => toggleAvailable(item)} className="icon-btn">{item.available ? <FiToggleRight color="green" /> : <FiToggleLeft />}</button>
              <button onClick={() => editSubCategory(item)} className="icon-btn"><FiEdit /></button>
              <button onClick={() => deleteSubCategory(item.id, item.name)} className="icon-btn delete"><FiTrash2 /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
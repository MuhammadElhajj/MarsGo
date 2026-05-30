// import { useState, useEffect } from 'react';
// import { db, storage } from '../../../firebase';
// import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
// import Button from '../../GeneralComponents/Button/Button';
// import Input from '../../GeneralComponents/Input/Input';
// import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
// import './AdManagement.css';

// export default function AdManagement() {
//   const [ads, setAds] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingAd, setEditingAd] = useState(null);
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     link: '',
//     image: null,
//     imageUrl: '',
//     isActive: true,
//     order: 0
//   });

//   // 📥 جلب الإعلانات من Firestore
//   const fetchAds = async () => {
//     try {
//       setLoading(true);
//       const q = query(collection(db, 'ads'), orderBy('order', 'asc'));
//       const snapshot = await getDocs(q);
//       const adsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       setAds(adsList);
//     } catch (error) {
//       console.error('خطأ في جلب الإعلانات:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAds();
//   }, []);

//   // 📝 فتح نموذج إضافة إعلان جديد
//   const openAddModal = () => {
//     setEditingAd(null);
//     setFormData({
//       title: '',
//       description: '',
//       link: '',
//       image: null,
//       imageUrl: '',
//       isActive: true,
//       order: ads.length
//     });
//     setIsModalOpen(true);
//   };

//   // ✏️ فتح نموذج تعديل إعلان
//   const openEditModal = (ad) => {
//     setEditingAd(ad);
//     setFormData({
//       title: ad.title || '',
//       description: ad.description || '',
//       link: ad.link || '',
//       image: null,
//       imageUrl: ad.imageUrl || '',
//       isActive: ad.isActive !== false,
//       order: ad.order || 0
//     });
//     setIsModalOpen(true);
//   };

//   // 🖼️ استقبال الصورة من ImageUpload
//   const handleImageReady = (file) => {
//     setFormData(prev => ({ ...prev, image: file }));
//   };

//   // ☁️ رفع الصورة إلى Firebase Storage
//   const uploadImage = async (file) => {
//     if (!file) return null;
//     setIsUploading(true);
//     try {
//       const fileName = `ads/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
//       const imageRef = ref(storage, fileName);
//       await uploadBytes(imageRef, file);
//       const url = await getDownloadURL(imageRef);
//       return url;
//     } catch (error) {
//       console.error('خطأ في رفع الصورة:', error);
//       throw error;
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   // 💾 حفظ الإعلان (إضافة جديدة أو تعديل)
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // التحقق من وجود عنوان
//     if (!formData.title.trim()) {
//       alert('الرجاء إدخال عنوان الإعلان');
//       return;
//     }
    
//     setSubmitLoading(true);
    
//     try {
//       let imageUrl = formData.imageUrl;
      
//       // إذا تم رفع صورة جديدة، نرفعها إلى Storage
//       if (formData.image) {
//         imageUrl = await uploadImage(formData.image);
        
//         // إذا كنا نعدل إعلاناً قديماً، نحذف الصورة القديمة
//         if (editingAd && editingAd.imageUrl && editingAd.imageUrl !== imageUrl) {
//           try {
//             const oldImageRef = ref(storage, editingAd.imageUrl);
//             await deleteObject(oldImageRef);
//           } catch (err) {
//             console.warn('لم نتمكن من حذف الصورة القديمة:', err);
//           }
//         }
//       }
      
//       // تحضير البيانات للحفظ
//       const adData = {
//         title: formData.title,
//         description: formData.description || '',
//         link: formData.link || '',
//         imageUrl: imageUrl || '',
//         isActive: formData.isActive,
//         order: Number(formData.order),
//         updatedAt: new Date()
//       };
      
//       if (editingAd) {
//         // ✏️ تحديث إعلان موجود
//         await updateDoc(doc(db, 'ads', editingAd.id), adData);
//       } else {
//         // ➕ إضافة إعلان جديد
//         adData.createdAt = new Date();
//         await addDoc(collection(db, 'ads'), adData);
//       }
      
//       // إغلاق النموذج وتحديث القائمة
//       setIsModalOpen(false);
//       fetchAds();
      
//     } catch (error) {
//       console.error('خطأ في حفظ الإعلان:', error);
//       alert('حدث خطأ أثناء حفظ الإعلان: ' + error.message);
//     } finally {
//       setSubmitLoading(false);
//     }
//   };

//   // 🗑️ حذف إعلان
//   const handleDelete = async (ad) => {
//     if (window.confirm(`هل أنت متأكد من حذف الإعلان "${ad.title}"؟`)) {
//       try {
//         // حذف الصورة من Storage إذا وجدت
//         if (ad.imageUrl) {
//           try {
//             const imageRef = ref(storage, ad.imageUrl);
//             await deleteObject(imageRef);
//           } catch (err) {
//             console.warn('لم نتمكن من حذف الصورة:', err);
//           }
//         }
//         // حذف المستند من Firestore
//         await deleteDoc(doc(db, 'ads', ad.id));
//         fetchAds();
//       } catch (error) {
//         console.error('خطأ في حذف الإعلان:', error);
//         alert('حدث خطأ أثناء حذف الإعلان');
//       }
//     }
//   };

//   // 🔄 تغيير حالة الإعلان (نشط/غير نشط)
//   const toggleActive = async (ad) => {
//     try {
//       await updateDoc(doc(db, 'ads', ad.id), {
//         isActive: !ad.isActive
//       });
//       fetchAds();
//     } catch (error) {
//       console.error('خطأ في تغيير حالة الإعلان:', error);
//       alert('حدث خطأ في تغيير حالة الإعلان');
//     }
//   };

//   if (loading) {
//     return <div className="ad-management-loading">جاري تحميل الإعلانات...</div>;
//   }

//   return (
//     <div className="ad-management" dir="rtl">
//       <div className="ad-management__header">
//         <h2>📢 إدارة الإعلانات</h2>
//         <Button onClick={openAddModal}>➕ إضافة إعلان جديد</Button>
//       </div>

//       {ads.length === 0 ? (
//         <div className="ad-management__empty">
//           <p>لا توجد إعلانات مضافة حالياً</p>
//           <Button onClick={openAddModal}>إضافة أول إعلان</Button>
//         </div>
//       ) : (
//         <div className="ad-management__table-wrapper">
//           <table className="ad-management__table">
//             <thead>
//               <tr>
//                 <th>الترتيب</th>
//                 <th>الصورة</th>
//                 <th>العنوان</th>
//                 <th>الوصف</th>
//                 <th>الرابط</th>
//                 <th>الحالة</th>
//                 <th>الإجراءات</th>
//               </tr>
//             </thead>
//             <tbody>
//               {ads.map((ad) => (
//                 <tr key={ad.id}>
//                   <td>{ad.order}</td>
//                   <td>
//                     {ad.imageUrl ? (
//                       <img src={ad.imageUrl} alt={ad.title} className="ad-management__thumb" />
//                     ) : (
//                       <span>📢</span>
//                     )}
//                   </td>
//                   <td>{ad.title}</td>
//                   <td>{ad.description || '—'}</td>
//                   <td>
//                     {ad.link ? (
//                       <a href={ad.link} target="_blank" rel="noopener noreferrer">فتح الرابط</a>
//                     ) : '—'}
//                   </td>
//                   <td>
//                     <button
//                       className={`ad-management__status ${ad.isActive ? 'active' : 'inactive'}`}
//                       onClick={() => toggleActive(ad)}
//                     >
//                       {ad.isActive ? 'نشط' : 'غير نشط'}
//                     </button>
//                   </td>
//                   <td>
//                     <Button onClick={() => openEditModal(ad)} variant="primary" className="ad-management__btn">
//                       تعديل
//                     </Button>
//                     <Button onClick={() => handleDelete(ad)} variant="danger" className="ad-management__btn">
//                       حذف
//                     </Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* مودال إضافة/تعديل الإعلان */}
//       {isModalOpen && (
//         <div className="ad-modal-overlay" onClick={() => setIsModalOpen(false)}>
//           <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
//             <div className="ad-modal__header">
//               <h3>{editingAd ? '✏️ تعديل إعلان' : '➕ إضافة إعلان جديد'}</h3>
//               <button className="ad-modal__close" onClick={() => setIsModalOpen(false)}>✕</button>
//             </div>
//             <form onSubmit={handleSubmit} className="ad-modal__form">
//               <Input
//                 label="عنوان الإعلان *"
//                 value={formData.title}
//                 onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
//                 required
//               />
//               <Input
//                 label="الوصف (اختياري)"
//                 value={formData.description}
//                 onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//               />
//               <Input
//                 label="الرابط (URL) - اختياري"
//                 type="url"
//                 value={formData.link}
//                 onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
//                 placeholder="https://example.com"
//               />
//               <Input
//                 label="ترتيب الظهور"
//                 type="number"
//                 value={formData.order}
//                 onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
//               />
              
//               <div className="ad-modal__field">
//                 <label>{formData.imageUrl ? 'تغيير الصورة (اختياري)' : 'صورة الإعلان (اختياري)'}</label>
//                 {formData.imageUrl && !formData.image && (
//                   <div className="ad-modal__current-image">
//                     <img src={formData.imageUrl} alt="الإعلان الحالي" />
//                     <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrl: '', image: null }))}>
//                       حذف الصورة
//                     </button>
//                   </div>
//                 )}
//                 <ImageUpload
//                   label={formData.imageUrl ? 'رفع صورة جديدة' : 'رفع صورة (اختياري)'}
//                   onFileReady={handleImageReady}
//                   maxSizeMB={1}
//                   disabled={submitLoading}
//                 />
//               </div>

//               <div className="ad-modal__checkbox">
//                 <label>
//                   <input
//                     type="checkbox"
//                     checked={formData.isActive}
//                     onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
//                   />
//                   الإعلان نشط
//                 </label>
//               </div>

//               <div className="ad-modal__actions">
//                 <Button type="submit" disabled={submitLoading || isUploading}>
//                   {submitLoading ? (isUploading ? 'جاري رفع الصورة...' : 'جاري الحفظ...') : (editingAd ? 'حفظ التغييرات' : 'إضافة الإعلان')}
//                 </Button>
//                 <Button type="button" variant="danger" onClick={() => setIsModalOpen(false)}>
//                   إلغاء
//                 </Button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


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
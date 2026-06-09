import { useState } from 'react';
import { useServices } from '../../../context/ServicesContext';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import { availableRoutes } from '../../../utils/routesList';
import './AdminServices.css';

// باقة من الإيموجيات التعبيرية المقترحة
const emojiOptions = [
  '💵', '💰', '💳', '🏦', '🌍', '📱', '🎮', '🕹️', '🎯', '⚡', '🔐', '📦', '🚀', '⭐', '💎', '🤖', '📊', '🔄', '✨', '🔮'
];

export default function AdminServices() {
  const { services, addService, updateService, deleteService } = useServices();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    note: '',
    link: availableRoutes[0].path,
    icon: '🔹',
    bgColor: '#4f46e5',
    bgImageUrl: '',
    order: 0,
    isComingSoon: false,
    isActive: true,
  });
  const [uploading, setUploading] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '', description: '', note: '', link: availableRoutes[0].path, icon: '🔹',
      bgColor: '#4f46e5', bgImageUrl: '', order: services.length, isComingSoon: false, isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (service) => {
    setEditing(service);
    setForm({
      name: service.name, description: service.description || '', note: service.note || '',
      link: service.link || availableRoutes[0].path,
      icon: service.icon || '🔹', bgColor: service.bgColor || '#4f46e5',
      bgImageUrl: service.bgImageUrl || service.bgImageBase64 || '', // دعم قديم
      order: service.order, isComingSoon: service.isComingSoon || false,
      isActive: service.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleImageComplete = (url) => setForm(prev => ({ ...prev, bgImageUrl: url }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const data = {
      name: form.name,
      description: form.description,
      note: form.note,
      link: form.link,
      icon: form.icon,
      bgColor: form.bgImageUrl ? '' : form.bgColor, // إذا وجدت صورة نلغي اللون
      bgImageUrl: form.bgImageUrl,
      order: Number(form.order),
      isComingSoon: form.isComingSoon,
      isActive: form.isActive,
    };
    if (editing) {
      await updateService(editing.id, data);
    } else {
      await addService(data);
    }
    setModalOpen(false);
    setUploading(false);
  };

  const handleToggleActive = async (service) => {
    await updateService(service.id, { isActive: !service.isActive });
  };

  const handleEmojiSelect = (emoji) => {
    setForm(prev => ({ ...prev, icon: emoji }));
    setShowEmojiPicker(false);
  };

  return (
    <div className="admin-services">
      <div className="admin-services__header">
        <h2>📦 إدارة خدمات المتجر</h2>
        <Button onClick={openAdd}>➕ إضافة خدمة جديدة</Button>
      </div>

      <div className="admin-services__list">
        {services.map(service => (
          <div key={service.id} className="admin-services__card">
            <div className="admin-services__card-info">
              <span className="admin-services__icon">{service.icon || '🔹'}</span>
              <strong>{service.name}</strong>
              <span className={`status ${service.isActive ? 'active' : 'inactive'}`}>
                {service.isActive ? 'نشط' : 'غير نشط'}
              </span>
              {service.isComingSoon && <span className="coming-soon">قريباً</span>}
            </div>
            <div className="admin-services__card-actions">
              <Button onClick={() => openEdit(service)} variant="primary">تعديل</Button>
              <Button onClick={() => deleteService(service.id)} variant="danger">حذف</Button>
              <Button onClick={() => handleToggleActive(service)}>
                {service.isActive ? 'إلغاء النشاط' : 'تفعيل'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{editing ? '✏️ تعديل خدمة' : '➕ إضافة خدمة جديدة'}</h3>
              <button className="close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal__form">
              <Input label="اسم الخدمة *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <Input label="الوصف المختصر" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <Input label="ملاحظة إضافية (تظهر أسفل الوصف)" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
              
              {/* حقل الرابط كقائمة منسدلة */}
              <div className="input-group">
                <label className="input-label">الرابط (الصفحة التي تنتقل إليها) *</label>
                <select 
                  value={form.link} 
                  onChange={e => setForm({...form, link: e.target.value})}
                  className="input-field"
                  required
                >
                  {availableRoutes.map(route => (
                    <option key={route.path} value={route.path}>{route.label} ({route.path})</option>
                  ))}
                </select>
              </div>

              {/* أيقونة مع زر اختيار الإيموجيات */}
              <div className="input-group">
                <label className="input-label">أيقونة الخدمة</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.8rem', background: 'var(--color-bg-primary)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                    {form.icon || '🔹'}
                  </span>
                  <Button type="button" variant="primary" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    😊 اختيار إيموجي
                  </Button>
                </div>
                {showEmojiPicker && (
                  <div className="emoji-picker">
                    {emojiOptions.map(emoji => (
                      <button key={emoji} type="button" className="emoji-option" onClick={() => handleEmojiSelect(emoji)}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <small className="input-hint">يمكنك أيضاً كتابة أي إيموجي يدوياً في الحقل أدناه</small>
                <input 
                  type="text" 
                  value={form.icon} 
                  onChange={e => setForm({...form, icon: e.target.value})}
                  className="input-field"
                  style={{ marginTop: '0.5rem' }}
                  placeholder="مثلاً: 🎮 أو 💰 أو ⚡"
                />
              </div>

              <Input label="لون الخلفية (إذا لم ترفع صورة)" type="color" value={form.bgColor} onChange={e => setForm({...form, bgColor: e.target.value})} />
              
              <ImageUpload
                label="صورة الخلفية (اختيارية، تغني عن اللون)"
                onUploadComplete={handleImageComplete}
                maxSizeMB={0.5}
                disabled={uploading}
                storagePath="services"
              />
              {form.bgImageUrl && !uploading && (
                <img src={form.bgImageUrl} alt="معاينة" style={{maxWidth: '100px', marginTop: '0.5rem'}} />
              )}

              <Input label="ترتيب الظهور" type="number" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value) || 0})} />
              
              <label style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                <input type="checkbox" checked={form.isComingSoon} onChange={e => setForm({...form, isComingSoon: e.target.checked})} />
                هذه الخدمة "قريباً" (غير متاحة بعد)
              </label>
              <label style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                الخدمة مفعلة (تظهر في المتجر)
              </label>

              <div className="admin-modal__actions">
                <Button type="submit" disabled={uploading}>{uploading ? 'جاري...' : (editing ? 'حفظ' : 'إضافة')}</Button>
                <Button type="button" variant="danger" onClick={() => setModalOpen(false)}>إلغاء</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
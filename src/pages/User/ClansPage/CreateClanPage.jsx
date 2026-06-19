// src/pages/User/ClansPage/CreateClanPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
import { FiUsers, FiLock, FiUnlock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ClansPage.css';

export default function CreateClanPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { createClan } = useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('public');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 3) {
      toast.error('اسم الكلان يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    setLoading(true);
    const result = await createClan({
      name: name.trim(),
      description: description.trim(),
      type,
      imageUrl: imageUrl || null,
    });
    setLoading(false);

    if (result.success) {
      navigate('/clans');
    }
  };

  return (
    <div className="create-clan-page" dir="rtl">
      <div className="create-clan-page__header">
        <GoBackButton text="رجوع" />
        <h1 className="create-clan-page__title">
          <FiUsers className="header-icon" style={{ color: '#8b5cf6' }} />
          إنشاء كلان جديد
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="create-clan-page__form">
        <Input
          label="اسم الكلان *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="أدخل اسم الكلان (3 أحرف على الأقل)"
          required
        />

        <div className="form-group">
          <label>الوصف</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف الكلان (اختياري)"
            rows="3"
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label>نوع الكلان</label>
          <div className="type-selector">
            <button
              type="button"
              className={`type-btn ${type === 'public' ? 'active' : ''}`}
              onClick={() => setType('public')}
            >
              <FiUnlock /> عام
            </button>
            <button
              type="button"
              className={`type-btn ${type === 'private' ? 'active' : ''}`}
              onClick={() => setType('private')}
            >
              <FiLock /> خاص
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>صورة الكلان (اختياري)</label>
          <ImageUpload
            onUploadComplete={setImageUrl}
            maxSizeMB={0.5}
            storagePath="clans"
          />
          {imageUrl && (
            <div className="image-preview">
              <img src={imageUrl} alt="صورة الكلان" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <Button type="submit" disabled={loading} variant="primary">
            {loading ? 'جاري الإنشاء...' : 'إنشاء الكلان'}
          </Button>
          <Button type="button" variant="danger" onClick={() => navigate('/clans')}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
// src/components/AdminCoponent/ContentManager/ContentManager.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import './ContentManager.css';

export default function ContentManager() {
  const { type, itemId } = useParams();
  const navigate = useNavigate();
  const store = useAppStore();

  const fetchContent = type === 'game' ? store.fetchGameContent : store.fetchAppContent;
  const updateContent = type === 'game' ? store.updateGameContent : store.updateAppContent;
  const itemName = type === 'game' ? 'اللعبة' : 'التطبيق';

  const [content, setContent] = useState({
    shortDescription: '',
    shortImages: [],
    longDescription: '',
    longImages: [],
    tips: [],
    videoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTip, setNewTip] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await fetchContent(itemId);
      if (data) {
        setContent({
          shortDescription: data.shortDescription || '',
          shortImages: data.shortImages || [],
          longDescription: data.longDescription || '',
          longImages: data.longImages || [],
          tips: data.tips || [],
          videoUrl: data.videoUrl || '',
        });
      }
      setLoading(false);
    };
    load();
  }, [itemId, fetchContent]);

  const handleAddTip = () => {
    if (newTip.trim()) {
      setContent(prev => ({ ...prev, tips: [...prev.tips, newTip.trim()] }));
      setNewTip('');
    }
  };

  const handleRemoveTip = (index) => {
    setContent(prev => ({
      ...prev,
      tips: prev.tips.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = (field) => (url) => {
    setContent(prev => ({
      ...prev,
      [field]: [...prev[field], url],
    }));
  };

  const handleRemoveImage = (field, index) => {
    setContent(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateContent(itemId, content);
    setSaving(false);
    navigate(`/admin/catalog`);
  };

  if (loading) return <div className="content-loading">جاري تحميل المحتوى...</div>;

  return (
    <div className="content-manager-page">
      <div className="content-manager-page__header">
        <GoBackButton text="رجوع إلى إدارة الكتالوج" onClick={() => navigate('/admin/catalog')} />
        <h2>📝 إدارة المحتوى الإضافي لـ {itemName}</h2>
      </div>

      <div className="content-manager-page__body">
        {/* ===== القسم الأول: وصف مختصر + صور فوق الباقات ===== */}
        <div className="form-section">
          <h3>📌 المحتوى العلوي (يظهر فوق الباقات)</h3>
          <div className="form-group">
            <label>وصف مختصر</label>
            <textarea
              value={content.shortDescription}
              onChange={(e) => setContent(prev => ({ ...prev, shortDescription: e.target.value }))}
              rows="2"
              placeholder="وصف قصير يظهر فوق الباقات..."
            />
          </div>
          <div className="form-group">
            <label>صور (تظهر فوق الباقات)</label>
            <ImageUpload
              onUploadComplete={handleImageUpload('shortImages')}
              maxSizeMB={0.5}
              storagePath={`${type}Content/${itemId}/short`}
            />
            <div className="images-preview">
              {content.shortImages.map((img, idx) => (
                <div key={idx} className="image-item">
                  <img src={img} alt={`صورة ${idx+1}`} />
                  <button onClick={() => handleRemoveImage('shortImages', idx)}><FiX /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== القسم الثاني: وصف طويل + صور تحت الباقات ===== */}
        <div className="form-section">
          <h3>📄 المحتوى السفلي (يظهر تحت الباقات)</h3>
          <div className="form-group">
            <label>وصف طويل</label>
            <textarea
              value={content.longDescription}
              onChange={(e) => setContent(prev => ({ ...prev, longDescription: e.target.value }))}
              rows="6"
              placeholder="وصف تفصيلي طويل يظهر تحت الباقات..."
            />
          </div>
          <div className="form-group">
            <label>صور (تظهر تحت الباقات)</label>
            <ImageUpload
              onUploadComplete={handleImageUpload('longImages')}
              maxSizeMB={0.5}
              storagePath={`${type}Content/${itemId}/long`}
            />
            <div className="images-preview">
              {content.longImages.map((img, idx) => (
                <div key={idx} className="image-item">
                  <img src={img} alt={`صورة ${idx+1}`} />
                  <button onClick={() => handleRemoveImage('longImages', idx)}><FiX /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== القسم الثالث: نصائح وفيديو ===== */}
        <div className="form-section">
          <h3>💡 نصائح وإرشادات</h3>
          <div className="form-group">
            <div className="tips-input">
              <Input value={newTip} onChange={(e) => setNewTip(e.target.value)} placeholder="أضف نصيحة..." />
              <Button onClick={handleAddTip}><FiPlus /> إضافة</Button>
            </div>
            <ul className="tips-list">
              {content.tips.map((tip, idx) => (
                <li key={idx}>
                  <span>{tip}</span>
                  <button onClick={() => handleRemoveTip(idx)}><FiTrash2 /></button>
                </li>
              ))}
            </ul>
          </div>
          <div className="form-group">
            <label>رابط فيديو (YouTube)</label>
            <Input
              value={content.videoUrl}
              onChange={(e) => setContent(prev => ({ ...prev, videoUrl: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>

        <div className="content-manager-page__footer">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'جاري الحفظ...' : '💾 حفظ المحتوى'}
          </Button>
          <Button variant="danger" onClick={() => navigate('/admin/catalog')}>إلغاء</Button>
        </div>
      </div>
    </div>
  );
}
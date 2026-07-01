// src/pages/User/ClansPage/CreateClanPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
import { 
  FiUsers, FiLock, FiUnlock, FiTag, FiImage, FiUser, 
  FiUsers as FiMembers, FiCpu, FiInfo, FiLink,
  FiShield, FiCheckCircle, FiAlertCircle, FiStar, FiHash
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './CreateClanPage.css';

// قائمة الألعاب المدعومة مع إيموجيات
const SUPPORTED_GAMES = [
  { id: 'pubg', name: 'PUBG Mobile', icon: '🎯' },
  { id: 'freefire', name: 'Free Fire', icon: '🔥' },
  { id: 'mlbb', name: 'Mobile Legends', icon: '⚔️' },
  { id: 'cod', name: 'Call of Duty', icon: '🎮' },
  { id: 'genshin', name: 'Genshin Impact', icon: '🗡️' },
  { id: 'other', name: 'أخرى', icon: '🎲' },
];

export default function CreateClanPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { createClan } = useAppStore();

  // الحقول الأساسية
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('public');
  const [game, setGame] = useState('pubg');
  const [maxMembers, setMaxMembers] = useState(50);
  const [requirements, setRequirements] = useState('');

  // الصور
  const [avatarImageUrl, setAvatarImageUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  // حالات
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  // توليد كود دعوة من التاغ
  const generateInviteCode = (tagValue) => {
    return tagValue.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  // معاينة الرابط عند تغيير التاغ
  const handleTagChange = (e) => {
    const raw = e.target.value;
    const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    setTag(clean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 3) {
      toast.error('اسم الكلان يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    if (!tag.trim() || tag.trim().length < 2) {
      toast.error('التاغ (الرمز) يجب أن يكون حرفين على الأقل');
      return;
    }

    if (maxMembers < 2) {
      toast.error('الحد الأدنى للأعضاء هو 2');
      return;
    }

    setLoading(true);

    const clanData = {
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      description: description.trim(),
      type: type,
      game: game,
      maxMembers: maxMembers,
      requirements: requirements.trim(),
      avatarImageUrl: avatarImageUrl,
      coverImageUrl: coverImageUrl,
      inviteCode: generateInviteCode(tag),
    };

    const result = await createClan(clanData);
    setLoading(false);

    if (result.success) {
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/clan/join/${result.clanId}?code=${clanData.inviteCode}`;
      setInviteLink(inviteLink);
      setShowInvite(true);
      toast.success(`✅ تم إنشاء كلان "${name.trim()}" بنجاح!`);

      setTimeout(() => {
        navigate(`/clan/${result.clanId}`);
      }, 3000);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('✅ تم نسخ رابط الدعوة!');
  };

  const goToClan = () => {
    navigate('/clans');
  };

  return (
    <div className="create-clan-page" dir="rtl">
      <div className="create-clan-page__header">
        
        <h1 className="create-clan-page__title">
          <FiUsers className="header-icon" style={{ color: '#8b5cf6' }} />
          إنشاء كلان جديد
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="create-clan-page__form">
        {/* ===== صف الصور (الغلاف + الأفاتار) ===== */}
        <div className="form-row images-row">
          <div className="form-group form-group--half">
            <label className="form-label">
              <FiImage className="form-label-icon" />
              صورة الغلاف <span className="optional">(اختياري)</span>
            </label>
            <div className="image-upload-wrapper">
              <ImageUpload
                onUploadComplete={setCoverImageUrl}
                maxSizeMB={0.8}
                storagePath="clans/covers"
                label="رفع صورة الغلاف"
              />
              {coverImageUrl && (
                <div className="image-preview cover-preview">
                  <img src={coverImageUrl} alt="غلاف الكلان" />
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={() => setCoverImageUrl('')}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group form-group--half">
            <label className="form-label">
              <FiUser className="form-label-icon" />
              شعار الكلان <span className="optional">(اختياري)</span>
            </label>
            <div className="image-upload-wrapper">
              <ImageUpload
                onUploadComplete={setAvatarImageUrl}
                maxSizeMB={0.5}
                storagePath="clans/avatars"
                label="رفع شعار الكلان"
              />
              {avatarImageUrl && (
                <div className="image-preview avatar-preview">
                  <img src={avatarImageUrl} alt="شعار الكلان" />
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={() => setAvatarImageUrl('')}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== الاسم والتاغ ===== */}
        <div className="form-row">
          <div className="form-group form-group--half">
            <label className="form-label">
              اسم الكلان <span className="required">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم الكلان (3 أحرف على الأقل)"
              required
            />
          </div>

          <div className="form-group form-group--half">
            <label className="form-label">
              <FiHash className="form-label-icon" />
              التاغ (الرمز) <span className="required">*</span>
              <span className="helper-text">2-6 أحرف/أرقام</span>
            </label>
            <div className="tag-input-wrapper">
              <span className="tag-prefix">#</span>
              <input
                type="text"
                className="tag-input"
                value={tag}
                onChange={handleTagChange}
                placeholder="MGC"
                maxLength={6}
                required
              />
            </div>
            <small className="field-hint">
              يُستخدم في رابط الدعوة: {window.location.origin}/clan/join/...?code={tag || 'TAG'}
            </small>
          </div>
        </div>

        {/* ===== الوصف ===== */}
        <div className="form-group">
          <label className="form-label">
            <FiInfo className="form-label-icon" />
            الوصف
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف الكلان، الأهداف، القوانين..."
            rows="3"
            className="form-textarea"
          />
        </div>

        {/* ===== نوع الكلان واللعبة ===== */}
        <div className="form-row">
          <div className="form-group form-group--half">
            <label className="form-label">
              نوع الكلان
            </label>
            <div className="type-selector">
              <button
                type="button"
                className={`type-btn ${type === 'public' ? 'active' : ''}`}
                onClick={() => setType('public')}
              >
                <FiUnlock /> عام
                <small>الكلان ظاهر للجميع</small>
              </button>
              <button
                type="button"
                className={`type-btn ${type === 'private' ? 'active' : ''}`}
                onClick={() => setType('private')}
              >
                <FiLock /> خاص
                <small>طلب الانضمام يحتاج موافقة</small>
              </button>
            </div>
          </div>

          <div className="form-group form-group--half">
            <label className="form-label">
              <FiCpu className="form-label-icon" />
              اللعبة الرئيسية
            </label>
            <select 
              value={game} 
              onChange={(e) => setGame(e.target.value)}
              className="form-select"
            >
              {SUPPORTED_GAMES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.icon} {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ===== عدد الأعضاء والمتطلبات ===== */}
        <div className="form-row">
          <div className="form-group form-group--half">
            <label className="form-label">
              <FiMembers className="form-label-icon" />
              الحد الأقصى للأعضاء
            </label>
            <div className="members-input-wrapper">
              <input
                type="number"
                className="form-input"
                value={maxMembers}
                onChange={(e) => setMaxMembers(Math.max(2, parseInt(e.target.value) || 2))}
                min="2"
                max="999"
                required
              />
              <span className="members-suffix">عضو</span>
            </div>
            <small className="field-hint">الحد الأدنى 2، الحد الأعلى 999</small>
          </div>

          <div className="form-group form-group--half">
            <label className="form-label">
              <FiShield className="form-label-icon" />
              متطلبات الانضمام
            </label>
            <input
              type="text"
              className="form-input"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="مثال: المستوى 10+، 100+ ساعة لعب..."
            />
          </div>
        </div>

        {/* ===== أزرار الإجراء ===== */}
        <div className="form-actions">
          <Button type="submit" disabled={loading} variant="primary">
            {loading ? '⏳ جاري الإنشاء...' : '🚀 إنشاء الكلان'}
          </Button>
          <Button type="button" variant="danger" onClick={() => navigate('/clans')}>
            إلغاء
          </Button>
        </div>

        {/* ===== رابط الدعوة بعد الإنشاء ===== */}
        {showInvite && (
          <div className="invite-section">
            <div className="invite-card">
              <div className="invite-header">
                <FiLink className="invite-icon" />
                <h3>🎉 تم إنشاء الكلان بنجاح!</h3>
              </div>
              <div className="invite-link-wrapper">
                <input
                  type="text"
                  className="invite-link-input"
                  value={inviteLink}
                  readOnly
                  dir="ltr"
                />
                <button 
                  type="button" 
                  className="copy-invite-btn"
                  onClick={copyInviteLink}
                >
                  نسخ
                </button>
              </div>
              <p className="invite-hint">
                شارك هذا الرابط مع أصدقائك لدعوتهم للانضمام إلى الكلان
              </p>
              <div className="invite-actions">
                <Button onClick={goToClan} variant="secondary">
                  الذهاب إلى الكلان
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* ===== معاينة الكلان (مباشرة) ===== */}
      <div className="clan-preview-section">
        <h4 className="preview-title">📋 معاينة الكلان</h4>
        <div className="clan-preview-card">
          {coverImageUrl && (
            <div className="preview-cover">
              <img src={coverImageUrl} alt="غلاف" />
            </div>
          )}
          <div className="preview-body">
            <div className="preview-avatar-wrapper">
              {avatarImageUrl ? (
                <img src={avatarImageUrl} alt="شعار" className="preview-avatar" />
              ) : (
                <div className="preview-avatar-placeholder">
                  <FiUsers size={30} />
                </div>
              )}
            </div>
            <div className="preview-info">
              <h3 className="preview-name">
                {name || 'اسم الكلان'} 
                {tag && <span className="preview-tag">#{tag}</span>}
              </h3>
              <div className="preview-meta">
                <span className="preview-type">
                  {type === 'public' ? <FiUnlock /> : <FiLock />}
                  {type === 'public' ? 'عام' : 'خاص'}
                </span>
                <span className="preview-game">
                  {SUPPORTED_GAMES.find(g => g.id === game)?.icon || '🎮'}
                  {SUPPORTED_GAMES.find(g => g.id === game)?.name || game}
                </span>
                <span className="preview-members">
                  <FiUsers /> 1 / {maxMembers}
                </span>
              </div>
              {description && (
                <p className="preview-description">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// src/components/AdminCoponent/AdminMissions/MissionForm/MissionForm.jsx
import { useState, useEffect } from 'react';
import Input from '../../../GeneralComponents/Input/Input';
import Button from '../../../GeneralComponents/Button/Button';
import { FiX } from 'react-icons/fi';
import './MissionForm.css';

// قائمة الأيقونات المتاحة
const AVAILABLE_ICONS = [
  'FiAward', 'FiZap', 'FiUsers', 'FiDollarSign', 'FiShoppingCart',
  'FiStar', 'FiHeart', 'FiBox', 'FiCheckCircle', 'FiClock',
  'FiGift', 'FiCalendar', 'FiTarget'
];

// قائمة العضويات المطلوبة
const MEMBERSHIP_TYPES = [
  { value: '', label: 'بدون (للجميع)' },
  { value: 'adventurer', label: 'مغامر' },
  { value: 'marsgo', label: 'مارسغو' },
  { value: 'master', label: 'المعلم' },
  { value: 'legendary', label: 'الحاج الأسطوري' },
];

// خيارات المدة الزمنية
const DURATION_OPTIONS = [
  { value: 'daily', label: 'يومية (24 ساعة)', days: 1 },
  { value: 'weekly', label: 'أسبوعية (7 أيام)', days: 7 },
  { value: 'biweekly', label: 'أسبوعين (14 يوم)', days: 14 },
  { value: 'ten_days', label: '10 أيام', days: 10 },
  { value: 'monthly', label: 'شهرية (30 يوم)', days: 30 },
];

const iconEmojiMap = {
  FiAward: '🏆', FiZap: '⚡', FiUsers: '👥', FiDollarSign: '💰',
  FiShoppingCart: '🛒', FiStar: '⭐', FiHeart: '❤️', FiBox: '📦',
  FiCheckCircle: '✅', FiClock: '⏰', FiGift: '🎁', FiCalendar: '📅',
  FiTarget: '🎯'
};

export default function MissionForm({ mission, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    icon: 'FiAward',
    target: 10,
    reward: 20,
    color: '#8b5cf6',
    membershipRequired: '',
    order: 0,
    isActive: true,
    duration: 'weekly',
    durationDays: 7,
  });

  useEffect(() => {
    if (mission) {
      setFormData({
        label: mission.label || '',
        description: mission.description || '',
        icon: mission.icon || 'FiAward',
        target: mission.target || 10,
        reward: mission.reward || 20,
        color: mission.color || '#8b5cf6',
        membershipRequired: mission.membershipRequired || '',
        order: mission.order || 0,
        isActive: mission.isActive !== false,
        duration: mission.duration || 'weekly',
        durationDays: mission.durationDays || 7,
      });
    }
  }, [mission]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'duration') {
      const option = DURATION_OPTIONS.find(opt => opt.value === value);
      setFormData(prev => ({
        ...prev,
        duration: value,
        durationDays: option ? option.days : 7,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      alert('الرجاء إدخال اسم المهمة');
      return;
    }
    if (formData.target < 1) {
      alert('الهدف يجب أن يكون أكبر من 0');
      return;
    }
    if (formData.reward < 1) {
      alert('المكافأة يجب أن تكون أكبر من 0');
      return;
    }
    // ✅ استدعاء onSave مع (id, data) بغض النظر عن الحالة
    onSave(mission ? mission.id : null, formData);
  };

  const durationLabel = DURATION_OPTIONS.find(opt => opt.value === formData.duration)?.label || 'أسبوعية';

  return (
    <div className="mission-form">
      <div className="mission-form__header">
        <h3>{mission ? '✏️ تعديل المهمة' : '➕ إضافة مهمة جديدة'}</h3>
        <button className="mission-form__close" onClick={onCancel}>
          <FiX />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mission-form__body">
        <div className="mission-form__grid">
          <Input
            label="اسم المهمة *"
            name="label"
            value={formData.label}
            onChange={handleChange}
            required
          />
          <Input
            label="الوصف"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="وصف المهمة"
          />
          <div className="form-group">
            <label>الأيقونة</label>
            <select name="icon" value={formData.icon} onChange={handleChange} className="form-select">
              {AVAILABLE_ICONS.map(icon => (
                <option key={icon} value={icon}>
                  {iconEmojiMap[icon] || '📌'} {icon}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>اللون</label>
            <input
              type="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="form-color"
            />
          </div>
          <Input
            label="الهدف (عدد مرات الإنجاز)"
            name="target"
            type="number"
            min="1"
            value={formData.target}
            onChange={handleChange}
            required
          />
          <Input
            label="المكافأة (MGC)"
            name="reward"
            type="number"
            min="1"
            value={formData.reward}
            onChange={handleChange}
            required
          />
          <div className="form-group">
            <label>المدة الزمنية *</label>
            <select name="duration" value={formData.duration} onChange={handleChange} className="form-select">
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <small className="form-hint">
              المدة: <strong>{durationLabel}</strong> ({formData.durationDays} يوم)
            </small>
          </div>
          <div className="form-group">
            <label>العضوية المطلوبة</label>
            <select name="membershipRequired" value={formData.membershipRequired} onChange={handleChange} className="form-select">
              {MEMBERSHIP_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="ترتيب العرض"
            name="order"
            type="number"
            min="0"
            value={formData.order}
            onChange={handleChange}
          />
        </div>
        <div className="mission-form__checkbox">
          <label>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            مفعلة
          </label>
        </div>
        <div className="mission-form__actions">
          <Button type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : (mission ? 'تحديث' : 'إضافة')}
          </Button>
          <Button type="button" variant="danger" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
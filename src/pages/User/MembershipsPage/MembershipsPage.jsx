// src/pages/User/MembershipsPage/MembershipsPage.jsx
import { useState } from 'react';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import { 
  FiStar, FiTrendingUp, FiShield, FiAward,
  FiCheckCircle, FiShield as FiShieldAlt
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './MembershipsPage.css';

const MEMBERSHIPS = [
  { 
    id: 'adventurer', 
    name: 'مغامر', 
    price: 150, 
    icon: FiStar, 
    color: '#8b5cf6',
    perks: [
      'أيقونة مميزة بجانب اسمك',
      'مهام إضافية حصرية',
      'غرفة دردشة VIP',
      'خصم 3% على جميع الخدمات'
    ] 
  },
  { 
    id: 'marsgo', 
    name: 'مارسغو', 
    price: 400, 
    icon: FiTrendingUp, 
    color: '#3b82f6',
    perks: [
      'أيقونة فاخرة مميزة',
      'مهام حصرية بربح أعلى',
      'أولوية في الدعم الفني',
      'خصم 5% على جميع الخدمات'
    ] 
  },
  { 
    id: 'master', 
    name: 'المعلم', 
    price: 750, 
    icon: FiShield, 
    color: '#f59e0b',
    perks: [
      'مهام حصرية بجوائز مضاعفة',
      'ترشيح مجاني لسحب الإشراف',
      'خصم 8% على جميع الخدمات',
      'ظهور مميز في لوحة الصدارة'
    ] 
  },
  { 
    id: 'legendary', 
    name: 'الحاج الأسطوري', 
    price: 1400, 
    icon: FiAward, 
    color: '#ef4444',
    perks: [
      'لقب خاص "أسطورة مارسغو"',
      'مهام أسبوعية بجوائز مضاعفة',
      'هدية شهرية 50 MGC',
      'خصم 10% على جميع الخدمات',
      'دعوة خاصة للأحداث الحصرية'
    ] 
  },
];

export default function MembershipsPage() {
  const { userData } = useAuth();
  const { mgcBalance, deductMgcBalance } = useAppStore();
  
  const [membership, setMembership] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(false);

  const purchaseMembership = async (membershipId) => {
    const membershipPlan = MEMBERSHIPS.find(m => m.id === membershipId);
    if (!membershipPlan) return;

    if (mgcBalance < membershipPlan.price) {
      toast.error(`رصيد MGC غير كافٍ! تحتاج ${membershipPlan.price} MGC`);
      return;
    }

    setMembershipLoading(true);
    const success = await deductMgcBalance(membershipPlan.price);
    if (success) {
      setMembership(membershipPlan);
      toast.success(`✅ تم تفعيل عضوية "${membershipPlan.name}" بنجاح!`);
    }
    setMembershipLoading(false);
  };

  return (
    <div className="memberships-page" dir="rtl">
      <div className="memberships-page__header">
        {/* <GoBackButton text="رجوع" /> */}
        <h1 className="memberships-page__title">
          <FiShieldAlt className="header-icon" style={{ color: '#f59e0b' }} />
          العضويات المدفوعة
        </h1>
      </div>

    
      <div className="memberships-page__subtitle">
        <p>ارتقِ بتجربتك مع عضويات مارسغو واحصل على مزايا حصرية ومكافآت مضاعفة</p>
      </div>
  <div className="memberships-page__note">
        <p>💡 جميع العضويات تُفعّل فوراً وتستمر لمدة 30 يوماً من تاريخ الشراء.</p>
      </div>
      <div className="memberships-grid">
        {MEMBERSHIPS.map((m) => {
          const Icon = m.icon;
          const isActive = membership?.id === m.id;

          return (
            <div key={m.id} className={`membership-card ${isActive ? 'active' : ''}`}>
              <div className="membership-card__badge">
                {isActive && <span className="active-badge">✔ مفعلة</span>}
              </div>
              <div className="membership-card__icon-wrapper" style={{ color: m.color }}>
                <Icon className="membership-card__icon" />
              </div>
              <h3 className="membership-card__name">{m.name}</h3>
              <div className="membership-card__price">{m.price} MGC</div>
              <ul className="membership-card__perks">
                {m.perks.map((perk, idx) => (
                  <li key={idx}>
                    <FiCheckCircle className="perk-icon" style={{ color: m.color }} />
                    {perk}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => purchaseMembership(m.id)}
                disabled={membershipLoading || isActive}
                className={`membership-card__btn ${isActive ? 'active' : ''}`}
                style={{ 
                  background: isActive ? 'var(--color-bg-secondary)' : m.color,
                  borderColor: isActive ? 'var(--color-border)' : m.color,
                  color: isActive ? 'var(--color-text-secondary)' : '#fff',
                }}
              >
                {isActive ? '✔ مفعلة' : membershipLoading ? '⏳ جاري...' : 'اشتر الآن'}
              </Button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
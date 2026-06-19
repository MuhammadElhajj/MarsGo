// src/pages/User/QuestsPage/QuestsPage.jsx
import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import { 
  FiAward, FiZap, FiUsers, FiDollarSign, FiShoppingBag, // ✅ استخدمنا FiShoppingBag بدلاً من FiPackage
  FiCheckCircle, FiClock, FiTrendingUp, FiStar, FiShield,
  FiGift, FiCalendar
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './QuestsPage.css';

const WEEKLY_QUESTS = [
  { id: 'wheel', label: 'الدولاب', description: 'أكمل 20 دورة في دولاب الحظ', icon: FiAward, target: 20, reward: 20, progress: 0, completed: false },
  { id: 'machine', label: 'ماكينة الحظ', description: 'العب ماكينة الحظ 10 مرات', icon: FiZap, target: 10, reward: 20, progress: 0, completed: false },
  { id: 'referral', label: 'دعوة الأصدقاء', description: 'ادعُ 5 أصدقاء جدد للتسجيل', icon: FiUsers, target: 5, reward: 100, progress: 0, completed: false },
  { id: 'deposit', label: 'الإيداع', description: 'قم بإيداع 20 دولار في رصيدك', icon: FiDollarSign, target: 20, reward: 20, progress: 0, completed: false },
  { id: 'orders', label: 'الطلبات', description: 'أتمم 5 طلبات شراء', icon: FiShoppingBag, target: 5, reward: 20, progress: 0, completed: false }, // ✅ تم التعديل هنا
];

const MEMBERSHIPS = [
  { id: 'adventurer', name: 'مغامر', price: 150, icon: FiStar, perks: ['أيقونة مميزة', 'مهام إضافية', 'غرفة دردشة VIP'] },
  { id: 'marsgo', name: 'مارسغو', price: 400, icon: FiTrendingUp, perks: ['أيقونة فاخرة', 'مهام حصرية بربح أعلى', 'أولوية في الدعم'] },
  { id: 'master', name: 'المعلم', price: 750, icon: FiShield, perks: ['مهام حصرية بجوائز مضاعفة', 'ترشيح مجاني لسحب الإشراف'] },
  { id: 'legendary', name: 'الحاج الأسطوري', price: 1400, icon: FiAward, perks: ['لقب خاص "أسطورة مارسغو"', 'مهام أسبوعية بجوائز مضاعفة', 'هدية شهرية 50 MGC'] },
];

export default function QuestsPage() {
  const { userData } = useAuth();
  const { mgcBalance, addMgcBalance, deductMgcBalance } = useAppStore();
  
  const [quests, setQuests] = useState(WEEKLY_QUESTS);
  const [completedQuestsCount, setCompletedQuestsCount] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);
  const [claimedQuests, setClaimedQuests] = useState([]);
  
  const [membership, setMembership] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(false);

  useEffect(() => {
    const savedQuests = localStorage.getItem('weeklyQuests');
    if (savedQuests) {
      const parsed = JSON.parse(savedQuests);
      const lastReset = localStorage.getItem('questsResetDate');
      const today = new Date().toDateString();
      if (lastReset === today) {
        setQuests(parsed);
      } else {
        resetQuests();
      }
    } else {
      resetQuests();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('weeklyQuests', JSON.stringify(quests));
    const completed = quests.filter(q => q.completed).length;
    setCompletedQuestsCount(completed);
    const total = quests.reduce((sum, q) => sum + (q.completed ? q.reward : 0), 0);
    setTotalRewards(total);
  }, [quests]);

  const resetQuests = () => {
    const reset = WEEKLY_QUESTS.map(q => ({ ...q, progress: 0, completed: false }));
    setQuests(reset);
    localStorage.setItem('questsResetDate', new Date().toDateString());
    setClaimedQuests([]);
  };

  const updateQuestProgress = (questId, increment = 1) => {
    setQuests(prev => prev.map(q => {
      if (q.id === questId && !q.completed) {
        const newProgress = Math.min(q.progress + increment, q.target);
        const completed = newProgress >= q.target;
        return { ...q, progress: newProgress, completed };
      }
      return q;
    }));
  };

  const claimReward = (questId) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.completed || claimedQuests.includes(questId)) return;

    addMgcBalance(userData.uid, quest.reward);
    setClaimedQuests(prev => [...prev, questId]);
    toast.success(`✅ حصلت على ${quest.reward} MGC عن مهمة "${quest.label}"!`);

    setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));
  };

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
    <div className="quests-page" dir="rtl">
      <div className="quests-page__header">
        <GoBackButton text="رجوع" />
        <h1 className="quests-page__title">
          <FiCalendar className="header-icon" style={{ color: '#f59e0b' }} />
          المهام الأسبوعية
        </h1>
      </div>

      <div className="quests-page__stats">
        <div className="stat-item">
          <FiCheckCircle className="stat-icon" style={{ color: '#10b981' }} />
          <span className="stat-value">{completedQuestsCount}/{quests.length}</span>
          <span className="stat-label">مهام مكتملة</span>
        </div>
        <div className="stat-item">
          <FiGift className="stat-icon" style={{ color: '#f59e0b' }} />
          <span className="stat-value">{totalRewards} MGC</span>
          <span className="stat-label">إجمالي المكافآت</span>
        </div>
        <div className="stat-item">
          <FiClock className="stat-icon" style={{ color: '#8b5cf6' }} />
          <span className="stat-value">7 أيام</span>
          <span className="stat-label">متبقي</span>
        </div>
      </div>

      <div className="quests-page__list">
        {quests.map((quest) => {
          const isCompleted = quest.completed;
          const isClaimed = claimedQuests.includes(quest.id);
          const progressPercent = Math.min((quest.progress / quest.target) * 100, 100);
          const Icon = quest.icon;

          return (
            <div key={quest.id} className={`quest-card ${isCompleted ? 'completed' : ''}`}>
              <div className="quest-card__header">
                <div className="quest-card__icon">
                  <Icon style={{ color: isCompleted ? '#10b981' : 'var(--color-accent)' }} />
                </div>
                <div className="quest-card__info">
                  <h3 className="quest-card__title">{quest.label}</h3>
                  <p className="quest-card__description">{quest.description}</p>
                </div>
                <div className="quest-card__reward">
                  <span className="reward-amount">{quest.reward} MGC</span>
                </div>
              </div>
              <div className="quest-card__progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="progress-label">
                  <span>{quest.progress}/{quest.target}</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
              </div>
              <div className="quest-card__actions">
                {isCompleted && !isClaimed ? (
                  <Button onClick={() => claimReward(quest.id)} variant="primary" className="claim-btn">
                    <FiCheckCircle /> طالب بالمكافأة
                  </Button>
                ) : isClaimed ? (
                  <span className="claimed-badge">✓ مكتملة</span>
                ) : (
                  <Button onClick={() => updateQuestProgress(quest.id, 1)} variant="secondary" className="progress-btn">
                    تقدم ({quest.progress}/{quest.target})
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="quests-page__memberships">
        <h2 className="memberships-title">
          <FiShield className="title-icon" style={{ color: '#f59e0b' }} />
          العضويات المدفوعة
        </h2>
        <div className="memberships-grid">
          {MEMBERSHIPS.map((m) => {
            const Icon = m.icon;
            const isActive = membership?.id === m.id;
            return (
              <div key={m.id} className={`membership-card ${isActive ? 'active' : ''}`}>
                <div className="membership-card__header">
                  <Icon className="membership-icon" style={{ color: isActive ? '#f59e0b' : 'var(--color-accent)' }} />
                  <h3 className="membership-name">{m.name}</h3>
                  <span className="membership-price">{m.price} MGC</span>
                </div>
                <ul className="membership-perks">
                  {m.perks.map((perk, idx) => (
                    <li key={idx}><FiCheckCircle className="perk-icon" /> {perk}</li>
                  ))}
                </ul>
                <Button
                  onClick={() => purchaseMembership(m.id)}
                  disabled={membershipLoading || isActive}
                  className={`membership-btn ${isActive ? 'active' : ''}`}
                >
                  {isActive ? '✔ مفعلة' : membershipLoading ? 'جاري...' : 'اشتر الآن'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
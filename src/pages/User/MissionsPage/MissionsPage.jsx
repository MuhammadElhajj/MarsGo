// src/pages/User/MissionsPage/MissionsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import { 
  FiAward, FiZap, FiUsers, FiDollarSign, FiShoppingCart,
  FiCheckCircle, FiClock, FiGift, FiCalendar, FiTarget,
  FiLock, FiUnlock, FiShield
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './MissionsPage.css';

// ============================================================
// تعريف المهام الأساسية + المهام المحجوبة للعضويات
// ============================================================
const WEEKLY_QUESTS = [
  // ===== مهام مجانية (للجميع) =====
  { 
    id: 'wheel', 
    label: 'الدولاب', 
    description: 'أكمل 20 دورة في دولاب الحظ',
    icon: FiAward, 
    target: 20, 
    reward: 20,
    color: '#8b5cf6',
    membershipRequired: null, // لا تحتاج عضوية
  },
  { 
    id: 'machine', 
    label: 'ماكينة الحظ', 
    description: 'العب ماكينة الحظ 10 مرات',
    icon: FiZap, 
    target: 10, 
    reward: 20,
    color: '#f59e0b',
    membershipRequired: null,
  },
  { 
    id: 'referral', 
    label: 'دعوة الأصدقاء', 
    description: 'ادعُ 5 أصدقاء جدد للتسجيل',
    icon: FiUsers, 
    target: 5, 
    reward: 100,
    color: '#3b82f6',
    membershipRequired: null,
  },
  { 
    id: 'deposit', 
    label: 'الإيداع', 
    description: 'قم بإيداع 20 دولار في رصيدك',
    icon: FiDollarSign, 
    target: 20, 
    reward: 20,
    color: '#10b981',
    membershipRequired: null,
  },
  { 
    id: 'orders', 
    label: 'الطلبات', 
    description: 'أتمم 5 طلبات شراء',
    icon: FiShoppingCart, 
    target: 5, 
    reward: 20,
    color: '#ef4444',
    membershipRequired: null,
  },

  // ===== مهام محجوبة (تحتاج عضوية) =====
  { 
    id: 'vip_wheel', 
    label: 'الدولاب الذهبي', 
    description: 'أكمل 30 دورة في الدولاب الذهبي (VIP)',
    icon: FiAward, 
    target: 30, 
    reward: 50,
    color: '#fbbf24',
    membershipRequired: 'adventurer', // يتطلب عضوية "مغامر"
  },
  { 
    id: 'vip_machine', 
    label: 'ماكينة VIP', 
    description: 'العب ماكينة الحظ VIP 15 مرة',
    icon: FiZap, 
    target: 15, 
    reward: 50,
    color: '#f472b6',
    membershipRequired: 'marsgo', // يتطلب عضوية "مارسغو"
  },
  { 
    id: 'vip_referral', 
    label: 'دعوة VIP', 
    description: 'ادعُ 10 أصدقاء جدد للتسجيل (VIP)',
    icon: FiUsers, 
    target: 10, 
    reward: 150,
    color: '#60a5fa',
    membershipRequired: 'master', // يتطلب عضوية "المعلم"
  },
];

// ============================================================
// المكون الرئيسي
// ============================================================
export default function MissionsPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { 
    addMgcBalance, 
    mgcBalance,
    // دوال التقدم المفترض إضافتها في الـ Store
    // getQuestsProgress, // تجلب التقدم من Firestore/localStorage
    // updateQuestProgress, // تحديث التقدم (تستدعى من أنشطة المستخدم)
    // claimQuestReward, // صرف المكافأة
  } = useAppStore();

  // ===== حالة المهام =====
  const [quests, setQuests] = useState(() => 
    WEEKLY_QUESTS.map(q => ({ 
      ...q, 
      progress: 0, 
      completed: false,
      claimed: false,
      locked: !!q.membershipRequired, // مقفلة إذا كانت تحتاج عضوية
    }))
  );
  const [loading, setLoading] = useState(true);
  const [userMembership, setUserMembership] = useState(null); // يمكن جلبها من userData

  // ===== حساب الإحصائيات =====
  const totalQuests = quests.length;
  const completedQuests = quests.filter(q => q.completed).length;
  const totalRewards = quests.reduce((sum, q) => sum + (q.completed ? q.reward : 0), 0);
  const progressPercent = Math.round((completedQuests / totalQuests) * 100);

  // ===== تحميل المهام من localStorage =====
  useEffect(() => {
    const loadQuests = () => {
      try {
        const savedQuests = localStorage.getItem('weeklyQuests_v2');
        const lastReset = localStorage.getItem('questsResetDate_v2');
        const today = new Date().toDateString();

        if (savedQuests && lastReset === today) {
          const parsed = JSON.parse(savedQuests);
          const merged = WEEKLY_QUESTS.map(q => {
            const saved = parsed.find(p => p.id === q.id);
            return saved 
              ? { ...q, ...saved, locked: !!q.membershipRequired }
              : { ...q, progress: 0, completed: false, claimed: false, locked: !!q.membershipRequired };
          });
          setQuests(merged);
        } else {
          resetQuests();
        }
      } catch (error) {
        console.warn('فشل تحميل المهام، إعادة تعيين:', error);
        resetQuests();
      } finally {
        setLoading(false);
      }
    };

    // تحديد عضوية المستخدم (مفترض أن تكون في userData)
    if (userData?.membership) {
      setUserMembership(userData.membership);
    }

    loadQuests();
  }, [userData]);

  // ===== حفظ المهام عند التغيير =====
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('weeklyQuests_v2', JSON.stringify(quests));
      localStorage.setItem('questsResetDate_v2', new Date().toDateString());
    }
  }, [quests, loading]);

  // ===== إعادة تعيين المهام =====
  const resetQuests = useCallback(() => {
    const reset = WEEKLY_QUESTS.map(q => ({ 
      ...q, 
      progress: 0, 
      completed: false, 
      claimed: false,
      locked: !!q.membershipRequired,
    }));
    setQuests(reset);
    localStorage.setItem('questsResetDate_v2', new Date().toDateString());
  }, []);

  // ===== تحديث تقدم المهمة (تُستدعى من أنشطة المستخدم) =====
  // هذه الدالة ستُستدعى من خارج الصفحة (مثلاً عند اللعب أو الشراء)
  // وتقوم بتحديث التقدم تلقائياً.
  const updateProgress = useCallback((questId, increment = 1) => {
    setQuests(prev => prev.map(q => {
      if (q.id === questId && !q.completed && !q.claimed && !q.locked) {
        const newProgress = Math.min(q.progress + increment, q.target);
        const completed = newProgress >= q.target;
        return { ...q, progress: newProgress, completed };
      }
      return q;
    }));
  }, []);

  // ===== صرف المكافأة =====
  const claimReward = useCallback((questId) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed || quest.locked) {
      toast.error('هذه المهمة غير قابلة للمطالبة');
      return;
    }

    addMgcBalance(userData.uid, quest.reward);
    setQuests(prev => prev.map(q => 
      q.id === questId ? { ...q, claimed: true } : q
    ));
    toast.success(`✅ حصلت على ${quest.reward} MGC عن مهمة "${quest.label}"!`);
  }, [quests, addMgcBalance, userData]);

  // ===== التحقق مما إذا كانت العضوية مملوكة =====
  const hasMembership = (membershipId) => {
    // يمكن التحقق من userData أو من حالة الـ Store
    return userMembership === membershipId;
  };

  // ===== عرض حالة التحميل =====
  if (loading) {
    return (
      <div className="missions-page-loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل المهام...</p>
      </div>
    );
  }

  return (
    <div className="missions-page" dir="rtl">
      {/* ===== الهيدر ===== */}
      <div className="missions-page__header">
        <GoBackButton text="رجوع" />
        <h1 className="missions-page__title">
          <FiCalendar className="header-icon" style={{ color: '#f59e0b' }} />
          المهام الأسبوعية
        </h1>
      </div>

      {/* ===== الإحصائيات ===== */}
      <div className="missions-page__stats">
        <div className="stat-item">
          <FiCheckCircle className="stat-icon" style={{ color: '#10b981' }} />
          <span className="stat-value">{completedQuests}/{totalQuests}</span>
          <span className="stat-label">مهام مكتملة</span>
        </div>
        <div className="stat-item">
          <FiGift className="stat-icon" style={{ color: '#f59e0b' }} />
          <span className="stat-value">{totalRewards} MGC</span>
          <span className="stat-label">مكافآت متاحة</span>
        </div>
        <div className="stat-item">
          <FiTarget className="stat-icon" style={{ color: '#8b5cf6' }} />
          <span className="stat-value">{progressPercent}%</span>
          <span className="stat-label">تقدم</span>
        </div>
      </div>

      {/* ===== قائمة المهام ===== */}
      <div className="missions-page__list">
        {quests.map((quest) => {
          const isLocked = quest.locked && !hasMembership(quest.membershipRequired);
          const isCompleted = quest.completed && !isLocked;
          const isClaimed = quest.claimed;
          const progressPercent = Math.min((quest.progress / quest.target) * 100, 100);
          const Icon = quest.icon;

          return (
            <div 
              key={quest.id} 
              className={`mission-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
            >
              <div className="mission-card__header">
                <div 
                  className="mission-card__icon"
                  style={{ color: isLocked ? '#9ca3af' : (isCompleted ? '#10b981' : quest.color) }}
                >
                  {isLocked ? <FiLock /> : <Icon />}
                </div>
                <div className="mission-card__info">
                  <h3 className="mission-card__title">
                    {quest.label}
                    {isLocked && (
                      <span className="lock-badge">
                        <FiLock /> {quest.membershipRequired === 'adventurer' && 'مغامر'}
                        {quest.membershipRequired === 'marsgo' && 'مارسغو'}
                        {quest.membershipRequired === 'master' && 'المعلم'}
                      </span>
                    )}
                  </h3>
                  <p className="mission-card__description">{quest.description}</p>
                </div>
                <div className="mission-card__reward">
                  <span className="reward-amount">+{quest.reward} MGC</span>
                </div>
              </div>

              <div className="mission-card__progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${progressPercent}%`,
                      background: isLocked 
                        ? '#e5e7eb' 
                        : (isCompleted 
                          ? 'linear-gradient(90deg, #10b981, #34d399)' 
                          : `linear-gradient(90deg, ${quest.color}, ${quest.color}dd)`)
                    }}
                  />
                </div>
                <div className="progress-label">
                  <span>{isLocked ? '🔒' : `${quest.progress}/${quest.target}`}</span>
                  <span>{isLocked ? 'مقفلة' : `${Math.round(progressPercent)}%`}</span>
                </div>
              </div>

              <div className="mission-card__actions">
                {isLocked ? (
                  <Button 
                    onClick={() => navigate('/memberships')} 
                    variant="secondary" 
                    className="upgrade-btn"
                  >
                    <FiShield /> احصل على العضوية
                  </Button>
                ) : isCompleted && !isClaimed ? (
                  <Button 
                    onClick={() => claimReward(quest.id)} 
                    variant="primary" 
                    className="claim-btn"
                  >
                    <FiCheckCircle /> طالب بالمكافأة
                  </Button>
                ) : isClaimed ? (
                  <span className="claimed-badge">
                    <FiCheckCircle /> ✓ مكتملة
                  </span>
                ) : (
                  <span className="progress-text">
                    <FiClock /> قيد التقدم
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// src/pages/User/MissionsPage/MissionsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import Button from '../../../components/GeneralComponents/Button/Button';
import { 
  FiAward, FiZap, FiUsers, FiDollarSign, FiShoppingCart,
  FiCheckCircle, FiClock, FiGift, FiCalendar, FiTarget,
  FiLock, FiShield, FiStar, FiHeart, FiBox, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './MissionsPage.css';

// خريطة الأيقونات
const iconMap = {
  FiAward: FiAward, FiZap: FiZap, FiUsers: FiUsers,
  FiDollarSign: FiDollarSign, FiShoppingCart: FiShoppingCart,
  FiStar: FiStar, FiHeart: FiHeart, FiBox: FiBox,
  FiCheckCircle: FiCheckCircle, FiClock: FiClock,
  FiGift: FiGift, FiCalendar: FiCalendar, FiTarget: FiTarget,
  FiLock: FiLock, FiShield: FiShield,
};

// تسميات المدة
const durationLabels = {
  daily: 'يومية',
  weekly: 'أسبوعية',
  biweekly: 'أسبوعين',
  ten_days: '10 أيام',
  monthly: 'شهرية',
};

export default function MissionsPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { addMgcBalance } = useAppStore();

  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMembership, setUserMembership] = useState(null);
  const [fetchError, setFetchError] = useState(false);

  // حساب الوقت المتبقي للمهمة
  const getRemainingTime = useCallback((quest) => {
    if (!quest.startDate) return null;
    
    const start = new Date(quest.startDate);
    const now = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + (quest.durationDays || 7));
    
    const remaining = end - now;
    
    if (remaining <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0 };
    }
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return { expired: false, days, hours, minutes };
  }, []);

  // جلب المهام من Firestore
  const fetchQuests = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      // ✅ محاولة جلب المهام مع التصفية
      const q = query(
        collection(db, 'quests'),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      const questsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        icon: iconMap[doc.data().icon] || FiAward,
        progress: 0,
        completed: false,
        claimed: false,
        locked: !!doc.data().membershipRequired,
        remainingTime: null,
        isExpired: false,
      }));
      
      // حساب الوقت المتبقي لكل مهمة
      questsData.forEach(q => {
        const remaining = getRemainingTime(q);
        if (remaining) {
          q.remainingTime = remaining;
          q.isExpired = remaining.expired;
        }
      });
      
      // تحميل التقدم من localStorage
      const savedProgress = localStorage.getItem('weeklyQuestsProgress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem('questsResetDate');
        
        if (lastReset === today) {
          questsData.forEach(q => {
            const saved = parsed.find(p => p.id === q.id);
            if (saved) {
              q.progress = saved.progress || 0;
              q.completed = saved.completed || false;
              q.claimed = saved.claimed || false;
            }
          });
        }
      }
      
      setQuests(questsData);
    } catch (err) {
      console.error('خطأ في جلب المهام:', err);
      
      // ✅ إذا كان الخطأ بسبب الصلاحيات، نحاول جلب المهام بدون تصفية isActive
      if (err.code === 'permission-denied' || err.message.includes('permissions')) {
        try {
          // محاولة ثانية: جلب جميع المهام دون شرط isActive
          const fallbackQuery = query(collection(db, 'quests'), orderBy('order', 'asc'));
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const fallbackData = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            icon: iconMap[doc.data().icon] || FiAward,
            progress: 0,
            completed: false,
            claimed: false,
            locked: !!doc.data().membershipRequired,
            remainingTime: null,
            isExpired: false,
          }));
          
          // تصفية المهام النشطة يدوياً
          const activeQuests = fallbackData.filter(q => q.isActive !== false);
          
          // حساب الوقت المتبقي
          activeQuests.forEach(q => {
            const remaining = getRemainingTime(q);
            if (remaining) {
              q.remainingTime = remaining;
              q.isExpired = remaining.expired;
            }
          });
          
          // تحميل التقدم من localStorage
          const savedProgressFallback = localStorage.getItem('weeklyQuestsProgress');
          if (savedProgressFallback) {
            const parsed = JSON.parse(savedProgressFallback);
            const today = new Date().toDateString();
            const lastReset = localStorage.getItem('questsResetDate');
            if (lastReset === today) {
              activeQuests.forEach(q => {
                const saved = parsed.find(p => p.id === q.id);
                if (saved) {
                  q.progress = saved.progress || 0;
                  q.completed = saved.completed || false;
                  q.claimed = saved.claimed || false;
                }
              });
            }
          }
          
          setQuests(activeQuests);
          toast.info('تم تحميل المهام بنجاح (معالجة بديلة)', { duration: 3000 });
          return;
        } catch (fallbackErr) {
          console.error('فشل المحاولة البديلة:', fallbackErr);
          setFetchError(true);
          toast.error('لا يمكن تحميل المهام حالياً. يرجى المحاولة لاحقاً.');
        }
      } else {
        setFetchError(true);
        toast.error('فشل تحميل المهام');
      }
    } finally {
      setLoading(false);
    }
  }, [getRemainingTime]);

  // تحديث التقدم كل دقيقة (لتحديث الوقت المتبقي)
  useEffect(() => {
    const interval = setInterval(() => {
      setQuests(prev => prev.map(q => {
        const remaining = getRemainingTime(q);
        return {
          ...q,
          remainingTime: remaining || null,
          isExpired: remaining ? remaining.expired : false,
        };
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, [getRemainingTime]);

  // تحديد عضوية المستخدم
  useEffect(() => {
    if (userData?.membership) {
      setUserMembership(userData.membership);
    }
    fetchQuests();
  }, [userData, fetchQuests]);

  // حفظ التقدم
  useEffect(() => {
    if (!loading && quests.length > 0) {
      const progress = quests.map(q => ({
        id: q.id,
        progress: q.progress,
        completed: q.completed,
        claimed: q.claimed,
      }));
      localStorage.setItem('weeklyQuestsProgress', JSON.stringify(progress));
    }
  }, [quests, loading]);

  // حساب الإحصائيات
  const totalQuests = quests.length;
  const completedQuests = quests.filter(q => q.completed).length;
  const totalRewards = quests.reduce((sum, q) => sum + (q.completed ? q.reward : 0), 0);
  const progressPercent = Math.round((completedQuests / totalQuests) * 100) || 0;

  // صرف المكافأة
  const claimReward = useCallback((questId) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed || quest.locked) {
      toast.error('هذه المهمة غير قابلة للمطالبة');
      return;
    }
    
    if (quest.isExpired) {
      toast.error('انتهت صلاحية هذه المهمة');
      return;
    }

    addMgcBalance(userData.uid, quest.reward);
    setQuests(prev => prev.map(q => 
      q.id === questId ? { ...q, claimed: true } : q
    ));
    toast.success(`✅ حصلت على ${quest.reward} MGC عن مهمة "${quest.label}"!`);
  }, [quests, addMgcBalance, userData]);

  const hasMembership = (membershipId) => {
    if (!membershipId) return true;
    return userMembership === membershipId;
  };

  // تنسيق الوقت المتبقي
  const formatRemainingTime = (remaining) => {
    if (!remaining) return null;
    if (remaining.expired) return 'انتهت';
    if (remaining.days > 0) return `${remaining.days} يوم`;
    if (remaining.hours > 0) return `${remaining.hours} ساعة`;
    return `${remaining.minutes} دقيقة`;
  };

  if (loading) {
    return (
      <div className="missions-page-loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل المهام...</p>
      </div>
    );
  }

  // ✅ عرض رسالة خطأ عند فشل التحميل
  if (fetchError) {
    return (
      <div className="missions-page-loading" style={{ minHeight: '400px' }}>
        <FiAlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
          تعذر تحميل المهام
        </p>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          يرجى المحاولة مرة أخرى لاحقاً أو الاتصال بالدعم.
        </p>
        <Button onClick={fetchQuests} style={{ marginTop: '1rem' }}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="missions-page" dir="rtl">
      <div className="missions-page__header">
        <h1 className="missions-page__title">
          <FiCalendar className="missions-page__title-icon" />
          المهام
        </h1>
      </div>

      <div className="missions-page__stats">
        <div className="stat-item">
          <FiCheckCircle className="stat-icon" />
          <span className="stat-value">{completedQuests}/{totalQuests}</span>
          <span className="stat-label">مهام مكتملة</span>
        </div>
        <div className="stat-item">
          <FiGift className="stat-icon" />
          <span className="stat-value">{totalRewards} MGC</span>
          <span className="stat-label">مكافآت متاحة</span>
        </div>
        <div className="stat-item">
          <FiTarget className="stat-icon" />
          <span className="stat-value">{progressPercent}%</span>
          <span className="stat-label">تقدم</span>
        </div>
      </div>

      <div className="missions-page__list">
        {quests.length === 0 ? (
          <div className="missions-empty">
            <p>لا توجد مهام متاحة حالياً</p>
          </div>
        ) : (
          quests.map((quest) => {
            const isLocked = quest.locked && !hasMembership(quest.membershipRequired);
            const isCompleted = quest.completed && !isLocked && !quest.isExpired;
            const isClaimed = quest.claimed;
            const isExpired = quest.isExpired;
            const progressPercent = Math.min((quest.progress / quest.target) * 100, 100);
            const Icon = quest.icon;
            const remainingText = formatRemainingTime(quest.remainingTime);
            const durationLabel = durationLabels[quest.duration] || quest.duration || 'أسبوعية';

            return (
              <div 
                key={quest.id} 
                className={`mission-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${isExpired ? 'expired' : ''}`}
              >
                <div className="mission-card__header">
                  <div 
                    className="mission-card__icon"
                    style={{ color: isLocked || isExpired ? 'var(--color-text-secondary)' : (isCompleted ? '#10b981' : quest.color) }}
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
                          {quest.membershipRequired === 'legendary' && 'الحاج الأسطوري'}
                        </span>
                      )}
                      {isExpired && (
                        <span className="expired-badge">
                          <FiAlertCircle /> منتهية
                        </span>
                      )}
                    </h3>
                    <p className="mission-card__description">{quest.description}</p>
                  </div>
                  <div className="mission-card__reward">
                    <span className="reward-amount">+{quest.reward} MGC</span>
                  </div>
                </div>

                <div className="mission-card__meta">
                  <span className="mission-card__duration">
                    <FiClock className="duration-icon" />
                    {durationLabel}
                    {remainingText && (
                      <span className={`remaining-time ${isExpired ? 'expired' : ''}`}>
                        {isExpired ? '⏰ منتهية' : `⏳ ${remainingText}`}
                      </span>
                    )}
                  </span>
                </div>

                <div className="mission-card__progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${progressPercent}%`,
                        background: isLocked || isExpired 
                          ? 'var(--color-border)' 
                          : (isCompleted 
                            ? 'linear-gradient(90deg, #10b981, #34d399)' 
                            : `linear-gradient(90deg, ${quest.color}, ${quest.color}dd)`)
                      }}
                    />
                  </div>
                  <div className="progress-label">
                    <span>{isLocked || isExpired ? '🔒' : `${quest.progress}/${quest.target}`}</span>
                    <span>{isLocked || isExpired ? 'مقفلة' : `${Math.round(progressPercent)}%`}</span>
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
                  ) : isExpired ? (
                    <span className="expired-text">
                      <FiAlertCircle /> انتهت صلاحية المهمة
                    </span>
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
                      <FiCheckCircle /> مكتملة
                    </span>
                  ) : (
                    <span className="progress-text">
                      <FiClock /> قيد التقدم
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
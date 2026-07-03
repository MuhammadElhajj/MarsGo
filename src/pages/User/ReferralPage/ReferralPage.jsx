// src/pages/User/ReferralPage/ReferralPage.jsx
import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/GeneralComponents/Button/Button';
import ReferralCard from '../../../components/UserComponents/Referral/ReferralCard';
import { 
  FiCopy, FiUsers, FiDollarSign, FiAward, FiCheckCircle, 
  FiLink, FiShare2, FiUserPlus, FiGift, FiInfo, FiTrendingUp,
  FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './ReferralPage.css';

export default function ReferralPage() {
  const { userData } = useAuth();
  const { 
    getReferralLink, 
    getReferralCount, 
    getRecentReferrals, 
    claimReferralRewards,
    referralBalance 
  } = useAppStore();

  const [referralLink, setReferralLink] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [allReferrals, setAllReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [referralUsers, setReferralUsers] = useState({});

  useEffect(() => {
    const loadData = async () => {
      if (!userData) return;
      
      const link = getReferralLink();
      setReferralLink(link || '');
      
      const count = await getReferralCount();
      setReferralCount(count);
      
      const referrals = await getRecentReferrals(50);
      
      // جلب بيانات المستخدمين المحالين
      const userIds = referrals.map(ref => ref.referredId).filter(Boolean);
      const usersMap = {};
      if (userIds.length > 0) {
        const userPromises = userIds.map(async (uid) => {
          const userSnap = await getDoc(doc(db, 'users', uid));
          if (userSnap.exists()) {
            usersMap[uid] = userSnap.data();
          }
        });
        await Promise.all(userPromises);
      }
      
      setAllReferrals(referrals);
      setReferralUsers(usersMap);
      setLoading(false);
    };
    loadData();
  }, [userData, getReferralLink, getReferralCount, getRecentReferrals]);

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast.success(' تم  نسخ رابط الإحالة!');
    }
  };

 const handleClaim = async () => {
  if (referralBalance < 100) {
    toast.error(`رصيد الإحالات غير كافٍ! تحتاج 100 MGC، لديك ${referralBalance} MGC`);
    return;
  }
  setClaiming(true);
  const success = await claimReferralRewards();
  setClaiming(false);
  if (success) {
    // تحديث البيانات
    const count = await getReferralCount();
    setReferralCount(count);
    const referrals = await getRecentReferrals(50);
    setAllReferrals(referrals);
    toast.success('✅ تم تحويل المكافآت إلى رصيدك الرئيسي!');
  }
};

  if (loading) {
    return (
      <div className="referral-page-loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل صفحة الإحالة...</p>
      </div>
    );
  }

  // استخدام rewardStatus بدلاً من status
  const pendingReferrals = allReferrals.filter(ref => ref.rewardStatus === 'pending');
  const claimedReferrals = allReferrals.filter(ref => ref.rewardStatus === 'claimed');

  const canClaim = referralBalance >= 100;
  const progressToNext = Math.min((referralBalance / 100) * 100, 100);

  return (
    <div className="referral-page" dir="rtl">
      {/* ===== الهيدر ===== */}
      <div className="referral-page__header">
        <h1 className="referral-page__title">
          <FiShare2 className="header-icon" style={{ color: '#10b981' }} />
          دعوة الأصدقاء
        </h1>
      </div>

      {/* ===== قسم شرح النظام ===== */}
      <div className="referral-page__info">
        <h4>
          <FiInfo className="info-icon" style={{ color: '#f59e0b' }} />
          كيف يعمل نظام الإحالة؟
        </h4>
        <ul>
          <li>
            <FiShare2 style={{ color: '#10b981', marginLeft: '0.5rem' }} />
            شارك رابط الإحالة الخاص بك مع أصدقائك.
          </li>
          <li>
            <FiUserPlus style={{ color: '#3b82f6', marginLeft: '0.5rem' }} />
            عندما يسجل صديقك باستخدام رابطك، يظهر في "إحالات معلقة".
          </li>
          <li>
            <FiGift style={{ color: '#f59e0b', marginLeft: '0.5rem' }} />
            عند قيامه بأول إيداع معتمد، تتحول حالته إلى "مودعة" وتحصل على <strong>20 MGC</strong>.
          </li>
          <li>
            <FiDollarSign style={{ color: '#10b981', marginLeft: '0.5rem' }} />
            المكافآت تُحجز في رصيد الإحالات حتى تصل إلى <strong>100 MGC</strong>.
          </li>
          <li>
            <FiCheckCircle style={{ color: '#10b981', marginLeft: '0.5rem' }} />
            عند الوصول إلى 100 MGC، يمكنك صرفها إلى رصيدك الرئيسي.
          </li>
        </ul>
      </div>

      {/* ===== بطاقة الرابط ===== */}
      <div className="referral-page__card link-card">
        <h3>
          <FiLink className="card-icon" style={{ color: '#3b82f6' }} />
          رابط الإحالة الخاص بك
        </h3>
        <div className="referral-link-box">
          <input
            type="text"
            className="referral-link-input"
            value={referralLink}
            readOnly
            dir="ltr"
          />
          <button className="referral-copy-btn" onClick={handleCopyLink}>
            <FiCopy /> نسخ
          </button>
        </div>
        <p className="referral-hint">
          شارك هذا الرابط مع أصدقائك. عند قيامهم بأول إيداع معتمد، ستحصل على <strong>20 MGC</strong>!
        </p>
      </div>

      {/* ===== بطاقة الإحصائيات ===== */}
      <div className="referral-page__card stats-card">
        <h3>
          <FiTrendingUp className="card-icon" style={{ color: '#8b5cf6' }} />
          إحصائيات الإحالة
        </h3>
        <div className="referral-stats-grid">
          <div className="stat-item">
            <FiUsers className="stat-icon" style={{ color: '#3b82f6' }} />
            <span className="stat-value">{referralCount}</span>
            <span className="stat-label">إحالات ناجحة</span>
          </div>
          <div className="stat-item">
            <FiDollarSign className="stat-icon" style={{ color: '#10b981' }} />
            <span className="stat-value">{referralBalance} MGC</span>
            <span className="stat-label">رصيد الإحالات (محجوز)</span>
          </div>
          <div className="stat-item">
            {canClaim ? (
              <FiCheckCircle className="stat-icon" style={{ color: '#10b981' }} />
            ) : (
              <FiAward className="stat-icon" style={{ color: '#f59e0b' }} />
            )}
            <span className="stat-value">
              {canClaim ? '✅ جاهز للصرف' : `${100 - referralBalance} MGC متبقي`}
            </span>
            <span className="stat-label">الحد الأدنى للصرف</span>
          </div>
        </div>

        {/* شريط التقدم */}
        <div className="referral-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressToNext}%` }}
            ></div>
          </div>
          <div className="progress-label">
            <span>{referralBalance} MGC</span>
            <span>هدف 100 MGC</span>
          </div>
        </div>

        {/* زر الصرف */}
        {canClaim && (
          <Button 
            onClick={handleClaim} 
            disabled={claiming} 
            className="claim-btn"
          >
            {claiming ? '⏳ جاري الصرف...' : `💳 صرف ${referralBalance} MGC`}
          </Button>
        )}
      </div>

      {/* ===== قسم الإحالات ===== */}
      <div className="referral-page__referrals">
        <div className="referral-page__tabs">
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <FiClock /> إحالات معلقة ({pendingReferrals.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'claimed' ? 'active' : ''}`}
            onClick={() => setActiveTab('claimed')}
          >
            <FiCheckCircle /> إحالات مودعة ({claimedReferrals.length})
          </button>
        </div>

        <div className="referral-page__list">
          {activeTab === 'pending' ? (
            pendingReferrals.length > 0 ? (
              pendingReferrals.map(ref => {
                const user = referralUsers[ref.referredId] || {};
                return (
                  <ReferralCard 
                    key={ref.id} 
                    referral={ref} 
                    user={user}
                  />
                );
              })
            ) : (
              <div className="empty-state">
                <p>لا توجد إحالات معلقة حالياً</p>
              </div>
            )
          ) : (
            claimedReferrals.length > 0 ? (
              claimedReferrals.map(ref => {
                const user = referralUsers[ref.referredId] || {};
                return (
                  <ReferralCard 
                    key={ref.id} 
                    referral={ref} 
                    user={user}
                  />
                );
              })
            ) : (
              <div className="empty-state">
                <p>لا توجد إحالات مودعة حتى الآن</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
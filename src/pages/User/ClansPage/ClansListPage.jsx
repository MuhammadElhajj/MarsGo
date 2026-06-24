// src/pages/User/ClansPage/ClansListPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
import { 
  FiUsers, FiPlus, FiUserPlus, FiLock, FiUnlock, 
  FiChevronLeft, FiTag, FiCpu, FiUsers as FiMembers,
  FiCheckCircle, FiXCircle, FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ClansListPage.css';

export default function ClansListPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const {
    fetchMyClans,
    fetchPublicClans,
    joinClan,
    fetchClanInvites,
    acceptClanInvite,
    rejectClanInvite,
  } = useAppStore();

  const [myClans, setMyClans] = useState([]);
  const [publicClans, setPublicClans] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my');
  const [inviters, setInviters] = useState({});

  // جلب بيانات المرسلين للدعوات
  const fetchInviters = async (invitesList) => {
    const invitersMap = {};
    for (const invite of invitesList) {
      if (invite.invitedBy && !invitersMap[invite.invitedBy]) {
        try {
          const userSnap = await getDoc(doc(db, 'users', invite.invitedBy));
          if (userSnap.exists()) {
            const data = userSnap.data();
            invitersMap[invite.invitedBy] = data.name || data.displayName || 'مستخدم';
          } else {
            invitersMap[invite.invitedBy] = 'مستخدم غير معروف';
          }
        } catch (err) {
          console.warn('خطأ في جلب بيانات المرسل:', err);
          invitersMap[invite.invitedBy] = 'مستخدم';
        }
      }
    }
    setInviters(invitersMap);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const my = await fetchMyClans();
      setMyClans(my);
      const publicClans = await fetchPublicClans();
      setPublicClans(publicClans);
      const inv = await fetchClanInvites();
      setInvites(inv);
      if (inv.length > 0) {
        await fetchInviters(inv);
      }
      setLoading(false);
    };
    loadData();
  }, [fetchMyClans, fetchPublicClans, fetchClanInvites]);

  const handleJoinClan = async (clanId) => {
    const success = await joinClan(clanId);
    if (success) {
      const my = await fetchMyClans();
      setMyClans(my);
      const publicClans = await fetchPublicClans();
      setPublicClans(publicClans);
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    const success = await acceptClanInvite(inviteId);
    if (success) {
      const inv = await fetchClanInvites();
      setInvites(inv);
      const my = await fetchMyClans();
      setMyClans(my);
    }
  };

  const handleRejectInvite = async (inviteId) => {
    const success = await rejectClanInvite(inviteId);
    if (success) {
      const inv = await fetchClanInvites();
      setInvites(inv);
    }
  };

  const handleClanClick = (clanId) => {
    navigate(`/clan/${clanId}`);
  };

  if (loading) {
    return (
      <div className="clans-page-loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل الكلانات...</p>
      </div>
    );
  }

  return (
    <div className="clans-list-page" dir="rtl">
      <div className="clans-list-page__header">
        <GoBackButton text="رجوع" />
        <h1 className="clans-list-page__title">
          <FiUsers className="header-icon" style={{ color: '#8b5cf6' }} />
          الكلانات
        </h1>
        <Button onClick={() => navigate('/clan/create')} variant="primary" size="sm">
          <FiPlus /> إنشاء كلان
        </Button>
      </div>

      <div className="clans-list-page__tabs">
        <button
          className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          <FiUsers /> كلاناتي ({myClans.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          <FiUserPlus /> استكشاف ({publicClans.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'invites' ? 'active' : ''}`}
          onClick={() => setActiveTab('invites')}
        >
          <FiClock /> دعوات ({invites.length})
          {invites.length > 0 && <span className="badge">{invites.length}</span>}
        </button>
      </div>

      <div className="clans-list-page__list">
        {activeTab === 'my' && (
          <>
            {myClans.length === 0 ? (
              <div className="empty-state">
                <FiUsers className="empty-icon" />
                <p>أنت لا تنتمي لأي كلان حالياً</p>
                <Button onClick={() => setActiveTab('explore')} variant="secondary">
                  استكشف الكلانات
                </Button>
              </div>
            ) : (
              myClans.map((clan) => (
                <ClanCard
                  key={clan.id}
                  clan={clan}
                  onClick={() => handleClanClick(clan.id)}
                  showJoin={false}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'explore' && (
          <>
            {publicClans.length === 0 ? (
              <div className="empty-state">
                <p>لا توجد كلانات عامة متاحة</p>
              </div>
            ) : (
              publicClans.map((clan) => {
                const isMember = myClans.some(c => c.id === clan.id);
                const isPrivate = clan.type === 'private';
                return (
                  <ClanCard
                    key={clan.id}
                    clan={clan}
                    onClick={() => handleClanClick(clan.id)}
                    showJoin={!isMember && !isPrivate}
                    onJoin={() => handleJoinClan(clan.id)}
                    isPrivate={isPrivate}
                  />
                );
              })
            )}
          </>
        )}

        {activeTab === 'invites' && (
          <>
            {invites.length === 0 ? (
              <div className="empty-state">
                <p>لا توجد دعوات معلقة</p>
              </div>
            ) : (
              invites.map((invite) => (
                <div key={invite.id} className="invite-card">
                  <div className="invite-info">
                    <span className="invite-clan">{invite.clanName || 'كلان غير معروف'}</span>
                    <span className="invite-from">
                      دعوة من: {inviters[invite.invitedBy] || 'مستخدم'}
                    </span>
                    <span className="invite-date">
                      {invite.createdAt?.toDate?.().toLocaleDateString('ar-EG') || ''}
                    </span>
                  </div>
                  <div className="invite-actions">
                    <Button onClick={() => handleAcceptInvite(invite.id)} variant="primary" size="sm">
                      <FiCheckCircle /> قبول
                    </Button>
                    <Button onClick={() => handleRejectInvite(invite.id)} variant="danger" size="sm">
                      <FiXCircle /> رفض
                    </Button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ===== مكون بطاقة الكلان (مُحسّن) =====
function ClanCard({ clan, onClick, showJoin, onJoin, isPrivate = false }) {
  const imageSrc = clan.coverImageUrl || clan.imageUrl || null;
  const memberCount = clan.memberCount || 0;
  const maxMembers = clan.maxMembers || 50;

  return (
    <div className="clan-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="clan-card__cover">
        {imageSrc ? (
          <img src={imageSrc} alt={clan.name} className="clan-card__cover-img" />
        ) : (
          <div className="clan-card__cover-placeholder">
            <FiUsers size={36} />
          </div>
        )}
        {/* شعار صغير فوق الغلاف */}
        {clan.avatarImageUrl && (
          <img src={clan.avatarImageUrl} alt={clan.name} className="clan-card__avatar" />
        )}
        {isPrivate && (
          <span className="clan-card__private-badge">
            <FiLock /> خاص
          </span>
        )}
      </div>
      <div className="clan-card__info">
        <div className="clan-card__name-row">
          <h3 className="clan-card__name">{clan.name}</h3>
          {clan.tag && <span className="clan-card__tag">#{clan.tag}</span>}
        </div>
        <p className="clan-card__description">{clan.description || 'لا يوجد وصف'}</p>
        <div className="clan-card__stats">
          <span className="clan-card__stat">
            <FiMembers /> {memberCount} / {maxMembers}
          </span>
          {clan.game && (
            <span className="clan-card__stat">
              <FiCpu /> {clan.game}
            </span>
          )}
          <span className="clan-card__stat">
            {clan.type === 'public' ? <FiUnlock /> : <FiLock />}
            {clan.type === 'public' ? 'عام' : 'خاص'}
          </span>
        </div>
      </div>
      {showJoin && (
        <div className="clan-card__actions" onClick={(e) => e.stopPropagation()}>
          <Button onClick={onJoin} variant="primary" size="sm" className="join-btn">
            <FiUserPlus /> انضم
          </Button>
        </div>
      )}
    </div>
  );
}
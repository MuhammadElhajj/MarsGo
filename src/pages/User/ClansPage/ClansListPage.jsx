// src/pages/User/ClansPage/ClansListPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
import { FiUsers, FiPlus, FiUserPlus, FiLock, FiUnlock, FiChevronLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ClansPage.css';

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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const my = await fetchMyClans();
      setMyClans(my);
      // ✅ التعديل هنا: استخدم اسم مختلف عن "public"
      const publicClans = await fetchPublicClans();
      setPublicClans(publicClans);
      const inv = await fetchClanInvites();
      setInvites(inv);
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
    <div className="clans-page" dir="rtl">
      <div className="clans-page__header">
        <GoBackButton text="رجوع" />
        <h1 className="clans-page__title">
          <FiUsers className="header-icon" style={{ color: '#8b5cf6' }} />
          الكلانات
        </h1>
        <Button onClick={() => navigate('/clan/create')} variant="primary" size="sm">
          <FiPlus /> إنشاء كلان
        </Button>
      </div>

      <div className="clans-page__tabs">
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
          <FiUserPlus /> دعوات ({invites.length})
          {invites.length > 0 && <span className="badge">{invites.length}</span>}
        </button>
      </div>

      <div className="clans-page__list">
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
                return (
                  <ClanCard
                    key={clan.id}
                    clan={clan}
                    onClick={() => handleClanClick(clan.id)}
                    showJoin={!isMember}
                    onJoin={() => handleJoinClan(clan.id)}
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
                    <span className="invite-clan">{invite.clanName}</span>
                    <span className="invite-from">دعوة من: {invite.invitedBy}</span>
                  </div>
                  <div className="invite-actions">
                    <Button onClick={() => handleAcceptInvite(invite.id)} variant="primary" size="sm">
                      قبول
                    </Button>
                    <Button onClick={() => handleRejectInvite(invite.id)} variant="danger" size="sm">
                      رفض
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

// ===== مكون بطاقة الكلان =====
function ClanCard({ clan, onClick, showJoin, onJoin }) {
  return (
    <div className="clan-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="clan-card__image">
        {clan.imageUrl ? (
          <img src={clan.imageUrl} alt={clan.name} />
        ) : (
          <div className="clan-card__placeholder">
            <FiUsers size={30} />
          </div>
        )}
      </div>
      <div className="clan-card__info">
        <h3 className="clan-card__name">{clan.name}</h3>
        <p className="clan-card__description">{clan.description || 'لا يوجد وصف'}</p>
        <div className="clan-card__stats">
          <span><FiUsers /> {clan.memberCount || 0} عضو</span>
          <span>
            {clan.type === 'public' ? <FiUnlock /> : <FiLock />}
            {clan.type === 'public' ? 'عام' : 'خاص'}
          </span>
        </div>
      </div>
      {showJoin && (
        <div className="clan-card__actions" onClick={(e) => e.stopPropagation()}>
          <Button onClick={onJoin} variant="primary" size="sm">
            <FiUserPlus /> انضم
          </Button>
        </div>
      )}
    </div>
  );
}
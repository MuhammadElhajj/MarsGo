// src/pages/User/ClansPage/ClanPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
import { FiUsers, FiUserPlus, FiUserMinus, FiSettings, FiMessageCircle, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ClansPage.css';

export default function ClanPage() {
  const { clanId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { fetchClan, fetchMyClans, leaveClan, inviteToClan } = useAppStore();

  const [clan, setClan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    const loadClan = async () => {
      const data = await fetchClan(clanId);
      setClan(data);
      if (data) {
        const member = data.members?.includes(userData?.uid);
        setIsMember(member);
        setIsOwner(data.ownerId === userData?.uid);
        setIsModerator(data.moderators?.includes(userData?.uid));
      }
      setLoading(false);
    };
    loadClan();
  }, [clanId, fetchClan, userData]);

  const handleLeave = async () => {
    if (window.confirm('هل أنت متأكد من مغادرة الكلان؟')) {
      const success = await leaveClan(clanId);
      if (success) {
        navigate('/clans');
      }
    }
  };

  const handleChat = () => {
    navigate(`/chat/room/clan_${clanId}`);
  };

  if (loading) {
    return (
      <div className="clans-page-loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل الكلان...</p>
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="clans-page">
        <GoBackButton text="رجوع" />
        <div className="empty-state">
          <p>الكلان غير موجود</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clan-page" dir="rtl">
      <div className="clan-page__header">
        <GoBackButton text="رجوع" />
        <h1 className="clan-page__title">{clan.name}</h1>
        {isOwner && (
          <Button onClick={() => navigate(`/clan/${clanId}/settings`)} variant="secondary" size="sm">
            <FiSettings /> إدارة
          </Button>
        )}
      </div>

      <div className="clan-page__cover">
        {clan.imageUrl ? (
          <img src={clan.imageUrl} alt={clan.name} />
        ) : (
          <div className="clan-page__cover-placeholder">
            <FiUsers size={60} />
          </div>
        )}
      </div>

      <div className="clan-page__info">
        <div className="clan-page__stats">
          <span><FiUsers /> {clan.memberCount || 0} عضو</span>
          <span>المالك: {clan.ownerId === userData?.uid ? 'أنت' : 'آخر'}</span>
          <span>النوع: {clan.type === 'public' ? 'عام' : 'خاص'}</span>
        </div>
        <p className="clan-page__description">{clan.description || 'لا يوجد وصف'}</p>
      </div>

      <div className="clan-page__actions">
        {isMember && (
          <>
            <Button onClick={handleChat} variant="primary">
              <FiMessageCircle /> دردشة الكلان
            </Button>
            {!isOwner && (
              <Button onClick={handleLeave} variant="danger">
                <FiUserMinus /> مغادرة
              </Button>
            )}
          </>
        )}
        {!isMember && clan.type === 'public' && (
          <Button onClick={() => joinClan(clanId)} variant="primary">
            <FiUserPlus /> انضم إلى الكلان
          </Button>
        )}
      </div>

      {/* قائمة الأعضاء */}
      <div className="clan-page__members">
        <h3>الأعضاء ({clan.memberCount || 0})</h3>
        <div className="members-list">
          {clan.members?.map((memberId) => (
            <div key={memberId} className="member-item">
              <Avatar name={memberId} size="sm" />
              <span className="member-name">{memberId === userData?.uid ? 'أنت' : memberId.slice(0, 8)}</span>
              {clan.ownerId === memberId && <FiShield className="owner-badge" title="المالك" />}
              {clan.moderators?.includes(memberId) && clan.ownerId !== memberId && (
                <span className="mod-badge">مشرف</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
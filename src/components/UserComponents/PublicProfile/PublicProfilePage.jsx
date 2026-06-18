// src/pages/User/PublicProfile/PublicProfilePage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
import Button from '../../../components/GeneralComponents/Button/Button';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import {
  FiUsers, FiHeart, FiZap, FiCalendar, FiMessageCircle,
  FiUserPlus, FiUserMinus, FiUserX, FiUserCheck, FiAward, FiStar
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PublicProfilePage.css';

export default function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userData: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState('none');
  const [pendingRequestId, setPendingRequestId] = useState(null);

  const {
    removeFriend,
    blockUser,
    unblockUser,
    createPrivateRoom,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useAppStore();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const docSnap = await getDoc(doc(db, 'users', userId));
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProfile(data);
          if (currentUser) {
            const friends = currentUser.friends || [];
            setIsFriend(friends.includes(userId));
            const blocked = currentUser.blockedUsers || [];
            setIsBlocked(blocked.includes(userId));
            await checkFriendRequestStatus(userId);
          }
        } else {
          toast.error('المستخدم غير موجود');
          navigate('/chat');
        }
      } catch (err) {
        console.error(err);
        toast.error('حدث خطأ');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, currentUser, navigate]);

  const checkFriendRequestStatus = async (targetUserId) => {
    if (!currentUser) return;
    try {
      const sentQuery = query(
        collection(db, 'friendRequests'),
        where('from', '==', currentUser.uid),
        where('to', '==', targetUserId),
        where('status', '==', 'pending')
      );
      const sentSnap = await getDocs(sentQuery);
      if (!sentSnap.empty) {
        setFriendRequestStatus('pending_sent');
        setPendingRequestId(sentSnap.docs[0].id);
        return;
      }

      const receivedQuery = query(
        collection(db, 'friendRequests'),
        where('from', '==', targetUserId),
        where('to', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      const receivedSnap = await getDocs(receivedQuery);
      if (!receivedSnap.empty) {
        setFriendRequestStatus('pending_received');
        setPendingRequestId(receivedSnap.docs[0].id);
        return;
      }

      setFriendRequestStatus('none');
      setPendingRequestId(null);
    } catch (err) {
      console.error('خطأ في التحقق من طلبات الصداقة:', err);
    }
  };

  const handleSendFriendRequest = async () => {
    const success = await sendFriendRequest(userId);
    if (success) {
      setFriendRequestStatus('pending_sent');
      toast.success('تم إرسال طلب الصداقة');
    }
  };

  const handleAcceptRequest = async () => {
    if (!pendingRequestId) return;
    const success = await acceptFriendRequest(pendingRequestId);
    if (success) {
      setIsFriend(true);
      setFriendRequestStatus('friend');
      setPendingRequestId(null);
      toast.success('تم قبول الصداقة');
    }
  };

  const handleRejectRequest = async () => {
    if (!pendingRequestId) return;
    const success = await rejectFriendRequest(pendingRequestId);
    if (success) {
      setFriendRequestStatus('none');
      setPendingRequestId(null);
      toast.success('تم رفض الطلب');
    }
  };

  const handleRemoveFriend = async () => {
    const success = await removeFriend(userId);
    if (success) {
      setIsFriend(false);
      setFriendRequestStatus('none');
      toast.success('تم إلغاء الصداقة');
    }
  };

  const handleBlock = async () => {
    const success = await blockUser(userId);
    if (success) {
      setIsBlocked(true);
      toast.success('تم حظر المستخدم');
    }
  };

  const handleUnblock = async () => {
    const success = await unblockUser(userId);
    if (success) {
      setIsBlocked(false);
      toast.success('تم إلغاء الحظر');
    }
  };

  const handleMessage = async () => {
    if (!currentUser) {
      toast.error('يجب تسجيل الدخول');
      return;
    }
    try {
      const result = await createPrivateRoom(userId, profile.name || 'مستخدم');
      if (result.success) {
        navigate(`/chat/room/${result.roomId}`);
      } else {
        toast.error(result.error || 'حدث خطأ في إنشاء المحادثة');
      }
    } catch (err) {
      toast.error('فشل إنشاء المحادثة');
    }
  };

  if (loading) return <div className="public-profile-loading">جاري التحميل...</div>;
  if (!profile) return <div className="public-profile-error">المستخدم غير موجود</div>;

  const isOwnProfile = currentUser?.uid === userId;
  const joinDate = profile.createdAt?.toDate?.() || new Date(profile.createdAt);
  const formattedDate = joinDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const level = profile.level || 1;
  const xp = profile.xp || 0;
  const title = profile.title || null;

  const renderFriendButton = () => {
    if (isFriend) {
      return (
        <Button onClick={handleRemoveFriend} variant="danger" className="action-btn">
          <FiUserMinus /> إلغاء الصداقة
        </Button>
      );
    }
    if (friendRequestStatus === 'pending_sent') {
      return (
        <Button variant="secondary" className="action-btn" disabled>
          <FiUserPlus /> بانتظار الموافقة
        </Button>
      );
    }
    if (friendRequestStatus === 'pending_received') {
      return (
        <>
          <Button onClick={handleAcceptRequest} variant="primary" className="action-btn">
            <FiUserCheck /> قبول
          </Button>
          <Button onClick={handleRejectRequest} variant="danger" className="action-btn">
            <FiUserMinus /> رفض
          </Button>
        </>
      );
    }
    return (
      <Button onClick={handleSendFriendRequest} variant="primary" className="action-btn">
        <FiUserPlus /> إرسال طلب صداقة
      </Button>
    );
  };

  return (
    <div className="public-profile" dir="rtl">
      <div className="public-profile__header">
        <GoBackButton text="رجوع" />
      </div>

      <div className="public-profile__cover">
        <div className="public-profile__cover-bg"></div>
        <div className="public-profile__avatar-wrapper">
          <Avatar src={profile.avatar} name={profile.name} size="xl" className="public-profile__avatar" />
          {!isOwnProfile && (
            <div className="public-profile__status-dot">
              <span className="status-dot online"></span>
            </div>
          )}
        </div>
      </div>

      <div className="public-profile__info">
        <h1 className="public-profile__name">{profile.name}</h1>
        {title && (
          <div className="public-profile__title-badge">
            <FiAward className="title-icon" /> {title}
          </div>
        )}
        <div className="public-profile__level-xp">
          <span className="level-badge">المستوى {level}</span>
          <span className="xp-badge">{xp} XP</span>
        </div>
        <p className="public-profile__rank">{profile.rank || 'عضو'}</p>
        <p className="public-profile__bio">{profile.bio || ''}</p>
      </div>

      <div className="public-profile__stats-grid">
        <div className="stat-item">
          <FiHeart className="stat-icon" />
          <span className="stat-value">{profile.popularity || 0}</span>
          <span className="stat-label">الشعبية</span>
        </div>
        <div className="stat-item">
          <FiZap className="stat-icon" />
          <span className="stat-value">{profile.power || 0}</span>
          <span className="stat-label">القوة</span>
        </div>
        <div className="stat-item">
          <FiUsers className="stat-icon" />
          <span className="stat-value">{profile.friends?.length || 0}</span>
          <span className="stat-label">الأصدقاء</span>
        </div>
      </div>

      <div className="public-profile__details">
        <div className="detail-row">
          <FiCalendar className="detail-icon" />
          <span>انضم في {formattedDate}</span>
        </div>
        {profile.lastSeen && (
          <div className="detail-row">
            <FiMessageCircle className="detail-icon" />
            <span>آخر ظهور: {profile.lastSeen?.toDate?.().toLocaleString('ar-EG') || '—'}</span>
          </div>
        )}
      </div>

      {!isOwnProfile && (
        <div className="public-profile__actions">
          {renderFriendButton()}
          <Button onClick={handleMessage} className="action-btn secondary">
            <FiMessageCircle /> مراسلة
          </Button>
          {isBlocked ? (
            <Button onClick={handleUnblock} variant="secondary" className="action-btn">
              <FiUserCheck /> إلغاء الحظر
            </Button>
          ) : (
            <Button onClick={handleBlock} variant="danger" className="action-btn">
              <FiUserX /> حظر
            </Button>
          )}
        </div>
      )}

      {!isOwnProfile && (
        <div className="public-profile__mutual-friends">
          <h3>أصدقاء مشتركون</h3>
          <p className="mutual-count">لا يوجد أصدقاء مشتركون</p>
        </div>
      )}
    </div>
  );
}
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
  FiUserPlus, FiUserMinus, FiUserX, FiUserCheck, FiAward, FiStar,
  FiUser, FiCopy, FiMapPin, FiClock, FiShare2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PublicProfilePage.css';

export default function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userData: currentUser } = useAuth();

  const {
    removeFriend,
    blockUser,
    unblockUser,
    createPrivateRoom,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    supportUser,
    mgcBalance,
    copyUniqueId,
  } = useAppStore();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState('none');
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [supportLoading, setSupportLoading] = useState(false);

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

  const handleSupport = async () => {
    if (supportLoading) return;
    setSupportLoading(true);
    const result = await supportUser(userId);
    if (result.success) {
      setProfile(prev => ({
        ...prev,
        popularity: (prev?.popularity || 0) + 1
      }));
    }
    setSupportLoading(false);
  };

  const handleCopyId = () => {
    if (profile?.uniqueId) {
      copyUniqueId(profile.uniqueId);
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
  const hasEnoughMgc = mgcBalance >= 20;

  const renderFriendButton = () => {
    if (isFriend) {
      return (
        <Button onClick={handleRemoveFriend} variant="danger" className="action-btn">
          <FiUserMinus style={{ color: '#ef4444' }} /> إلغاء الصداقة
        </Button>
      );
    }
    if (friendRequestStatus === 'pending_sent') {
      return (
        <Button variant="secondary" className="action-btn" disabled>
          <FiClock style={{ color: '#f59e0b' }} /> بانتظار الموافقة
        </Button>
      );
    }
    if (friendRequestStatus === 'pending_received') {
      return (
        <>
          <Button onClick={handleAcceptRequest} variant="primary" className="action-btn">
            <FiCheck style={{ color: '#10b981' }} /> قبول
          </Button>
          <Button onClick={handleRejectRequest} variant="danger" className="action-btn">
            <FiX style={{ color: '#ef4444' }} /> رفض
          </Button>
        </>
      );
    }
    return (
      <Button onClick={handleSendFriendRequest} variant="primary" className="action-btn">
        <FiUserPlus style={{ color: '#3b82f6' }} /> إرسال طلب
      </Button>
    );
  };

  return (
    <div className="public-profile" dir="rtl">
      {/* ===== الهيدر ===== */}
      <div className="public-profile__header">
        <GoBackButton text="رجوع" />
        <div className="public-profile__header-user">
          <span>{profile.name}</span>
          <FiUser style={{ color: '#8b5cf6', marginLeft: '0.4rem' }} />
        </div>
      </div>

      {/* ===== الخلفية والصورة ===== */}
      <div className="public-profile__cover">
        <div className="public-profile__cover-bg"></div>
        <div className="public-profile__avatar-wrapper">
          <Avatar src={profile.avatar} name={profile.name} size="xl" className="public-profile__avatar" />
        </div>
      </div>

      {/* ===== بطاقة المعلومات المدمجة (أفقية) ===== */}
      <div className="public-profile__info-card">
        {/* الصف الأول: الأفاتار + الاسم + المعرف + المستوى + XP + الرتبة */}
        <div className="public-profile__info-row">
          <div className="public-profile__info-avatar">
            <Avatar src={profile.avatar} name={profile.name} size="md" />
          </div>
          <div className="public-profile__info-details">
            <h1 className="public-profile__info-name">{profile.name}</h1>
            <div className="public-profile__info-meta">
              <span className="meta-item">
                <FiCopy style={{ color: '#8b5cf6', fontSize: '0.7rem' }} />
                <span className="meta-id">{profile.uniqueId}</span>
                <button className="copy-id-btn" onClick={handleCopyId} title="نسخ المعرف">
                  <FiCopy style={{ fontSize: '0.6rem' }} />
                </button>
              </span>
              <span className="meta-item">
                <FiAward style={{ color: '#f59e0b', fontSize: '0.7rem' }} />
                المستوى {level}
              </span>
              <span className="meta-item">
                <FiStar style={{ color: '#10b981', fontSize: '0.7rem' }} />
                {xp} XP
              </span>
              <span className="meta-item">
                <FiUser style={{ color: '#3b82f6', fontSize: '0.7rem' }} />
                {profile.rank || 'عضو'}
              </span>
              {title && (
                <span className="meta-item title-badge">
                  <FiAward style={{ color: '#f59e0b', fontSize: '0.7rem' }} />
                  {title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* الصف الثاني: الإحصائيات (الشعبية، القوة، الأصدقاء) */}
        <div className="public-profile__info-stats">
          <div className="stat-item">
            <FiHeart style={{ color: '#ef4444', fontSize: '1.1rem' }} />
            <span className="stat-value">{profile.popularity || 0}</span>
            <span className="stat-label">شعبية</span>
          </div>
          <div className="stat-item">
            <FiZap style={{ color: '#f59e0b', fontSize: '1.1rem' }} />
            <span className="stat-value">{profile.power || 0}</span>
            <span className="stat-label">قوة</span>
          </div>
          <div className="stat-item">
            <FiUsers style={{ color: '#3b82f6', fontSize: '1.1rem' }} />
            <span className="stat-value">{profile.friends?.length || 0}</span>
            <span className="stat-label">أصدقاء</span>
          </div>
          <div className="stat-item">
            <FiCalendar style={{ color: '#8b5cf6', fontSize: '1.1rem' }} />
            <span className="stat-value">{formattedDate}</span>
            <span className="stat-label">انضم</span>
          </div>
        </div>
      </div>

      {/* ===== الأزرار ===== */}
      {!isOwnProfile && (
        <div className="public-profile__actions">
          <Button
            onClick={handleSupport}
            disabled={supportLoading || !hasEnoughMgc}
            className={`action-btn support ${supportLoading ? 'loading' : ''}`}
          >
            {supportLoading ? (
              '⏳ جاري...'
            ) : (
              <>
                <FiHeart style={{ color: '#fff' }} />
                دعم
                <span className="support-cost">-20 MGC</span>
                <span className="support-badge">{profile.popularity || 0}</span>
              </>
            )}
          </Button>

          {renderFriendButton()}

          <Button onClick={handleMessage} className="action-btn secondary">
            <FiMessageCircle style={{ color: '#10b981' }} /> مراسلة
          </Button>

          {isBlocked ? (
            <Button onClick={handleUnblock} variant="secondary" className="action-btn">
              <FiUserCheck style={{ color: '#10b981' }} /> إلغاء الحظر
            </Button>
          ) : (
            <Button onClick={handleBlock} variant="danger" className="action-btn">
              <FiUserX style={{ color: '#ef4444' }} /> حظر
            </Button>
          )}
        </div>
      )}

      {/* ===== الأصدقاء المشتركون ===== */}
      {!isOwnProfile && (
        <div className="public-profile__mutual-friends">
          <h3>
            <FiUsers style={{ color: '#3b82f6', marginLeft: '0.4rem' }} />
            أصدقاء مشتركون
          </h3>
          <p className="mutual-count">لا يوجد أصدقاء مشتركون</p>
        </div>
      )}
    </div>
  );
}
// src/pages/User/PublicProfile/PublicProfilePage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
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

  const { addFriend, removeFriend, blockUser, unblockUser, createPrivateRoom } = useAppStore();

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

  if (loading) return <div className="public-profile-loading">جاري التحميل...</div>;
  if (!profile) return <div className="public-profile-error">المستخدم غير موجود</div>;

  const isOwnProfile = currentUser?.uid === userId;

  const handleAddFriend = async () => {
    const success = await addFriend(userId);
    if (success) setIsFriend(true);
  };

  const handleRemoveFriend = async () => {
    const success = await removeFriend(userId);
    if (success) setIsFriend(false);
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

  const joinDate = profile.createdAt?.toDate?.() || new Date(profile.createdAt);
  const formattedDate = joinDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  // مستوى المستخدم وخبرته
  const level = profile.level || 1;
  const xp = profile.xp || 0;
  const title = profile.title || null;

  return (
    <div className="public-profile" dir="rtl">
      {/* الهيدر مع زر الرجوع */}
      <div className="public-profile__header">
        <GoBackButton text="رجوع" />
      </div>

      {/* القسم العلوي: الخلفية + الصورة */}
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

      {/* القسم الثاني: الاسم واللقب */}
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

      {/* القسم الثالث: الإحصائيات */}
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

      {/* القسم الرابع: معلومات إضافية */}
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

      {/* القسم الخامس: الأزرار */}
      {!isOwnProfile && (
        <div className="public-profile__actions">
          {isFriend ? (
            <Button onClick={handleRemoveFriend} variant="danger" className="action-btn">
              <FiUserMinus /> إلغاء الصداقة
            </Button>
          ) : (
            <Button onClick={handleAddFriend} className="action-btn primary">
              <FiUserPlus /> إضافة صديق
            </Button>
          )}
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

      {/* القسم السادس: الأصدقاء المشتركين (اختياري) */}
      {!isOwnProfile && (
        <div className="public-profile__mutual-friends">
          <h3>أصدقاء مشتركون</h3>
          <p className="mutual-count">لا يوجد أصدقاء مشتركون</p>
        </div>
      )}
    </div>
  );
}
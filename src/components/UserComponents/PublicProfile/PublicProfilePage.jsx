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

  const { addFriend, removeFriend, blockUser, unblockUser } = useAppStore();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const docSnap = await getDoc(doc(db, 'users', userId));
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() });
          // التحقق من الصداقة والحظر
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

  if (loading) return <div>جاري التحميل...</div>;
  if (!profile) return <div>المستخدم غير موجود</div>;

  const isOwnProfile = currentUser?.uid === userId;

  const handleAddFriend = async () => {
    await addFriend(userId);
    setIsFriend(true);
  };

  const handleRemoveFriend = async () => {
    await removeFriend(userId);
    setIsFriend(false);
  };

  const handleBlock = async () => {
    await blockUser(userId);
    setIsBlocked(true);
    toast.success('تم حظر المستخدم');
  };

  const handleUnblock = async () => {
    await unblockUser(userId);
    setIsBlocked(false);
    toast.success('تم إلغاء الحظر');
  };

  const handleMessage = () => {
    navigate(`/chat/room/${[currentUser.uid, userId].sort().join('_')}`);
  };

  return (
    <div className="public-profile" dir="rtl">
      <GoBackButton text="رجوع" />
      <div className="public-profile__card">
        <Avatar src={profile.avatar} name={profile.name} size="xl" />
        <h2>{profile.name}</h2>
        <p className="public-profile__rank">{profile.rank || 'عضو'}</p>
        <div className="public-profile__stats">
          <span>❤️ {profile.popularity || 0}</span>
          <span>⚡ {profile.power || 0}</span>
        </div>
        <p className="public-profile__joined">
          انضم: {profile.createdAt?.toDate?.().toLocaleDateString('ar-EG') || '—'}
        </p>

        {!isOwnProfile && (
          <div className="public-profile__actions">
            {isFriend ? (
              <Button onClick={handleRemoveFriend} variant="danger">إلغاء الصداقة</Button>
            ) : (
              <Button onClick={handleAddFriend}>إضافة صديق</Button>
            )}
            <Button onClick={handleMessage}>مراسلة</Button>
            {isBlocked ? (
              <Button onClick={handleUnblock} variant="secondary">إلغاء الحظر</Button>
            ) : (
              <Button onClick={handleBlock} variant="danger">حظر</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
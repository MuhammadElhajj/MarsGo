// src/pages/User/ProfilePage/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, FaCalendarAlt, FaBox, FaDollarSign, FaBell, FaWhatsapp, 
  FaEdit, FaSave, FaCheckCircle, FaInbox, FaUserFriends, FaUserPlus
} from 'react-icons/fa';
import { FiActivity } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useAppStore } from '../../../store/store';
import useUserStats from '../../../hooks/useUserStats';
import useUserSpending from '../../../hooks/useUserSpending';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
import Input from '../../../components/GeneralComponents/Input/Input';
import Button from '../../../components/GeneralComponents/Button/Button';
import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
import BalanceDisplay from '../../../components/GeneralComponents/BalanceDisplay/BalanceDisplay';
import TopUpButton from '../../../components/GeneralComponents/TopUpButton/TopUpButton';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import useFormattedPrice from '../../../hooks/useFormattedPrice';
import './ProfilePage.css';

export default function ProfilePage() {
  const { userData, updateUserData } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const { totalSpent, loading: spendingLoading } = useUserSpending();
  const { formatPrice } = useFormattedPrice();
  
  const unreadCount = useAppStore((state) => state.unreadCount);
  const pendingRequestsCount = useAppStore((state) => state.pendingRequestsCount);

  const [whatsappNumber, setWhatsappNumber] = useState(userData?.whatsappNumber || '');
  const [originalNumber, setOriginalNumber] = useState(userData?.whatsappNumber || '');
  const [editingWhatsapp, setEditingWhatsapp] = useState(false);
  const [saving, setSaving] = useState(false);

  // إزالة جلب آخر الطلبات (غير مطلوب الآن)

  if (!userData) return <div className="profile-page__loading">جاري التحميل...</div>;

  const joinDate = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt || Date.now());

  const handleEditWhatsapp = () => setEditingWhatsapp(true);
  const handleCancelWhatsapp = () => {
    setWhatsappNumber(originalNumber);
    setEditingWhatsapp(false);
  };
  const handleSaveWhatsapp = async () => {
    setSaving(true);
    const success = await updateUserData({ whatsappNumber });
    if (success) {
      setOriginalNumber(whatsappNumber);
      setEditingWhatsapp(false);
      showToast('تم حفظ رقم واتساب بنجاح', 'success');
    } else {
      showToast('فشل حفظ الرقم', 'error');
    }
    setSaving(false);
  };
  const isSaved = originalNumber !== '' && !editingWhatsapp;

  const friendsCount = userData.friends?.length || 0;

  return (
    <div className="profile-page" dir="rtl">
      <div className="profile-page__header">
        <GoBackButton text="رجوع" />
        <h1 className="profile-page__title">الملف الشخصي</h1>
      </div>

      {/* كارد الأفاتار والمعلومات الشخصية + الرصيد وزر الإيداع */}
      <div className="profile-page__avatar-card">
        <div className="profile-page__avatar-row">
          <div className="profile-page__avatar-image">
            <Avatar src={userData.avatar} name={userData.name} email={userData.email} size="xl" />
          </div>
          <div className="profile-page__avatar-info">
            <h2 className="profile-page__name">{userData.name || 'مستخدم'}</h2>
            <p className="profile-page__email">{userData.email}</p>
          </div>
        </div>

        <div className="profile-page__balance-section">
          <div className="balance-container">
            <BalanceDisplay />
            <TopUpButton />
          </div>
        </div>
      </div>

      <div className="profile-page__grid">
        {/* المعلومات الأساسية */}
        <div className="profile-page__card">
          <h3><FaUser /> المعلومات الأساسية</h3>
          <div className="profile-page__info">
            <div className="profile-page__info-row">
              <span><FaCalendarAlt /> تاريخ الانضمام:</span>
              <strong>{joinDate.toLocaleDateString('en-US')}</strong>
            </div>
            <div className="profile-page__info-row">
              <span><FaBox /> عدد الطلبات:</span>
              <strong>{statsLoading ? '...' : stats.total}</strong>
            </div>
            <div className="profile-page__info-row">
              <span><FaUser /> الدور:</span>
              <strong>
                {userData.role === 'admin' ? 'مدير' : userData.role === 'verifier' ? 'مدقق' : 'عميل'}
              </strong>
            </div>
          </div>
        </div>

        {/* رقم واتساب */}
        <div className="profile-page__card">
          <h3>
            <FaWhatsapp /> رقم واتساب
            {isSaved && <span className="profile-page__saved-badge" title="تم الحفظ">✓</span>}
          </h3>
          <div className="profile-page__whatsapp-input">
            <Input
              label="رقم الواتساب"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="مثال: 963939454690"
              dir="ltr"
              disabled={!editingWhatsapp}
              className={!editingWhatsapp ? 'input--readonly' : ''}
            />
            <div className="profile-page__whatsapp-buttons">
              {!editingWhatsapp ? (
                <Button onClick={handleEditWhatsapp} variant="secondary"><FaEdit /> تعديل</Button>
              ) : (
                <>
                  <Button onClick={handleSaveWhatsapp} disabled={saving}>
                    <FaSave /> {saving ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                  <Button onClick={handleCancelWhatsapp} variant="danger">إلغاء</Button>
                </>
              )}
            </div>
          </div>
          <p className="profile-page__whatsapp-note">للتواصل وإشعارات الطلبات</p>
        </div>

        {/* إجمالي الإنفاق */}
        <div className="profile-page__card">
          <h3><FaDollarSign /> إجمالي الإنفاق</h3>
          <div className="profile-page__total-spent">
            <div className="profile-page__total-amount">
              {spendingLoading ? '...' : formatPrice(totalSpent)}
            </div>
            <div className="profile-page__total-label">
              إجمالي ما أنفقته (جميع الطلبات المكتملة)
            </div>
            <div className="profile-page__completed-count">
              <FaCheckCircle /> {stats.completed || 0} طلب مكتمل
            </div>
          </div>
        </div>

        {/* الإشعارات */}
        <div className="profile-page__card">
          <h3><FaBell /> الإشعارات</h3>
          <div className="profile-page__notifications">
            <div className="profile-page__unread-count">
              {unreadCount > 0 ? (
                <>
                  <span className="profile-page__badge">{unreadCount}</span>
                  <span>إشعارات غير مقروءة</span>
                </>
              ) : (
                <span><FaInbox /> لا توجد إشعارات غير مقروءة</span>
              )}
            </div>
            <Link to="/notifications" className="profile-page__link">عرض الإشعارات →</Link>
          </div>
        </div>

        {/* الأصدقاء */}
        <div className="profile-page__card">
          <h3><FaUserFriends /> الأصدقاء</h3>
          <div className="profile-page__friend-buttons">
            <Link to="/friends" className="friend-btn">
              <FaUserFriends /> الأصدقاء ({friendsCount})
            </Link>
            <Link to="/friends?tab=requests" className="friend-btn friend-btn--requests">
              <FaUserPlus /> طلبات الصداقة
              {pendingRequestsCount > 0 && (
                <span className="friend-btn__badge">{pendingRequestsCount}</span>
              )}
            </Link>
          </div>
        </div>

        {/* نشاطاتي */}
        <div className="profile-page__card">
          <h3><FiActivity /> نشاطاتي</h3>
          <div className="profile-page__activity-link">
            <Link to="/my-activities" className="activity-link">
              عرض جميع نشاطاتي <span className="arrow">→</span>
            </Link>
            <p className="profile-page__activity-hint">
              استعراض الإيداعات والطلبات السابقة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
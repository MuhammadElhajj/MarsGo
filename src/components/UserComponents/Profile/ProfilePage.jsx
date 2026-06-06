// // src/pages/User/Profile/ProfilePage.jsx
// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../../../context/AuthContext';
// import { useNotifications } from '../../../context/NotificationContext';
// import useUserStats from '../../../hooks/useUserStats';
// import useUserSpending from '../../../hooks/useUserSpending';
// import SpendingProgress from '../../../components/UserComponents/SpendingProgress/SpendingProgress';
// import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
// import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
// import Input from '../../../components/GeneralComponents/Input/Input';
// import Button from '../../../components/GeneralComponents/Button/Button';
// import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
// import { db } from '../../../firebase';
// import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
// import useFormattedPrice from '../../../hooks/useFormattedPrice';
// import './ProfilePage.css';

// export default function ProfilePage() {
//   const { userData, updateUserData } = useAuth();
//   const { stats, loading: statsLoading } = useUserStats();
//   const { totalSpent, loading: spendingLoading } = useUserSpending();
//   const { unreadCount } = useNotifications();
//   const { formatPrice } = useFormattedPrice(); // الآن تستخدم التقريب لأعلى
//   const [recentOrders, setRecentOrders] = useState([]);
//   const [recentOrdersLoading, setRecentOrdersLoading] = useState(true);
//   const [whatsappNumber, setWhatsappNumber] = useState(userData?.whatsappNumber || '');
//   const [originalNumber, setOriginalNumber] = useState(userData?.whatsappNumber || '');
//   const [editingWhatsapp, setEditingWhatsapp] = useState(false);
//   const [saving, setSaving] = useState(false);

//   // جلب آخر 3 طلبات للمستخدم
//   useEffect(() => {
//     if (!userData?.uid) return;
//     const fetchRecentOrders = async () => {
//       try {
//         const q = query(
//           collection(db, 'orders'),
//           where('userId', '==', userData.uid),
//           orderBy('createdAt', 'desc'),
//           limit(3)
//         );
//         const snapshot = await getDocs(q);
//         const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setRecentOrders(orders);
//       } catch (err) {
//         console.error('خطأ في جلب آخر الطلبات:', err);
//       } finally {
//         setRecentOrdersLoading(false);
//       }
//     };
//     fetchRecentOrders();
//   }, [userData]);

//   if (!userData) return <div className="profile-page__loading">جاري التحميل...</div>;

//   const joinDate = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt || Date.now());

//   const handleEditWhatsapp = () => setEditingWhatsapp(true);
//   const handleCancelWhatsapp = () => {
//     setWhatsappNumber(originalNumber);
//     setEditingWhatsapp(false);
//   };
//   const handleSaveWhatsapp = async () => {
//     setSaving(true);
//     const success = await updateUserData({ whatsappNumber });
//     if (success) {
//       setOriginalNumber(whatsappNumber);
//       setEditingWhatsapp(false);
//       showToast('✅ تم حفظ رقم واتساب بنجاح', 'success');
//     } else {
//       showToast('❌ فشل حفظ الرقم', 'error');
//     }
//     setSaving(false);
//   };
//   const isSaved = originalNumber !== '' && !editingWhatsapp;

//   const getStatusLabel = (status) => {
//     const statusMap = {
//       pending_verification: 'قيد التدقيق',
//       awaiting_customer_resubmit: 'بانتظار تعديلك',
//       verified_pending_execution: 'تم التدقيق',
//       rejected: 'مرفوض',
//       completed: 'مكتمل'
//     };
//     return statusMap[status] || status;
//   };

//   const getStatusClass = (status) => `status-${status}`;

//   // دالة مساعدة لتنسيق المبلغ برقمين عشريين (للطلبات التي قد لا تستخدم formatPrice)
//   const formatAmount = (value) => {
//     if (value === undefined || value === null) return '0.00';
//     const num = typeof value === 'number' ? value : parseFloat(value);
//     if (isNaN(num)) return '0.00';
//     const ceilValue = Math.ceil(num * 100) / 100;
//     return ceilValue.toFixed(2);
//   };

//   return (
//     <div className="profile-page" dir="rtl">
//       <div className="profile-page__header">
//         <GoBackButton text="رجوع" />
//         <h1 className="profile-page__title">الملف الشخصي</h1>
//       </div>

//       <div className="profile-page__avatar-card">
//         <div className="profile-page__avatar-row">
//           <div className="profile-page__avatar-image">
//             <Avatar src={userData.avatar} name={userData.name} email={userData.email} size="xl" />
//           </div>
//           <div className="profile-page__avatar-info">
//             <h2 className="profile-page__name">{userData.name || 'مستخدم'}</h2>
//             <p className="profile-page__email">{userData.email}</p>
//           </div>
//         </div>
//       </div>

//       <div className="profile-page__grid">
//         {/* كارد المعلومات الأساسية */}
//         <div className="profile-page__card">
//           <h3>📋 المعلومات الأساسية</h3>
//           <div className="profile-page__info">
//             <div className="profile-page__info-row">
//               <span>📅 تاريخ الانضمام:</span>
//               <strong>{joinDate.toLocaleDateString('en-US')}</strong>
//             </div>
//             <div className="profile-page__info-row">
//               <span>📦 عدد الطلبات:</span>
//               <strong>{statsLoading ? '...' : stats.total}</strong>
//             </div>
//             <div className="profile-page__info-row">
//               <span>👤 الدور:</span>
//               <strong>
//                 {userData.role === 'admin' ? 'مدير' : userData.role === 'verifier' ? 'مدقق' : 'عميل'}
//               </strong>
//             </div>
//           </div>
//         </div>

//         {/* كارد إجمالي الإنفاق - يستخدم formatPrice المعدلة */}
//         <div className="profile-page__card">
//           <h3>💰 إجمالي الإنفاق</h3>
//           <div className="profile-page__total-spent">
//             <div className="profile-page__total-amount">
//               {spendingLoading ? '...' : formatPrice(totalSpent)}
//             </div>
//             <div className="profile-page__total-label">
//               إجمالي ما أنفقته (جميع الطلبات المكتملة)
//             </div>
//             <div className="profile-page__completed-count">
//               ✅ {stats.completed || 0} طلب مكتمل
//             </div>
//           </div>
//         </div>

//         {/* كارد الإشعارات غير المقروءة */}
//         <div className="profile-page__card">
//           <h3>🔔 الإشعارات</h3>
//           <div className="profile-page__notifications">
//             <div className="profile-page__unread-count">
//               {unreadCount > 0 ? (
//                 <>
//                   <span className="profile-page__badge">{unreadCount}</span>
//                   <span>إشعارات غير مقروءة</span>
//                 </>
//               ) : (
//                 <span>📭 لا توجد إشعارات غير مقروءة</span>
//               )}
//             </div>
//             <Link to="/notifications" className="profile-page__link">عرض الإشعارات →</Link>
//           </div>
//         </div>

//         {/* كارد رقم الواتساب */}
//         <div className="profile-page__card">
//           <h3>
//             📞 رقم واتساب
//             {isSaved && <span className="profile-page__saved-badge" title="تم الحفظ">✓</span>}
//           </h3>
//           <div className="profile-page__whatsapp-input">
//             <Input
//               label="رقم الواتساب"
//               value={whatsappNumber}
//               onChange={(e) => setWhatsappNumber(e.target.value)}
//               placeholder="مثال: 963939454690"
//               dir="ltr"
//               disabled={!editingWhatsapp}
//               className={!editingWhatsapp ? 'input--readonly' : ''}
//             />
//             <div className="profile-page__whatsapp-buttons">
//               {!editingWhatsapp ? (
//                 <Button onClick={handleEditWhatsapp} variant="secondary">✏️ تعديل</Button>
//               ) : (
//                 <>
//                   <Button onClick={handleSaveWhatsapp} disabled={saving}>
//                     {saving ? 'جاري الحفظ...' : '💾 حفظ'}
//                   </Button>
//                   <Button onClick={handleCancelWhatsapp} variant="danger">إلغاء</Button>
//                 </>
//               )}
//             </div>
//           </div>
//           <p className="profile-page__whatsapp-note">للتواصل وإشعارات الطلبات</p>
//         </div>

//         {/* كارد آخر الطلبات - استخدام formatAmount للتأكد من منزلتين عشريتين */}
//         <div className="profile-page__card profile-page__card--wide">
//           <h3>📋 آخر الطلبات</h3>
//           {recentOrdersLoading ? (
//             <div className="profile-page__loading-small">جاري التحميل...</div>
//           ) : recentOrders.length === 0 ? (
//             <p className="profile-page__empty">لا توجد طلبات بعد</p>
//           ) : (
//             <div className="profile-page__recent-orders">
//               {recentOrders.map(order => {
//                 const amount = order.finalPriceUSD || order.finalPrice || order.amount;
//                 const currencySymbol = order.currency === 'USD' ? '$' : 'USD';
//                 return (
//                   <div key={order.id} className="profile-page__order-item">
//                     <div className="profile-page__order-id">#{order.id.slice(-6)}</div>
//                     <div className="profile-page__order-type">
//                       {order.type === 'transfer' ? 'تحويل' : order.type === 'gaming' ? 'شحن ألعاب' : order.type}
//                     </div>
//                     <div className="profile-page__order-amount">
//                       {formatAmount(amount)} {currencySymbol}
//                     </div>
//                     <div className={`profile-page__order-status ${getStatusClass(order.status)}`}>
//                       {getStatusLabel(order.status)}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//           <Link to="/my-orders" className="profile-page__link">عرض كل الطلبات →</Link>
//         </div>

//         {/* كارد مستوى الولاء */}
//         <div className="profile-page__card">
//           <h3>🏆 مستوى الولاء</h3>
//           <SpendingProgress />
//         </div>
//       </div>
//     </div>
//   );
// }
// src/pages/User/Profile/ProfilePage.jsx
import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, FaCalendarAlt, FaBox, FaDollarSign, FaBell, FaWhatsapp, 
  FaEdit, FaSave, FaCheckCircle, FaInbox, FaTrophy, FaList, FaWallet,
  FaArrowLeft, FaDownload, FaHistory
} from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import useUserStats from '../../../hooks/useUserStats';
import useUserSpending from '../../../hooks/useUserSpending';
import SpendingProgress from '../../../components/UserComponents/SpendingProgress/SpendingProgress';
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
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import './ProfilePage.css';

// Lazy load DepositHistory
const DepositHistory = lazy(() => import('../../../components/UserComponents/TopUp/DepositHistory'));

export default function ProfilePage() {
  const { userData, updateUserData } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const { totalSpent, loading: spendingLoading } = useUserSpending();
  const { unreadCount } = useNotifications();
  const { formatPrice } = useFormattedPrice();
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState(userData?.whatsappNumber || '');
  const [originalNumber, setOriginalNumber] = useState(userData?.whatsappNumber || '');
  const [editingWhatsapp, setEditingWhatsapp] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userData?.uid) return;
    const fetchRecentOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentOrders(orders);
      } catch (err) {
        console.error('خطأ في جلب آخر الطلبات:', err);
      } finally {
        setRecentOrdersLoading(false);
      }
    };
    fetchRecentOrders();
  }, [userData]);

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

  const getStatusLabel = (status) => {
    const statusMap = {
      pending_verification: 'قيد التدقيق',
      awaiting_customer_resubmit: 'بانتظار تعديلك',
      verified_pending_execution: 'تم التدقيق',
      rejected: 'مرفوض',
      completed: 'مكتمل'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => `status-${status}`;

  const formatAmount = (value) => {
    if (value === undefined || value === null) return '0.00';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '0.00';
    const ceilValue = Math.ceil(num * 100) / 100;
    return ceilValue.toFixed(2);
  };

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

        {/* قسم رصيد الحساب وزر الإيداع - يظهر أسفل الاسم والبريد مباشرة */}
        <div className="profile-page__balance-section">
          <div className="balance-container">
            <FaWallet className="balance-icon" />
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
      </div>

      {/* سجل الإيداعات */}
      <Suspense fallback={<Loading text="جاري تحميل سجل الإيداعات..." />}>
        <DepositHistory />
      </Suspense>

      {/* آخر الطلبات (طلب الشحن) */}
      <div className="profile-page__orders-section">
        <div className="profile-page__card profile-page__card--wide">
          <h3><FaList /> آخر الطلبات</h3>
          {recentOrdersLoading ? (
            <div className="profile-page__loading-small">جاري التحميل...</div>
          ) : recentOrders.length === 0 ? (
            <p className="profile-page__empty">لا توجد طلبات بعد</p>
          ) : (
            <div className="profile-page__recent-orders">
              {recentOrders.map(order => {
                const amount = order.finalPriceUSD || order.finalPrice || order.amount;
                const currencySymbol = order.currency === 'USD' ? '$' : 'USD';
                return (
                  <div key={order.id} className="profile-page__order-item">
                    <div className="profile-page__order-id">#{order.id.slice(-6)}</div>
                    <div className="profile-page__order-type">
                      {order.type === 'transfer' ? 'تحويل' : order.type === 'gaming' ? 'شحن ألعاب' : order.type}
                    </div>
                    <div className="profile-page__order-amount">
                      {formatAmount(amount)} {currencySymbol}
                    </div>
                    <div className={`profile-page__order-status ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/my-orders" className="profile-page__link">عرض كل الطلبات →</Link>
        </div>
      </div>

      {/* مستوى الولاء */}
      <div className="profile-page__card">
        <h3><FaTrophy /> مستوى الولاء</h3>
        <SpendingProgress />
      </div>
    </div>
  );
}
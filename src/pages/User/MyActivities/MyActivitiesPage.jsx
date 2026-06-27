// // src/pages/User/MyActivities/MyActivitiesPage.jsx
// import { useState, useEffect } from 'react';
// import { useAuth } from '../../../context/AuthContext';
// import { db } from '../../../firebase';
// import { 
//   collection, query, where, orderBy, getDocs, limit, 
//   startAfter, getCountFromServer
// } from 'firebase/firestore';
// import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
// import Loading from '../../../components/GeneralComponents/Loading/Loading';
// import useUserSpending from '../../../hooks/useUserSpending';
// import { 
//   FiActivity, FiDollarSign, FiShoppingBag, FiClock, 
//   FiCheckCircle, FiXCircle, FiAlertCircle, FiAward, 
//   FiZap, FiGift, FiRefreshCw 
// } from 'react-icons/fi';
// import './MyActivitiesPage.css';

// const PAGE_SIZE = 10;

// const statusLabels = {
//   pending: 'قيد المراجعة',
//   approved: 'تمت الموافقة',
//   rejected: 'مرفوض',
// };

// const orderStatusLabels = {
//   pending_verification: 'قيد التدقيق',
//   awaiting_customer_resubmit: 'بانتظار تعديلك',
//   verified_pending_execution: 'تم التدقيق',
//   rejected: 'مرفوض',
//   completed: 'مكتمل',
// };

// const orderTypes = {
//   transfer: 'تحويل شام كاش',
//   gaming: 'شحن ألعاب',
//   apps: 'شحن تطبيقات',
//   crypto: 'عملات رقمية',
//   exchange: 'صرافة',
// };

// export default function MyActivitiesPage() {
//   const { userData } = useAuth();
//   const { totalSpent, currentTier, nextTier, progressPercent, loading: spendingLoading } = useUserSpending();

//   const [activeTab, setActiveTab] = useState('deposits'); // 'deposits' | 'orders' | 'mgc' | 'friends'
//   const [deposits, setDeposits] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [mgcActivities, setMgcActivities] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({ deposits: 0, orders: 0, totalDeposits: 0, totalOrders: 0 });
//   const [lastDoc, setLastDoc] = useState(null);
//   const [hasMore, setHasMore] = useState(true);
//   const [loadingMore, setLoadingMore] = useState(false);

//   // جلب الإحصائيات
//   useEffect(() => {
//     const fetchStats = async () => {
//       if (!userData?.uid) return;
//       try {
//         const depositsSnap = await getDocs(
//           query(collection(db, 'topUpRequests'), where('userId', '==', userData.uid))
//         );
//         const depositsList = depositsSnap.docs.map(d => d.data());
//         const totalDeposits = depositsList.reduce((sum, d) => sum + (d.amount || 0), 0);
//         const approvedDeposits = depositsList.filter(d => d.status === 'approved');

//         const ordersSnap = await getCountFromServer(
//           query(collection(db, 'orders'), where('userId', '==', userData.uid))
//         );

//         setStats({
//           deposits: depositsList.length,
//           orders: ordersSnap.data().count,
//           totalDeposits: totalDeposits,
//           approvedDeposits: approvedDeposits.length,
//         });
//       } catch (err) {
//         console.error('خطأ في جلب الإحصائيات:', err);
//       }
//     };
//     fetchStats();
//   }, [userData]);

//   // جلب الإيداعات
//   const fetchDeposits = async (isLoadMore = false) => {
//     if (!userData?.uid) return;
//     setLoadingMore(isLoadMore);
//     if (!isLoadMore) setLoading(true);

//     try {
//       let q;
//       if (isLoadMore && lastDoc) {
//         q = query(
//           collection(db, 'topUpRequests'),
//           where('userId', '==', userData.uid),
//           orderBy('createdAt', 'desc'),
//           startAfter(lastDoc),
//           limit(PAGE_SIZE)
//         );
//       } else {
//         q = query(
//           collection(db, 'topUpRequests'),
//           where('userId', '==', userData.uid),
//           orderBy('createdAt', 'desc'),
//           limit(PAGE_SIZE)
//         );
//       }

//       const snapshot = await getDocs(q);
//       const items = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//         type: 'deposit',
//       }));

//       const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
//       setLastDoc(newLastDoc);
//       setHasMore(snapshot.docs.length === PAGE_SIZE);

//       if (isLoadMore) {
//         setDeposits(prev => [...prev, ...items]);
//       } else {
//         setDeposits(items);
//       }
//     } catch (err) {
//       console.error('خطأ في جلب الإيداعات:', err);
//     } finally {
//       setLoading(false);
//       setLoadingMore(false);
//     }
//   };

//   // جلب الطلبات
//   const fetchOrders = async (isLoadMore = false) => {
//     if (!userData?.uid) return;
//     setLoadingMore(isLoadMore);
//     if (!isLoadMore) setLoading(true);

//     try {
//       let q;
//       if (isLoadMore && lastDoc) {
//         q = query(
//           collection(db, 'orders'),
//           where('userId', '==', userData.uid),
//           orderBy('createdAt', 'desc'),
//           startAfter(lastDoc),
//           limit(PAGE_SIZE)
//         );
//       } else {
//         q = query(
//           collection(db, 'orders'),
//           where('userId', '==', userData.uid),
//           orderBy('createdAt', 'desc'),
//           limit(PAGE_SIZE)
//         );
//       }

//       const snapshot = await getDocs(q);
//       const items = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//         type: 'order',
//       }));

//       const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
//       setLastDoc(newLastDoc);
//       setHasMore(snapshot.docs.length === PAGE_SIZE);

//       if (isLoadMore) {
//         setOrders(prev => [...prev, ...items]);
//       } else {
//         setOrders(items);
//       }
//     } catch (err) {
//       console.error('خطأ في جلب الطلبات:', err);
//     } finally {
//       setLoading(false);
//       setLoadingMore(false);
//     }
//   };

//   // جلب نشاطات MGC
//   const fetchMgcActivities = async () => {
//     if (!userData?.uid) return;
//     setLoading(true);
//     try {
//       // جلب سجل الدولاب
//       const wheelSnap = await getDocs(
//         query(collection(db, 'wheelHistory'), where('userId', '==', userData.uid), orderBy('timestamp', 'desc'))
//       );
//       const wheelData = wheelSnap.docs.map(doc => ({ 
//         id: doc.id, 
//         ...doc.data(), 
//         type: 'wheel',
//         activityType: 'wheel',
//         amount: doc.data().prize || 0,
//         label: 'دولاب الحظ'
//       }));

//       // جلب سجل الماكينة
//       const machineSnap = await getDocs(
//         query(collection(db, 'machineHistory'), where('userId', '==', userData.uid), orderBy('timestamp', 'desc'))
//       );
//       const machineData = machineSnap.docs.map(doc => ({ 
//         id: doc.id, 
//         ...doc.data(), 
//         type: 'machine',
//         activityType: 'machine',
//         amount: doc.data().prize || 0,
//         label: 'ماكينة الحظ'
//       }));

//       // جلب سجل شراء MGC (إذا وجد)
//       let mgcPurchases = [];
//       try {
//         const mgcSnap = await getDocs(
//           query(collection(db, 'mgcPurchases'), where('userId', '==', userData.uid), orderBy('createdAt', 'desc'))
//         );
//         mgcPurchases = mgcSnap.docs.map(doc => ({ 
//           id: doc.id, 
//           ...doc.data(), 
//           type: 'mgc_purchase',
//           activityType: 'mgc_purchase',
//           amount: doc.data().mgcAmount || 0,
//           label: 'شراء MGC'
//         }));
//       } catch (e) {
//         console.warn('⚠️ لا توجد مجموعة mgcPurchases', e.message);
//       }

//       // دمج الكل وترتيب حسب الوقت
//       const all = [...wheelData, ...machineData, ...mgcPurchases];
//       all.sort((a, b) => {
//         const dateA = a.timestamp?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
//         const dateB = b.timestamp?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
//         return dateB - dateA;
//       });

//       setMgcActivities(all);
//     } catch (err) {
//       console.error('خطأ في جلب نشاطات MGC:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadMore = () => {
//     if (activeTab === 'deposits') {
//       fetchDeposits(true);
//     } else if (activeTab === 'orders') {
//       fetchOrders(true);
//     }
//   };

//   useEffect(() => {
//     if (activeTab === 'deposits') {
//       fetchDeposits();
//     } else if (activeTab === 'orders') {
//       fetchOrders();
//     } else if (activeTab === 'mgc') {
//       fetchMgcActivities();
//     }
//   }, [activeTab, userData]);

//   const formatDate = (timestamp) => {
//     if (!timestamp) return '—';
//     const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//     return date.toLocaleString('ar-EG');
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'approved':
//       case 'completed':
//         return <FiCheckCircle className="status-icon approved" />;
//       case 'rejected':
//         return <FiXCircle className="status-icon rejected" />;
//       case 'pending':
//       case 'pending_verification':
//       case 'awaiting_customer_resubmit':
//       case 'verified_pending_execution':
//         return <FiAlertCircle className="status-icon pending" />;
//       default:
//         return <FiClock className="status-icon" />;
//     }
//   };

//   const getStatusClass = (status) => {
//     if (['approved', 'completed'].includes(status)) return 'status-approved';
//     if (['rejected'].includes(status)) return 'status-rejected';
//     return 'status-pending';
//   };

//   // عرض الأيقونة المناسبة لنشاط MGC
//   const getMgcIcon = (activityType) => {
//     switch (activityType) {
//       case 'wheel':
//         return <FiRefreshCw className="mgc-icon wheel" />;
//       case 'machine':
//         return <FiZap className="mgc-icon machine" />;
//       case 'mgc_purchase':
//         return <FiGift className="mgc-icon purchase" />;
//       default:
//         return <FiActivity className="mgc-icon" />;
//     }
//   };

//   // عرض النص المناسب لنشاط MGC
//   const getMgcLabel = (item) => {
//     if (item.activityType === 'wheel') {
//       return `دولاب الحظ - ربح ${item.amount} MGC`;
//     }
//     if (item.activityType === 'machine') {
//       return `ماكينة الحظ - ${item.reward || 'جائزة'}`;
//     }
//     if (item.activityType === 'mgc_purchase') {
//       return `شراء ${item.amount} MGC`;
//     }
//     return 'نشاط MGC';
//   };

//   const renderMgcItem = (item) => {
//     const icon = getMgcIcon(item.activityType);
//     const label = getMgcLabel(item);
//     const date = formatDate(item.timestamp || item.createdAt);

//     return (
//       <div key={item.id} className="activity-item mgc-item">
//         <div className="activity-icon-wrapper mgc-icon-wrapper">
//           {icon}
//         </div>
//         <div className="activity-info">
//           <div className="activity-header">
//             <span className="activity-title">{label}</span>
//             <span className="activity-amount">
//               {item.amount > 0 && `+${item.amount} MGC`}
//             </span>
//           </div>
//           <div className="activity-details">
//             <span className="activity-type">
//               {item.activityType === 'wheel' && `سعر الدخول: ${item.cost || 0.25} MGC`}
//               {item.activityType === 'machine' && `سعر الدخول: ${item.cost || 75} MGC`}
//               {item.activityType === 'mgc_purchase' && `السعر: ${item.price || 0} $`}
//             </span>
//           </div>
//           <span className="activity-date">{date}</span>
//         </div>
//       </div>
//     );
//   };

//   if (loading && deposits.length === 0 && orders.length === 0 && mgcActivities.length === 0) {
//     return <Loading text="جاري تحميل نشاطاتك..." />;
//   }

//   const currentItems = activeTab === 'deposits' ? deposits : (activeTab === 'orders' ? orders : mgcActivities);

//   return (
//     <div className="my-activities-page" dir="rtl">
//       <div className="my-activities-page__header">
//         {/* <GoBackButton text="رجوع" /> */}
//         <h1 className="my-activities-page__title">نشاطاتي</h1>
//       </div>

//       {/* الإحصائيات السريعة */}
//       <div className="my-activities-page__stats">
//         <div className="stat-card">
//           <FiDollarSign className="stat-icon" />
//           <span className="stat-number">{stats.totalDeposits.toFixed(2)} $</span>
//           <span className="stat-label">إجمالي الإيداعات</span>
//         </div>
//         <div className="stat-card">
//           <FiShoppingBag className="stat-icon" />
//           <span className="stat-number">{stats.orders}</span>
//           <span className="stat-label">إجمالي الطلبات</span>
//         </div>
//         <div className="stat-card">
//           <FiCheckCircle className="stat-icon" />
//           <span className="stat-number">{stats.approvedDeposits || 0}</span>
//           <span className="stat-label">إيداعات معتمدة</span>
//         </div>
//       </div>

//       {/* مستوى الإنفاق */}
//       <div className="my-activities-page__spending">
//         <div className="spending-card">
//           <div className="spending-header">
//             <FiAward className="spending-icon" />
//             <span className="spending-title">مستوى الإنفاق</span>
//             <span className="spending-level">المستوى {currentTier?.level || 1}</span>
//           </div>
//           <div className="spending-progress-bar">
//             <div className="spending-progress-fill" style={{ width: `${progressPercent}%` }}></div>
//           </div>
//           <div className="spending-info">
//             <span className="spending-total">إجمالي الإنفاق: {totalSpent.toFixed(2)} $</span>
//             {nextTier ? (
//               <span className="spending-next">الهدف: {nextTier.min} $</span>
//             ) : (
//               <span className="spending-max">🏆 أعلى مستوى!</span>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* التبويبات */}
//       <div className="my-activities-page__tabs">
//         <button
//           className={`tab-btn ${activeTab === 'deposits' ? 'active' : ''}`}
//           onClick={() => setActiveTab('deposits')}
//         >
//           <FiDollarSign /> الإيداعات
//         </button>
//         <button
//           className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
//           onClick={() => setActiveTab('orders')}
//         >
//           <FiShoppingBag /> الطلبات
//         </button>
//         <button
//           className={`tab-btn ${activeTab === 'mgc' ? 'active' : ''}`}
//           onClick={() => setActiveTab('mgc')}
//         >
//           <FiZap /> MGC
//         </button>
//       </div>

//       {/* القائمة */}
//       <div className="my-activities-page__list">
//         {currentItems.length === 0 ? (
//           <div className="empty-state">
//             <FiActivity className="empty-icon" />
//             <p>
//               {activeTab === 'deposits' && 'لا توجد إيداعات حتى الآن'}
//               {activeTab === 'orders' && 'لا توجد طلبات حتى الآن'}
//               {activeTab === 'mgc' && 'لا توجد نشاطات MGC حتى الآن'}
//             </p>
//           </div>
//         ) : (
//           <>
//             {activeTab === 'mgc' ? (
//               mgcActivities.map(item => renderMgcItem(item))
//             ) : (
//               currentItems.map((item) => {
//                 if (item.type === 'deposit') {
//                   return (
//                     <div key={item.id} className="activity-item deposit-item">
//                       <div className="activity-icon-wrapper">
//                         {getStatusIcon(item.status)}
//                       </div>
//                       <div className="activity-info">
//                         <div className="activity-header">
//                           <span className="activity-title">إيداع #{item.id.slice(-6)}</span>
//                           <span className={`activity-status ${getStatusClass(item.status)}`}>
//                             {statusLabels[item.status] || item.status}
//                           </span>
//                         </div>
//                         <div className="activity-details">
//                           <span className="activity-amount">+{item.amount} $</span>
//                           <span className="activity-method">
//                             {item.paymentMethod === 'usdt' ? 'USDT' : 
//                              item.paymentMethod === 'shamCash' ? 'شام كاش' : 'سيريتل كاش'}
//                           </span>
//                         </div>
//                         <span className="activity-date">{formatDate(item.createdAt)}</span>
//                       </div>
//                     </div>
//                   );
//                 } else {
//                   // طلب
//                   const order = item;
//                   return (
//                     <div key={order.id} className="activity-item order-item">
//                       <div className="activity-icon-wrapper">
//                         {getStatusIcon(order.status)}
//                       </div>
//                       <div className="activity-info">
//                         <div className="activity-header">
//                           <span className="activity-title">
//                             {orderTypes[order.type] || order.type} #{order.id.slice(-6)}
//                           </span>
//                           <span className={`activity-status ${getStatusClass(order.status)}`}>
//                             {orderStatusLabels[order.status] || order.status}
//                           </span>
//                         </div>
//                         <div className="activity-details">
//                           <span className="activity-amount">
//                             {order.finalPriceUSD || order.finalPrice || order.amount} $
//                           </span>
//                           <span className="activity-type">
//                             {order.type === 'gaming' && `${order.gameName || 'لعبة'}`}
//                             {order.type === 'transfer' && `تحويل إلى ${order.recipientName}`}
//                             {order.type === 'apps' && `${order.itemName || 'تطبيق'}`}
//                             {order.type === 'crypto' && `${order.tradeType === 'buy' ? 'شراء' : 'بيع'} ${order.amount} USDT`}
//                             {order.type === 'exchange' && `صرافة ${order.exchangeType === 'buy_dollar' ? 'دولار' : 'ليرة'}`}
//                           </span>
//                         </div>
//                         <span className="activity-date">{formatDate(order.createdAt)}</span>
//                       </div>
//                     </div>
//                   );
//                 }
//               })
//             )}

//             {activeTab !== 'mgc' && hasMore && (
//               <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
//                 {loadingMore ? 'جاري التحميل...' : 'تحميل المزيد'}
//               </button>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }
// src/pages/User/MyActivitiesPage/MyActivitiesPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import {
  collection, query, where, orderBy, getDocs, limit,
  startAfter, getCountFromServer
} from 'firebase/firestore';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import useUserSpending from '../../../hooks/useUserSpending';
import StatsCards from './components/StatsCards';
import SpendingCard from './components/SpendingCard';
import Tabs from './components/Tabs';
import ActivityList from './components/ActivityList';
import './MyActivitiesPage.css';

const PAGE_SIZE = 10;

export default function MyActivitiesPage() {
  const { userData } = useAuth();
  const { totalSpent, currentTier, nextTier, progressPercent, loading: spendingLoading } = useUserSpending();

  const [activeTab, setActiveTab] = useState('deposits');
  const [deposits, setDeposits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [mgcActivities, setMgcActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ deposits: 0, orders: 0, totalDeposits: 0, approvedDeposits: 0 });
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // جلب الإحصائيات
  useEffect(() => {
    const fetchStats = async () => {
      if (!userData?.uid) return;
      try {
        const depositsSnap = await getDocs(
          query(collection(db, 'topUpRequests'), where('userId', '==', userData.uid))
        );
        const depositsList = depositsSnap.docs.map(d => d.data());
        const totalDeposits = depositsList.reduce((sum, d) => sum + (d.amount || 0), 0);
        const approvedDeposits = depositsList.filter(d => d.status === 'approved').length;

        const ordersSnap = await getCountFromServer(
          query(collection(db, 'orders'), where('userId', '==', userData.uid))
        );

        setStats({
          deposits: depositsList.length,
          orders: ordersSnap.data().count,
          totalDeposits,
          approvedDeposits,
        });
      } catch (err) {
        console.error('خطأ في جلب الإحصائيات:', err);
      }
    };
    fetchStats();
  }, [userData]);

  // جلب الإيداعات
  const fetchDeposits = async (isLoadMore = false) => {
    if (!userData?.uid) return;
    setLoadingMore(isLoadMore);
    if (!isLoadMore) setLoading(true);

    try {
      let q;
      if (isLoadMore && lastDoc) {
        q = query(
          collection(db, 'topUpRequests'),
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(
          collection(db, 'topUpRequests'),
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'deposit',
      }));

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      setLastDoc(newLastDoc);
      setHasMore(snapshot.docs.length === PAGE_SIZE);

      if (isLoadMore) {
        setDeposits(prev => [...prev, ...items]);
      } else {
        setDeposits(items);
      }
    } catch (err) {
      console.error('خطأ في جلب الإيداعات:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // جلب الطلبات
  const fetchOrders = async (isLoadMore = false) => {
    if (!userData?.uid) return;
    setLoadingMore(isLoadMore);
    if (!isLoadMore) setLoading(true);

    try {
      let q;
      if (isLoadMore && lastDoc) {
        q = query(
          collection(db, 'orders'),
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(
          collection(db, 'orders'),
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'order',
      }));

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      setLastDoc(newLastDoc);
      setHasMore(snapshot.docs.length === PAGE_SIZE);

      if (isLoadMore) {
        setOrders(prev => [...prev, ...items]);
      } else {
        setOrders(items);
      }
    } catch (err) {
      console.error('خطأ في جلب الطلبات:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // جلب نشاطات MGC
  const fetchMgcActivities = async () => {
    if (!userData?.uid) return;
    setLoading(true);
    try {
      const wheelSnap = await getDocs(
        query(collection(db, 'wheelHistory'), where('userId', '==', userData.uid), orderBy('timestamp', 'desc'))
      );
      const wheelData = wheelSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'wheel',
        activityType: 'wheel',
        amount: doc.data().prize || 0,
        label: 'دولاب الحظ'
      }));

      const machineSnap = await getDocs(
        query(collection(db, 'machineHistory'), where('userId', '==', userData.uid), orderBy('timestamp', 'desc'))
      );
      const machineData = machineSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'machine',
        activityType: 'machine',
        amount: doc.data().prize || 0,
        label: 'ماكينة الحظ'
      }));

      let mgcPurchases = [];
      try {
        const mgcSnap = await getDocs(
          query(collection(db, 'mgcPurchases'), where('userId', '==', userData.uid), orderBy('createdAt', 'desc'))
        );
        mgcPurchases = mgcSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'mgc_purchase',
          activityType: 'mgc_purchase',
          amount: doc.data().mgcAmount || 0,
          label: 'شراء MGC'
        }));
      } catch (e) {
        console.warn('⚠️ لا توجد مجموعة mgcPurchases', e.message);
      }

      const all = [...wheelData, ...machineData, ...mgcPurchases];
      all.sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.timestamp?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setMgcActivities(all);
    } catch (err) {
      console.error('خطأ في جلب نشاطات MGC:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (activeTab === 'deposits') {
      fetchDeposits(true);
    } else if (activeTab === 'orders') {
      fetchOrders(true);
    }
  };

  useEffect(() => {
    if (activeTab === 'deposits') {
      fetchDeposits();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'mgc') {
      fetchMgcActivities();
    }
  }, [activeTab, userData]);

  if (loading && deposits.length === 0 && orders.length === 0 && mgcActivities.length === 0) {
    return <Loading text="جاري تحميل نشاطاتك..." />;
  }

  const currentItems = activeTab === 'deposits' ? deposits : (activeTab === 'orders' ? orders : mgcActivities);

  return (
    <div className="my-activities-page" dir="rtl">
      <div className="my-activities-page__header">
        <h1 className="my-activities-page__title">نشاطاتي</h1>
      </div>

      <div className="my-activities-page__stats">
        <StatsCards stats={stats} />
      </div>

      <div className="my-activities-page__spending">
        <SpendingCard
          totalSpent={totalSpent}
          currentTier={currentTier}
          nextTier={nextTier}
          progressPercent={progressPercent}
        />
      </div>

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="my-activities-page__list">
        <ActivityList
          items={currentItems}
          type={activeTab}
          hasMore={hasMore}
          loadMore={loadMore}
          loadingMore={loadingMore}
        />
      </div>
    </div>
  );
}
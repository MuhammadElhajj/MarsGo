
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
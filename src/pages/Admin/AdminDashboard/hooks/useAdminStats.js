// src/pages/Admin/AdminDashboard/hooks/useAdminStats.js
import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../../../firebase';
import { COLORS } from '../utils/constants';   // ✅ استيراد الألوان

export function useAdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    rejectedOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    monthlyOrders: 0,
    monthlyRevenue: 0,
    totalReferrers: 0,
    totalReferred: 0,
  });
  const [orderTrend, setOrderTrend] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [orderTypeData, setOrderTypeData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchOrderTrend(),
        fetchOrderStatus(),
        fetchOrderTypes(),
        fetchUserGrowth(),
        fetchRecentOrders(),
        fetchTopUsers(),
      ]);
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const usersSnap = await getCountFromServer(collection(db, 'users'));
      const totalUsers = usersSnap.data().count;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsersQuery = query(
        collection(db, 'orders'),
        where('createdAt', '>=', thirtyDaysAgo)
      );
      const activeOrdersSnap = await getDocs(activeUsersQuery);
      const activeUserIds = new Set();
      activeOrdersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.userId) activeUserIds.add(data.userId);
      });
      const activeUsers = activeUserIds.size;

      const totalOrdersSnap = await getCountFromServer(collection(db, 'orders'));
      const totalOrders = totalOrdersSnap.data().count;

      const pendingQuery = query(
        collection(db, 'orders'),
        where('status', 'in', [
          'pending_verification',
          'awaiting_customer_resubmit',
          'verified_pending_execution',
        ])
      );
      const pendingSnap = await getCountFromServer(pendingQuery);
      const pendingOrders = pendingSnap.data().count;

      const completedQuery = query(
        collection(db, 'orders'),
        where('status', '==', 'completed')
      );
      const completedSnap = await getCountFromServer(completedQuery);
      const completedOrders = completedSnap.data().count;

      const rejectedQuery = query(
        collection(db, 'orders'),
        where('status', '==', 'rejected')
      );
      const rejectedSnap = await getCountFromServer(rejectedQuery);
      const rejectedOrders = rejectedSnap.data().count;

      let totalRevenue = 0;
      let todayRevenue = 0;
      let monthlyRevenue = 0;
      let todayOrders = 0;
      let monthlyOrders = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const recentCompletedQuery = query(
        collection(db, 'orders'),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(500)
      );
      const recentCompletedSnap = await getDocs(recentCompletedQuery);
      recentCompletedSnap.forEach((doc) => {
        const order = doc.data();
        const amount = order.finalPriceUSD || order.finalPrice || order.amount || 0;
        totalRevenue += amount;

        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
        if (orderDate >= today) {
          todayRevenue += amount;
          todayOrders++;
        }
        if (orderDate >= monthStart) {
          monthlyRevenue += amount;
          monthlyOrders++;
        }
      });

      const referralSnap = await getCountFromServer(
        collection(db, 'referral_rewards')
      );
      const totalReferred = referralSnap.data().count;
      const totalReferrers = 0;

      setStats({
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalOrders,
        pendingOrders,
        completedOrders,
        rejectedOrders,
        totalRevenue,
        todayOrders,
        todayRevenue,
        monthlyOrders,
        monthlyRevenue,
        totalReferrers,
        totalReferred,
        pendingReferrals: 0,
        claimedReferrals: 0,
      });
    } catch (err) {
      console.error('خطأ في جلب الإحصائيات:', err);
    }
  };

  const fetchOrderTrend = async () => {
    try {
      const days = 7;
      const result = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const q = query(
          collection(db, 'orders'),
          where('createdAt', '>=', date),
          where('createdAt', '<', nextDate)
        );
        const snap = await getDocs(q);

        const dayName = date.toLocaleDateString('ar-EG', { weekday: 'short' });
        const dayNum = date.getDate();

        let completed = 0,
          pending = 0,
          rejected = 0;
        snap.forEach((doc) => {
          const status = doc.data().status;
          if (status === 'completed') completed++;
          else if (status === 'rejected') rejected++;
          else pending++;
        });

        result.push({
          day: `${dayName} ${dayNum}`,
          completed,
          pending,
          rejected,
          total: snap.size,
        });
      }
      setOrderTrend(result);
    } catch (err) {
      console.error('خطأ في جلب اتجاه الطلبات:', err);
    }
  };

  const fetchOrderStatus = async () => {
    try {
      const statuses = [
        'pending_verification',
        'awaiting_customer_resubmit',
        'verified_pending_execution',
        'completed',
        'rejected',
      ];
      const labels = {
        pending_verification: 'قيد التدقيق',
        awaiting_customer_resubmit: 'بانتظار التعديل',
        verified_pending_execution: 'تم التدقيق',
        completed: 'مكتمل',
        rejected: 'مرفوض',
      };
      const colors = {
        pending_verification: COLORS.warning,
        awaiting_customer_resubmit: COLORS.info,
        verified_pending_execution: COLORS.primary,
        completed: COLORS.success,
        rejected: COLORS.danger,
      };

      const result = [];
      for (const status of statuses) {
        const q = query(collection(db, 'orders'), where('status', '==', status));
        const snap = await getCountFromServer(q);
        result.push({
          name: labels[status] || status,
          value: snap.data().count,
          color: colors[status] || COLORS.primary,
        });
      }
      setOrderStatusData(result);
    } catch (err) {
      console.error('خطأ في جلب توزيع الحالات:', err);
    }
  };

  const fetchOrderTypes = async () => {
    try {
      const types = ['transfer', 'gaming', 'apps', 'crypto', 'exchange'];
      const labels = {
        transfer: 'تحويل شام كاش',
        gaming: 'شحن ألعاب',
        apps: 'شحن تطبيقات',
        crypto: 'عملات رقمية',
        exchange: 'صرافة',
      };
      const colors = {
        transfer: COLORS.info,
        gaming: COLORS.primary,
        apps: COLORS.success,
        crypto: COLORS.warning,
        exchange: COLORS.pink,
      };

      const result = [];
      for (const type of types) {
        const q = query(collection(db, 'orders'), where('type', '==', type));
        const snap = await getCountFromServer(q);
        if (snap.data().count > 0) {
          result.push({
            name: labels[type] || type,
            value: snap.data().count,
            color: colors[type] || COLORS.primary,
          });
        }
      }
      setOrderTypeData(result);
    } catch (err) {
      console.error('خطأ في جلب أنواع الطلبات:', err);
    }
  };

  const fetchUserGrowth = async () => {
    try {
      const days = 7;
      const result = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const q = query(
          collection(db, 'users'),
          where('createdAt', '>=', date),
          where('createdAt', '<', nextDate)
        );
        const snap = await getDocs(q);

        const dayName = date.toLocaleDateString('ar-EG', { weekday: 'short' });
        result.push({
          day: `${dayName}`,
          newUsers: snap.size,
        });
      }
      setUserGrowthData(result);
    } catch (err) {
      console.error('خطأ في جلب نمو المستخدمين:', err);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snap = await getDocs(q);
      const orders = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentOrders(orders);
    } catch (err) {
      console.error('خطأ في جلب آخر الطلبات:', err);
    }
  };

  const fetchTopUsers = async () => {
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const userOrders = {};
      ordersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.userId) {
          if (!userOrders[data.userId]) {
            userOrders[data.userId] = { count: 0, total: 0 };
          }
          userOrders[data.userId].count++;
          const amount = data.finalPriceUSD || data.finalPrice || data.amount || 0;
          userOrders[data.userId].total += amount;
        }
      });

      const sorted = Object.entries(userOrders)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

      const topUsersData = [];
      for (const [userId, data] of sorted) {
        const userSnap = await getDoc(doc(db, 'users', userId));
        const user = userSnap.exists() ? userSnap.data() : { name: 'مستخدم' };
        topUsersData.push({
          id: userId,
          name: user.name || 'مستخدم',
          orders: data.count,
          total: data.total,
        });
      }
      setTopUsers(topUsersData);
    } catch (err) {
      console.error('خطأ في جلب أهم المستخدمين:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return {
    stats,
    orderTrend,
    orderStatusData,
    orderTypeData,
    userGrowthData,
    recentOrders,
    topUsers,
    loading,
    refreshing,
    fetchAllData,
  };
}
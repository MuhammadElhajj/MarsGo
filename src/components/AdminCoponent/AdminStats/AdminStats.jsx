import { useEffect, useState } from 'react';
import { db } from '../../../firebase';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import StatCard from '../../UserComponents/StatCard/StatCard';
import './AdminStats.css';

export default function AdminStats() {
  const [stats, setStats] = useState({ users: 0, orders: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const ordersSnap = await getCountFromServer(collection(db, 'orders'));
        const pendingSnap = await getCountFromServer(query(collection(db, 'orders'), where('status', '==', 'verified_pending_execution')));
        const completedSnap = await getCountFromServer(query(collection(db, 'orders'), where('status', '==', 'completed')));

        setStats({
          users: usersSnap.data().count,
          orders: ordersSnap.data().count,
          pending: pendingSnap.data().count,
          completed: completedSnap.data().count,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <p>جاري تحميل الإحصائيات...</p>;

  return (
    <div className="admin-stats">
      <h2>لوحة تحكم المدير</h2>
      <div className="admin-stats__grid">
        <StatCard title="إجمالي المستخدمين" value={stats.users} colorClass="accent" />
        <StatCard title="إجمالي الطلبات" value={stats.orders} colorClass="blue" />
        <StatCard title="طلبات بانتظار التنفيذ" value={stats.pending} colorClass="yellow" />
        <StatCard title="الطلبات المكتملة" value={stats.completed} colorClass="green" />
      </div>
    </div>
  );
}
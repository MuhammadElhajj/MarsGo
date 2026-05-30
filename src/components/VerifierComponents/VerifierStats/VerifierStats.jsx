import { useEffect, useState } from 'react';
import { db } from '../../../firebase';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import StatCard from '../../UserComponents/StatCard/StatCard';
import './VerifierStats.css';

export default function VerifierStats() {
  const [stats, setStats] = useState({ pending: 0, verifiedToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const pendingSnap = await getCountFromServer(query(collection(db, 'orders'), where('status', '==', 'pending_verification')));
        const today = new Date();
        today.setHours(0,0,0,0);
        const verifiedSnap = await getCountFromServer(query(
          collection(db, 'orders'),
          where('status', '==', 'verified_pending_execution'),
          where('verifiedAt', '>=', today)
        )).catch(() => ({ data: () => ({ count: 0 }) }));

        setStats({
          pending: pendingSnap.data().count,
          verifiedToday: verifiedSnap.data().count,
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
    <div className="verifier-stats">
      <h2>لوحة تحكم المدقق</h2>
      <div className="verifier-stats__grid">
        <StatCard title="طلبات بانتظار التدقيق" value={stats.pending} colorClass="yellow" />
        <StatCard title="تم التدقيق اليوم" value={stats.verifiedToday} colorClass="green" />
      </div>
    </div>
  );
}
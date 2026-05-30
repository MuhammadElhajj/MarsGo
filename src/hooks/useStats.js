import { useEffect, useState } from "react";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function useStats() {
  const { userData } = useAuth();
  const [stats, setStats] = useState({ users: 0, orders: 0, pendingOrders: 0, completedToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userData?.uid) {
        setLoading(false);
        return;
      }
      try {
        let usersCount = 0;
        if (userData.role === 'admin') {
          const usersSnap = await getCountFromServer(collection(db, "users"));
          usersCount = usersSnap.data().count;
        }

        // طلبات المستخدم نفسه
        const userOrdersQuery = query(collection(db, "orders"), where("userId", "==", userData.uid));
        const ordersSnap = await getCountFromServer(userOrdersQuery);
        
        const pendingQuery = query(collection(db, "orders"), where("userId", "==", userData.uid), where("status", "not-in", ["completed", "rejected"]));
        const pendingSnap = await getCountFromServer(pendingQuery);
        
        // ✅ تعديل: حساب الطلبات المكتملة اليوم بطريقة بسيطة دون استخدام `completedAt`
        // نجلب جميع الطلبات المكتملة ثم نفلترها في JavaScript (أفضل من إنشاء فهرس معقد)
        const completedQuery = query(
          collection(db, "orders"),
          where("userId", "==", userData.uid),
          where("status", "==", "completed")
        );
        const completedSnap = await getDocs(completedQuery);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        let completedTodayCount = 0;
        completedSnap.forEach(doc => {
          const data = doc.data();
          const completedAt = data.completedAt?.toDate ? data.completedAt.toDate() : new Date(data.completedAt);
          if (completedAt && completedAt >= todayStart) {
            completedTodayCount++;
          }
        });

        setStats({
          users: usersCount,
          orders: ordersSnap.data().count,
          pendingOrders: pendingSnap.data().count,
          completedToday: completedTodayCount,
        });
      } catch (error) {
        console.error("خطأ في جلب الإحصائيات:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userData]);

  return { stats, loading };
}
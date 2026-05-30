import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function useUserStats() {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    pendingVerification: 0,      // قيد التدقيق
    awaitingResubmit: 0,         // بانتظار تعديل الزبون
    verifiedPendingExecution: 0, // تم التدقيق - بانتظار التنفيذ
    completed: 0,                // مكتمل
    rejected: 0,                 // مرفوض
    total: 0,                    // إجمالي طلبات المستخدم
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }
    const fetchStats = async () => {
      try {
        const ordersRef = collection(db, "orders");
        const baseQuery = query(ordersRef, where("userId", "==", userData.uid));

        // إجمالي الطلبات
        const totalSnap = await getCountFromServer(baseQuery);
        
        // لكل حالة
        const pendingSnap = await getCountFromServer(query(baseQuery, where("status", "==", "pending_verification")));
        const resubmitSnap = await getCountFromServer(query(baseQuery, where("status", "==", "awaiting_customer_resubmit")));
        const verifiedSnap = await getCountFromServer(query(baseQuery, where("status", "==", "verified_pending_execution")));
        const completedSnap = await getCountFromServer(query(baseQuery, where("status", "==", "completed")));
        const rejectedSnap = await getCountFromServer(query(baseQuery, where("status", "==", "rejected")));

        setStats({
          pendingVerification: pendingSnap.data().count,
          awaitingResubmit: resubmitSnap.data().count,
          verifiedPendingExecution: verifiedSnap.data().count,
          completed: completedSnap.data().count,
          rejected: rejectedSnap.data().count,
          total: totalSnap.data().count,
        });
      } catch (err) {
        console.error("خطأ في جلب إحصائيات المستخدم:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userData]);

  return { stats, loading };
}
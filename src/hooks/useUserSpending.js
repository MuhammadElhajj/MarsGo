import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

// تعريف المستويات (بالدولار)
const TIERS = [
  { level: 1, min: 0, max: 200, target: 200 },
  { level: 2, min: 200, max: 500, target: 500 },
  { level: 3, min: 500, max: 1000, target: 1000 },
  { level: 4, min: 1000, max: 2500, target: 2500 },
  { level: 5, min: 2500, max: Infinity, target: null },
];

export default function useUserSpending() {
  const { userData } = useAuth();
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState(null);
  const [nextTier, setNextTier] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (!userData?.uid) {
      setTotalSpent(0);
      setLoading(false);
      return;
    }

    const fetchCompletedOrders = async () => {
      try {
        // جلب الطلبات المكتملة فقط
        const q = query(
          collection(db, "orders"),
          where("userId", "==", userData.uid),
          where("status", "==", "completed")
        );
        const snapshot = await getDocs(q);
        let total = 0;

        snapshot.forEach((doc) => {
          const order = doc.data();
          // الحصول على المبلغ بالدولار: يعتمد على الحقول الموجودة
          let amountUSD = 0;
          if (order.finalPriceUSD && typeof order.finalPriceUSD === "number") {
            amountUSD = order.finalPriceUSD;
          } else if (order.finalPrice && order.currency === "USD") {
            amountUSD = order.finalPrice;
          } else if (order.amount && order.currency === "USD") {
            amountUSD = order.amount;
          } else if (order.amount && typeof order.amount === "number") {
            // إذا كان الحقل amount فقط بدون عملة (افتراض دولار)
            amountUSD = order.amount;
          }
          total += amountUSD;
        });

        setTotalSpent(total);

        // تحديد المستوى الحالي والمستوى التالي
        let current = null;
        let next = null;
        for (let i = 0; i < TIERS.length; i++) {
          const tier = TIERS[i];
          if (total >= tier.min && total < tier.max) {
            current = tier;
            if (i + 1 < TIERS.length) next = TIERS[i + 1];
            break;
          }
        }
        // إذا تجاوز أعلى مستوى
        if (!current && total >= TIERS[TIERS.length - 1].min) {
          current = TIERS[TIERS.length - 1];
          next = null;
        }
        setCurrentTier(current);
        setNextTier(next);

        // حساب نسبة التقدم للمستوى الحالي
        if (current && next) {
          const range = next.min - current.min;
          const progress = total - current.min;
          const percent = (progress / range) * 100;
          setProgressPercent(Math.min(100, Math.max(0, percent)));
        } else if (current && !next) {
          setProgressPercent(100);
        } else {
          setProgressPercent(0);
        }
      } catch (err) {
        console.error("خطأ في حساب الإنفاق:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedOrders();
  }, [userData]);

  return { totalSpent, currentTier, nextTier, progressPercent, loading };
}
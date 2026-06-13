import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

// تعريف المستويات (بالدولار)
const TIERS = [
  { level: 1, min: 0, max: 200, target: 200 },
  { level: 2, min: 200, max: 500, target: 500 },
  { level: 3, min: 500, max: 1000, target: 1000 },
  { level: 4, min: 1000, max: 2500, target: 2500 },
  { level: 5, min: 2500, max: Infinity, target: null },
];

// دالة حساب المستوى خارج الـ component لتجنب إعادة الإنشاء
const calculateTierAndProgress = (total) => {
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
  if (!current && total >= TIERS[TIERS.length - 1].min) {
    current = TIERS[TIERS.length - 1];
    next = null;
  }

  let progressPercent = 0;
  if (current && next) {
    const range = next.min - current.min;
    const progress = total - current.min;
    progressPercent = Math.min(100, Math.max(0, (progress / range) * 100));
  } else if (current && !next) {
    progressPercent = 100;
  }

  return { currentTier: current, nextTier: next, progressPercent };
};

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
      setCurrentTier(null);
      setNextTier(null);
      setProgressPercent(0);
      setLoading(false);
      return;
    }

    const fetchCompletedOrders = async () => {
      try {
        // ✅ إضافة حد أقصى 500 طلب مكتمل (يمكن تعديل الرقم حسب الحاجة)
        const q = query(
          collection(db, "orders"),
          where("userId", "==", userData.uid),
          where("status", "==", "completed"),
          limit(500)
        );
        const snapshot = await getDocs(q);
        let total = 0;

        snapshot.forEach((doc) => {
          const order = doc.data();
          let amountUSD = 0;
          if (order.finalPriceUSD && typeof order.finalPriceUSD === "number") {
            amountUSD = order.finalPriceUSD;
          } else if (order.finalPrice && order.currency === "USD") {
            amountUSD = order.finalPrice;
          } else if (order.amount && order.currency === "USD") {
            amountUSD = order.amount;
          } else if (order.amount && typeof order.amount === "number") {
            amountUSD = order.amount;
          }
          total += amountUSD;
        });

        setTotalSpent(total);
        const { currentTier: cur, nextTier: nxt, progressPercent: prog } = calculateTierAndProgress(total);
        setCurrentTier(cur);
        setNextTier(nxt);
        setProgressPercent(prog);
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
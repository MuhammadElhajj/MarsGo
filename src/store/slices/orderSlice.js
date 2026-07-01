// src/store/slices/orderSlice.js
import { collection, query, where, getDocs, addDoc, serverTimestamp , orderBy , limit} from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

export const createOrderSlice = (set, get) => ({
  getDepositCount: async () => {
    const { user } = get();
    if (!user) return 0;
    try {
      const q = query(collection(db, 'topUpRequests'), where('userId', '==', user.uid), where('status', '==', 'approved'));
      const snap = await getDocs(q);
      return snap.size;
    } catch { return 0; }
  },

  getOrdersCount: async () => {
    const { user } = get();
    if (!user) return 0;
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid), where('status', '==', 'completed'));
      const snap = await getDocs(q);
      return snap.size;
    } catch { return 0; }
  },

  sellMgc: async (mgcAmount) => {
    const { user, mgcBalance } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return false;
    }
    if (mgcAmount <= 0) {
      toast.error('الكمية يجب أن تكون أكبر من صفر');
      return false;
    }
    if (mgcAmount > mgcBalance) {
      toast.error(`الرصيد المتاح هو ${mgcBalance} MGC فقط`);
      return false;
    }
    const RATE = 0.007;
    const usdAmount = mgcAmount * RATE;
    try {
    // ✅ خصم MGC (تمرير reason)
      const deducted = await get().deductMgcBalance(mgcAmount, 'بيع MGC');
      if (!deducted) {
        toast.error('فشل خصم MGC');
        return false;
      }
     // ✅ إضافة رصيد حقيقي (المبلغ أولاً، وليس userId)
      const added = await get().addBalance(usdAmount, 'بيع MGC');
      if (!added) {
        // استرجاع MGC في حال فشل إضافة الرصيد
        await get().addMgcBalance(mgcAmount, 'استرجاع MGC');
        toast.error('فشل إضافة الرصيد، تم استرجاع MGC');
        return false;
      }
      await addDoc(collection(db, 'mgcSales'), {
        userId: user.uid,
        mgcAmount: mgcAmount,
        usdReceived: usdAmount,
        rate: RATE,
        timestamp: serverTimestamp(),
      });
      toast.success(`✅ تم بيع ${mgcAmount} MGC مقابل ${usdAmount.toFixed(2)} $`);
      return true;
    } catch (error) {
      console.error('فشل بيع MGC:', error);
      toast.error('حدث خطأ أثناء البيع');
      return false;
    }
  },

  getMgcSalesHistory: async () => {
  const { user } = get();
  if (!user) return [];
  try {
    const q = query(
      collection(db, 'mgcSales'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('خطأ في جلب سجل البيع:', error);
    return [];
  }
},
});
// src/pages/FinanceVerifier/FinanceTopUpRequests.jsx
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, query, where, onSnapshot, updateDoc, doc,
  getDoc, addDoc, increment, serverTimestamp, getDocs
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/store';
import Button from '../../components/GeneralComponents/Button/Button';
import Loading from '../../components/GeneralComponents/Loading/Loading';
import { showToast } from '../../components/GeneralComponents/ToastNotification/ToastNotification';
import './FinanceTopUpRequests.css';

export default function FinanceTopUpRequests() {
  const { userData } = useAuth();
  
  const topUpSettings = useAppStore((state) => state.topUpSettings);
  const addBalance = useAppStore((state) => state.addBalance);
  const addNotification = useAppStore((state) => state.addNotification);
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!userData) return;
    const q = query(collection(db, 'topUpRequests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(list);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userData]);

  // ============================================================
  // ✅ دالة صرف مكافأة الإحالة (تُستدعى عند أول إيداع معتمد)
  // ============================================================
  const handleReferralReward = async (userId) => {
    try {
      // 1. جلب بيانات المستخدم
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      const userData = userSnap.data();

      // 2. التحقق من وجود مُحيل
      if (!userData.referredBy) return;

      // 3. التحقق من أن هذا هو أول إيداع للمستخدم
      const depositQuery = query(
        collection(db, 'topUpRequests'),
        where('userId', '==', userId),
        where('status', '==', 'approved')
      );
      const depositSnap = await getDocs(depositQuery);
      if (depositSnap.size > 1) return; // ليس أول إيداع

      // 4. التحقق من عدم وجود مكافأة مسجلة مسبقاً
      const rewardQuery = query(
        collection(db, 'referral_rewards'),
        where('referredId', '==', userId)
      );
      const rewardSnap = await getDocs(rewardQuery);
      if (!rewardSnap.empty) return; // تم صرف المكافأة سابقاً

      // 5. إضافة 20 MGC إلى referralBalance للمُحيل
      const referrerId = userData.referredBy;
      await updateDoc(doc(db, 'users', referrerId), {
        referralBalance: increment(20),
      });

      // 6. تسجيل المكافأة في referral_rewards (حالة pending)
      await addDoc(collection(db, 'referral_rewards'), {
        referrerId: referrerId,
        referredId: userId,
        rewardAmount: 20,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // 7. تحديث userRef لمنع تكرار المكافأة (اختياري)
      await updateDoc(userRef, {
        referralRewardClaimed: true,
      });

      // 8. إشعار للمُحيل
      try {
        await addNotification({
          userId: referrerId,
          title: '🎉 مكافأة إحالة جديدة!',
          message: `تم إضافة 20 MGC إلى رصيد إحالاتك. اجمع 100 MGC لصرفها.`,
          type: 'referral_reward',
          read: false,
          createdAt: new Date(),
        });
      } catch (notifErr) {
        console.warn('فشل إرسال الإشعار:', notifErr);
      }

      console.log(`✅ تم إضافة 20 MGC إلى رصيد إحالات المستخدم ${referrerId}`);
    } catch (err) {
      console.error('فشل صرف مكافأة الإحالة:', err);
    }
  };

  const handleApprove = async (request) => {
    if (!window.confirm(`تأكيد الموافقة على طلب الإيداع رقم #${request.id.slice(-6)} بقيمة ${request.amount} $؟`)) return;
    setActionLoading(request.id);
    try {
      // إضافة الرصيد الحقيقي للمستخدم
      const balanceAdded = await addBalance(request.userId, request.amount);
      if (!balanceAdded) throw new Error('فشل إضافة الرصيد');

      // ✅ صرف مكافأة الإحالة (إذا كانت مستوفية للشروط)
      await handleReferralReward(request.userId);

      await updateDoc(doc(db, 'topUpRequests', request.id), {
        status: 'approved',
        approvedBy: userData.uid,
        approvedAt: new Date(),
      });

      await addNotification({
        userId: request.userId,
        title: '💰 تم شحن رصيدك',
        message: `تمت الموافقة على طلب الإيداع رقم #${request.id.slice(-6)} بقيمة ${request.amount} $ وتم إضافتها إلى رصيدك.`,
        type: 'order_completed',
        orderId: request.id,
        link: '/profile',
        read: false,
        createdAt: new Date(),
      });

      showToast(`✅ تمت الموافقة على الإيداع وإضافة ${request.amount} $ إلى رصيد العميل`, 'success');
    } catch (err) {
      console.error(err);
      showToast('❌ فشل الموافقة على الإيداع', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (request) => {
    const reason = prompt('سبب الرفض (اختياري):');
    setActionLoading(request.id);
    try {
      await updateDoc(doc(db, 'topUpRequests', request.id), {
        status: 'rejected',
        rejectedBy: userData.uid,
        rejectedAt: new Date(),
        rejectReason: reason || '',
      });

      await addNotification({
        userId: request.userId,
        title: '❌ تم رفض طلب الإيداع',
        message: `تم رفض طلب الإيداع رقم #${request.id.slice(-6)} بقيمة ${request.amount} $${reason ? ` السبب: ${reason}` : ''}.`,
        type: 'order_rejected',
        orderId: request.id,
        link: '/profile',
        read: false,
        createdAt: new Date(),
      });

      showToast(`❌ تم رفض طلب الإيداع #${request.id.slice(-6)}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('فشل رفض الطلب', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Loading text="جاري تحميل طلبات الإيداع..." />;

  return (
    <div className="finance-topup" dir="rtl">
      <h2>💰 تدقيق طلبات شحن الرصيد</h2>
      <p>الطلبات المعلقة بانتظار موافقتك</p>

      {requests.length === 0 ? (
        <p className="finance-topup__empty">لا توجد طلبات إيداع معلقة حالياً.</p>
      ) : (
        <div className="finance-topup__list">
          {requests.map(req => (
            <div key={req.id} className="finance-topup__card">
              <div className="request-header">
                <span className="request-id">#{req.id.slice(-6)}</span>
                <span className="request-status pending">قيد المراجعة</span>
              </div>
              <div className="request-details">
                <p><strong>💰 المبلغ:</strong> {req.amount} $</p>
                <p><strong>👤 العميل:</strong> {req.userName}</p>
                <p><strong>🏦 طريقة الدفع:</strong> {
                  req.paymentMethod === 'usdt' ? 'USDT' :
                  req.paymentMethod === 'shamCash' ? 'شام كاش' : 'سيريتل كاش'
                }</p>
                <p><strong>📄 رقم العملية:</strong> {req.transactionNumber || '—'}</p>
                <p><strong>📛 اسم المرسل:</strong> {req.senderName || '—'}</p>
                <p><strong>📅 تاريخ الطلب:</strong> {req.createdAt?.toDate().toLocaleString('ar-SY') || '—'}</p>
              </div>
              <div className="finance-topup__actions">
                <Button onClick={() => handleApprove(req)} disabled={actionLoading === req.id}>
                  {actionLoading === req.id ? 'جاري...' : '✅ تأكيد الإيداع'}
                </Button>
                <Button variant="danger" onClick={() => handleReject(req)} disabled={actionLoading === req.id}>
                  ❌ رفض
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
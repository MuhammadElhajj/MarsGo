// src/pages/FinanceVerifier/FinanceTopUpRequests.jsx
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useTopUpSettings } from '../../context/TopUpSettingsContext';
import { useNotifications } from '../../context/NotificationContext'; // إضافة
import { useBalance } from '../../context/BalanceContext';
import Button from '../../components/GeneralComponents/Button/Button';
import Loading from '../../components/GeneralComponents/Loading/Loading';
import { showToast } from '../../components/GeneralComponents/ToastNotification/ToastNotification';
import './FinanceTopUpRequests.css';

export default function FinanceTopUpRequests() {
  const { userData } = useAuth();
  const { settings: topUpSettings, loading: settingsLoading } = useTopUpSettings();
  const { addBalance } = useBalance();
  const { addNotification } = useNotifications(); // إضافة
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

  const handleApprove = async (request) => {
    if (!window.confirm(`تأكيد الموافقة على طلب الإيداع رقم #${request.id.slice(-6)} بقيمة ${request.amount} $؟`)) return;
    setActionLoading(request.id);
    try {
      // إضافة الرصيد للمستخدم
      const balanceAdded = await addBalance(request.userId, request.amount);
      if (!balanceAdded) throw new Error('فشل إضافة الرصيد');

      // تحديث حالة الطلب
      await updateDoc(doc(db, 'topUpRequests', request.id), {
        status: 'approved',
        approvedBy: userData.uid,
        approvedAt: new Date(),
      });

      // ✅ إشعار للمستخدم بنجاح الإيداع
      await addNotification(
        request.userId,
        '💰 تم شحن رصيدك',
        `تمت الموافقة على طلب الإيداع رقم #${request.id.slice(-6)} بقيمة ${request.amount} $ وتم إضافتها إلى رصيدك.`,
        'order_completed', // أو نوع خاص topup_approved
        request.id,
        '/profile'
      );

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

      // ✅ إشعار للمستخدم برفض الإيداع
      await addNotification(
        request.userId,
        '❌ تم رفض طلب الإيداع',
        `تم رفض طلب الإيداع رقم #${request.id.slice(-6)} بقيمة ${request.amount} $${reason ? ` السبب: ${reason}` : ''}.`,
        'order_rejected',
        request.id,
        '/profile'
      );

      showToast(`❌ تم رفض طلب الإيداع #${request.id.slice(-6)}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('فشل رفض الطلب', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (settingsLoading || loading) return <Loading text="جاري تحميل طلبات الإيداع..." />;

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
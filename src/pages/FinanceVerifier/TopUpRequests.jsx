import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useBalance } from '../../context/BalanceContext';
import Button from '../../components/GeneralComponents/Button/Button';
import { showToast } from '../../components/GeneralComponents/ToastNotification/ToastNotification';
import './FinanceTopUpRequests.css';

export default function FinanceTopUpRequests() {
  const { addBalance } = useBalance();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'topUpRequests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(reqs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (request) => {
    try {
      // إضافة الرصيد للمستخدم
      const success = await addBalance(request.userId, request.amount);
      if (!success) throw new Error('فشل إضافة الرصيد');
      
      // تحديث حالة الطلب
      await updateDoc(doc(db, 'topUpRequests', request.id), {
        status: 'approved',
        approvedAt: new Date(),
      });
      
      showToast(`✅ تمت إضافة ${request.amount} $ إلى رصيد المستخدم`, 'success');
    } catch (error) {
      console.error(error);
      showToast('فشل قبول الطلب', 'error');
    }
  };

  const handleReject = async (request) => {
    await updateDoc(doc(db, 'topUpRequests', request.id), {
      status: 'rejected',
      rejectedAt: new Date(),
    });
    showToast('❌ تم رفض الطلب', 'success');
  };

  if (loading) return <div>جاري تحميل طلبات الشحن...</div>;

  return (
    <div className="finance-topup" dir="rtl">
      <h2>طلبات شحن الرصيد</h2>
      {requests.length === 0 ? (
        <p>لا توجد طلبات معلقة</p>
      ) : (
        <div className="finance-topup__list">
          {requests.map(req => (
            <div key={req.id} className="finance-topup__card">
              <p><strong>المستخدم:</strong> {req.userName || req.userId}</p>
              <p><strong>المبلغ:</strong> {req.amount} $</p>
              <p><strong>طريقة الدفع:</strong> {req.paymentMethod}</p>
              <p><strong>التاريخ:</strong> {req.createdAt?.toDate().toLocaleString()}</p>
              {req.receiptImage && (
                <button onClick={() => window.open(req.receiptImage)}>عرض الإيصال</button>
              )}
              <div className="finance-topup__actions">
                <Button onClick={() => handleApprove(req)}>قبول وإضافة الرصيد</Button>
                <Button variant="danger" onClick={() => handleReject(req)}>رفض</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
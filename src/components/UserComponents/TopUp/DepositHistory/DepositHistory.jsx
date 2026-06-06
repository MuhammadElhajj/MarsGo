// src/components/UserComponents/TopUp/DepositHistory.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { db } from '../../../../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import './DepositHistory.css';

export default function DepositHistory() {
  const { userData } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'topUpRequests'),
      where('userId', '==', userData.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDeposits(list);
      setLoading(false);
    }, (error) => {
      console.error('خطأ في جلب سجل الإيداعات:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  // حساب مدة التنفيذ (بالدقائق والساعات)
  const getExecutionTime = (createdAt, approvedAt) => {
    if (!createdAt || !approvedAt) return '—';
    const created = createdAt.toDate();
    const approved = approvedAt.toDate();
    const diffMs = approved - created;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    if (diffHours < 24) return `${diffHours} ساعة و ${remainingMins} دقيقة`;
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    return `${diffDays} يوم و ${remainingHours} ساعة`;
  };

  // تنسيق التاريخ
  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    return timestamp.toDate().toLocaleString('ar-SY');
  };

  if (loading) return <div className="deposit-history-loading">جاري تحميل سجل الإيداعات...</div>;

  return (
    <div className="deposit-history">
      <h3 className="deposit-history__title">📋 سجل عمليات الإيداع</h3>
      {deposits.length === 0 ? (
        <p className="deposit-history__empty">لا توجد عمليات إيداع حتى الآن.</p>
      ) : (
        <div className="deposit-history__table-wrapper">
          <table className="deposit-history__table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>المبلغ</th>
                <th>تاريخ الطلب</th>
                <th>تاريخ الموافقة</th>
                <th>مدة التنفيذ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((deposit) => (
                <tr key={deposit.id}>
                  <td className="deposit-id">#{deposit.id.slice(-6)}</td>
                  <td>{deposit.amount} $</td>
                  <td>{formatDate(deposit.createdAt)}</td>
                  <td>{deposit.approvedAt ? formatDate(deposit.approvedAt) : '—'}</td>
                  <td>
                    {deposit.status === 'approved'
                      ? getExecutionTime(deposit.createdAt, deposit.approvedAt)
                      : '—'}
                  </td>
                  <td>
                    <span className={`deposit-status deposit-status--${deposit.status}`}>
                      {deposit.status === 'pending' && 'قيد المراجعة'}
                      {deposit.status === 'approved' && 'تمت الموافقة'}
                      {deposit.status === 'rejected' && 'مرفوض'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
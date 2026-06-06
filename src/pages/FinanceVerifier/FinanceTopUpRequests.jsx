// src/pages/FinanceVerifier/FinanceTopUpRequests.jsx
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useBalance } from '../../context/BalanceContext';
import { useTopUpSettings } from '../../context/TopUpSettingsContext';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../../components/GeneralComponents/Button/Button';
import { showToast } from '../../components/GeneralComponents/ToastNotification/ToastNotification';
import './FinanceTopUpRequests.css';

export default function FinanceTopUpRequests() {
  const { addBalance } = useBalance();
  const { settings, loading: settingsLoading } = useTopUpSettings();
  const { addNotification } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null); // لعرض الصورة في مودال

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
      const success = await addBalance(request.userId, request.amount);
      if (!success) throw new Error('فشل إضافة الرصيد');

      await updateDoc(doc(db, 'topUpRequests', request.id), {
        status: 'approved',
        approvedAt: new Date(),
      });

      await addNotification(
        request.userId,
        '💰 تم شحن رصيدك',
        `تم إضافة ${request.amount} $ إلى رصيدك بنجاح. رقم الطلب: #${request.id.slice(-6)}`,
        'topup_completed',
        request.id,
        '/profile'
      );

      showToast(`✅ تمت إضافة ${request.amount} $ إلى رصيد المستخدم`, 'success');
    } catch (error) {
      console.error(error);
      showToast('فشل قبول الطلب', 'error');
    }
  };

  const handleReject = async (request) => {
    try {
      await updateDoc(doc(db, 'topUpRequests', request.id), {
        status: 'rejected',
        rejectedAt: new Date(),
      });

      await addNotification(
        request.userId,
        '❌ تم رفض طلب شحن الرصيد',
        `طلب شحن الرصيد بقيمة ${request.amount} $ تم رفضه. يرجى مراجعة الدعم الفني.`,
        'topup_rejected',
        request.id,
        '/profile'
      );

      showToast('❌ تم رفض الطلب وإشعار المستخدم', 'success');
    } catch (error) {
      console.error(error);
      showToast('فشل رفض الطلب', 'error');
    }
  };

  const getBeneficiaryInfo = (method) => {
    const info = settings[method];
    if (!info) return null;
    if (method === 'usdt') {
      return (
        <>
          <p><strong>🔗 الشبكة:</strong> {info.network || 'TRC20'}</p>
          <p><strong>🏦 عنوان المحفظة:</strong> <code>{info.address || '—'}</code></p>
          {info.qrCode && <img src={info.qrCode} alt="QR" className="beneficiary-qr" />}
        </>
      );
    } else {
      return (
        <>
          <p><strong>👤 اسم المستفيد:</strong> {info.accountName || '—'}</p>
          <p><strong>📞 رقم الحساب/الهاتف:</strong> {info.accountNumber || '—'}</p>
          {info.qrCode && <img src={info.qrCode} alt="QR" className="beneficiary-qr" />}
        </>
      );
    }
  };

  if (loading || settingsLoading) return <div className="admin-topup-loading">جاري تحميل طلبات الشحن...</div>;

  return (
    <div className="finance-topup" dir="rtl">
      <h2>💰 طلبات شحن الرصيد</h2>

      {/* معلومات حسابات المستفيد */}
      <div className="beneficiary-info-section">
        <h3>معلومات حسابات الإيداع</h3>
        <div className="beneficiary-cards">
          {settings?.usdt?.enabled && (
            <div className="beneficiary-card">
              <h4>🇺🇸 USDT (تيثر)</h4>
              {getBeneficiaryInfo('usdt')}
            </div>
          )}
          {settings?.shamCash?.enabled && (
            <div className="beneficiary-card">
              <h4>🏦 شام كاش</h4>
              {getBeneficiaryInfo('shamCash')}
            </div>
          )}
          {settings?.siretelCash?.enabled && (
            <div className="beneficiary-card">
              <h4>📱 سيريتل كاش</h4>
              {getBeneficiaryInfo('siretelCash')}
            </div>
          )}
        </div>
      </div>

      {/* قائمة الطلبات */}
      {requests.length === 0 ? (
        <p className="finance-topup__empty">لا توجد طلبات معلقة</p>
      ) : (
        <div className="finance-topup__list">
          {requests.map(req => (
            <div key={req.id} className="finance-topup__card">
              <div className="request-header">
                <span className="request-id">طلب #{req.id.slice(-6)}</span>
                <span className="request-status pending">قيد المراجعة</span>
              </div>
              <div className="request-details">
                <p><strong>👤 المستخدم:</strong> {req.userName || req.userId}</p>
                <p><strong>💰 المبلغ:</strong> {req.amount} $</p>
                <p><strong>🏦 طريقة الدفع:</strong> {req.paymentMethod}</p>
                <p><strong>📄 رقم العملية:</strong> {req.transactionNumber || '—'}</p>
                <p><strong>✍️ اسم المرسل:</strong> {req.senderName || '—'}</p>
                <p><strong>📅 التاريخ:</strong> {req.createdAt?.toDate().toLocaleString()}</p>
              </div>
              {req.receiptImage && (
                <div className="receipt-preview">
                  <button onClick={() => setImagePreview(req.receiptImage)}>🧾 عرض إيصال الدفع</button>
                </div>
              )}
              <div className="finance-topup__actions">
                <Button onClick={() => handleApprove(req)}>✅ قبول وإضافة الرصيد</Button>
                <Button variant="danger" onClick={() => handleReject(req)}>❌ رفض</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال عرض الصورة */}
   {/* مودال عرض الصورة */}
{imagePreview && (
  <div className="image-preview-overlay" onClick={() => setImagePreview(null)}>
    <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
      <div className="image-preview-header">
        <span className="image-preview-title">🖼️ صورة إيصال الإيداع</span>
        <button className="close-preview" onClick={() => setImagePreview(null)}>✕ إغلاق</button>
      </div>
      <div className="image-preview-body">
        <img src={imagePreview} alt="إيصال الدفع" />
      </div>
    </div>
  </div>
)}

      {/* زر واتساب للدعم */}
      <div className="support-footer">
        <p>📢 لدعم أسرع، يمكنك التواصل مع المدقق المالي عبر واتساب:</p>
        <a href="https://wa.me/963939454690" target="_blank" rel="noopener noreferrer" className="whatsapp-support-btn">
          📱 تواصل مع الدعم
        </a>
      </div>
    </div>
  );
}
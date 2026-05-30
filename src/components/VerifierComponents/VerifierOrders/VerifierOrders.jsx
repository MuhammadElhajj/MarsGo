
import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../GeneralComponents/Button/Button';
import './VerifierOrders.css';

export default function VerifierOrders() {
  const { userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'reject' or 'resubmit'
  const [modalOrderId, setModalOrderId] = useState(null);
  const [modalInputValue, setModalInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState({ id: null, type: null }); // لمعاينة الصور

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), where('status', '==', 'pending_verification'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("❌ خطأ في جلب الطلبات:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAction = async (orderId, newStatus, noteOrReason = '') => {
    setActionLoading(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        status: newStatus,
        verifiedBy: userData?.uid,
        verifiedAt: new Date(),
      };

      if (newStatus === 'rejected') {
        updateData.rejectReason = noteOrReason;
      }
      if (newStatus === 'awaiting_customer_resubmit') {
        updateData.resubmitNote = noteOrReason;
      }

      await updateDoc(orderRef, updateData);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (orderId) => {
    setModalType('reject');
    setModalOrderId(orderId);
    setModalInputValue('');
    setModalOpen(true);
  };

  const openResubmitModal = (orderId) => {
    setModalType('resubmit');
    setModalOrderId(orderId);
    setModalInputValue('');
    setModalOpen(true);
  };

  const handleModalConfirm = () => {
    if (!modalInputValue.trim()) {
      alert('الرجاء إدخال نص');
      return;
    }
    if (modalType === 'reject') {
      handleAction(modalOrderId, 'rejected', modalInputValue);
    } else if (modalType === 'resubmit') {
      handleAction(modalOrderId, 'awaiting_customer_resubmit', modalInputValue);
    }
    setModalOpen(false);
    setModalOrderId(null);
    setModalInputValue('');
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalOrderId(null);
    setModalInputValue('');
  };

  const openImagePreview = (base64, type) => {
    setImagePreview({ id: type, src: base64 });
  };

  const closeImagePreview = () => {
    setImagePreview({ id: null, src: null });
  };

  if (loading) return <p>جاري تحميل الطلبات...</p>;

  return (
    <div className="verifier-orders">
      <h2 className="verifier-orders__title">تدقيق الطلبات</h2>
      {orders.length === 0 ? (
        <p className="verifier-orders__empty">لا توجد طلبات معلقة للتدقيق.</p>
      ) : (
        <div className="verifier-orders__list">
          {orders.map(order => (
            <div key={order.id} className="verifier-orders__card">
              <div className="verifier-orders__card-header">
                <span>طلب #{order.id.slice(-6)}</span>
                <span className="verifier-orders__status">قيد التدقيق</span>
              </div>
              <div className="verifier-orders__details">
                <p><strong>المستلم:</strong> {order.recipientName}</p>
                <p><strong>رقم شام كاش:</strong> {order.shamCashPhone}</p>
                <p><strong>المبلغ:</strong> {order.amount} $</p>
                <p><strong>تاريخ التقديم:</strong> {order.createdAt?.toDate().toLocaleString('ar-SY')}</p>
              </div>

              {/* عرض الصور المخزنة كـ base64 أو روابط قديمة */}
              <div className="verifier-orders__files">
                {/* صورة الهوية */}
                {order.idImage && (
                  <button 
                    className="image-preview-btn"
                    onClick={() => openImagePreview(order.idImage, 'id')}
                  >
                    📄 صورة الهوية (اضغط للمعاينة)
                  </button>
                )}
                {order.idImageUrl && !order.idImage && (
                  <a href={order.idImageUrl} target="_blank" rel="noopener noreferrer">📄 صورة الهوية (رابط قديم)</a>
                )}
                {!order.idImage && !order.idImageUrl && order.idImageRef && (
                  <span>صورة الهوية: {order.idImageRef}</span>
                )}

                {/* إيصال الدفع */}
                {order.receiptImage && (
                  <button 
                    className="image-preview-btn"
                    onClick={() => openImagePreview(order.receiptImage, 'receipt')}
                  >
                    📄 إيصال الدفع (اضغط للمعاينة)
                  </button>
                )}
                {order.receiptImageUrl && !order.receiptImage && (
                  <a href={order.receiptImageUrl} target="_blank" rel="noopener noreferrer">📄 إيصال الدفع (رابط قديم)</a>
                )}
                {!order.receiptImage && !order.receiptImageUrl && order.receiptImageRef && (
                  <span>إيصال الدفع: {order.receiptImageRef}</span>
                )}
              </div>

              <div className="verifier-orders__actions">
                <Button onClick={() => handleAction(order.id, 'verified_pending_execution')} disabled={actionLoading === order.id}>
                  تأكيد
                </Button>
                <Button variant="google" onClick={() => openResubmitModal(order.id)} disabled={actionLoading === order.id}>
                  طلب تعديل
                </Button>
                <Button variant="danger" onClick={() => openRejectModal(order.id)} disabled={actionLoading === order.id}>
                  رفض
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال إدخال سبب الرفض / التعديل */}
      {modalOpen && (
        <div className="verifier-modal-overlay" onClick={handleModalClose}>
          <div className="verifier-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modalType === 'reject' ? 'سبب الرفض' : 'ملاحظة التعديل'}</h3>
            <textarea
              value={modalInputValue}
              onChange={(e) => setModalInputValue(e.target.value)}
              rows="3"
              placeholder={modalType === 'reject' ? 'اكتب سبب الرفض...' : 'اكتب ملاحظة للزبون...'}
              autoFocus
            />
            <div className="verifier-modal-actions">
              <Button onClick={handleModalConfirm} variant="primary">تأكيد</Button>
              <Button onClick={handleModalClose} variant="danger">إلغاء</Button>
            </div>
          </div>
        </div>
      )}

      {/* مودال معاينة الصورة (base64) */}
      {imagePreview.src && (
        <div className="image-preview-overlay" onClick={closeImagePreview}>
          <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
            <img src={imagePreview.src} alt="معاينة" />
            <button className="close-preview" onClick={closeImagePreview}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
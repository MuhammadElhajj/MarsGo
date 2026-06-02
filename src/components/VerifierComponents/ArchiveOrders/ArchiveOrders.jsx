// src/pages/Verifier/ArchiveOrders.jsx
import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import Loading from '../../GeneralComponents/Loading/Loading';
import './ArchiveOrders.css';

const statusLabels = {
  pending_verification: 'قيد التدقيق',
  awaiting_customer_resubmit: 'بانتظار تعديل الزبون',
  verified_pending_execution: 'تم التدقيق - بانتظار التنفيذ',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};

const orderTypes = {
  transfer: 'تحويل شام كاش',
  gaming: 'شحن ألعاب',
  crypto: 'عملات رقمية',
  exchange: 'صرافة',
};

export default function ArchiveOrders() {
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState({ src: null });

  const fetchArchivedOrders = async () => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('status', 'in', ['completed', 'rejected']),
        orderBy('updatedAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error("خطأ في جلب الأرشيف:", err);
      const q2 = query(collection(db, 'orders'), where('status', 'in', ['completed', 'rejected']));
      const snap2 = await getDocs(q2);
      let orders = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
      orders.sort((a, b) => (b.updatedAt?.toDate?.() || 0) - (a.updatedAt?.toDate?.() || 0));
      return orders;
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const archived = await fetchArchivedOrders();
      setArchivedOrders(archived);
      setLoading(false);
    };
    load();
  }, []);

  const openImagePreview = (src) => setImagePreview({ src });
  const closeImagePreview = () => setImagePreview({ src: null });

  if (loading) return <Loading text="جاري تحميل الأرشيف..." />;

  return (
    <div className="archive-orders-page" dir="rtl">
      <h2 className="archive-orders-page__title">📦 أرشيف الطلبات (مكتمل/مرفوض)</h2>
      {archivedOrders.length === 0 ? (
        <p className="archive-orders-page__empty">لا توجد طلبات في الأرشيف.</p>
      ) : (
        <div className="archive-orders-page__list">
          {archivedOrders.map(order => (
            <div key={order.id} className="archive-order-card">
              <div className="archive-order-card__header">
                <span>#{order.id.slice(-6)} - {orderTypes[order.type] || order.type}</span>
                <span className={`status-badge status-${order.status}`}>{statusLabels[order.status]}</span>
              </div>
              <div className="archive-order-card__details">
                <p><strong>العميل:</strong> {order.customerName}</p>
                {order.type === 'transfer' && <p><strong>المستلم:</strong> {order.recipientName}</p>}
                {order.type === 'gaming' && <p><strong>اللعبة:</strong> {order.gameName} - {order.packageName}</p>}
                <p><strong>المبلغ:</strong> {order.finalPrice || order.amount} {order.currency || 'USD'}</p>
                {order.rejectReason && <p><strong>سبب الرفض:</strong> {order.rejectReason}</p>}
                {order.resubmitNote && <p><strong>ملاحظة التعديل:</strong> {order.resubmitNote}</p>}
                <p><strong>تاريخ الإكمال/الرفض:</strong> {order.updatedAt?.toDate().toLocaleString('ar-SY') || '—'}</p>
              </div>
              <div className="archive-order-card__files">
                {(order.idImageUrl || order.idImage) && (
                  <button onClick={() => openImagePreview(order.idImageUrl || order.idImage)}>🆔 صورة الهوية</button>
                )}
                {(order.receiptImageUrl || order.receiptImage) && (
                  <button onClick={() => openImagePreview(order.receiptImageUrl || order.receiptImage)}>🧾 إيصال الدفع</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
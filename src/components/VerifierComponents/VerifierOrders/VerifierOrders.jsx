import { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { useGames } from '../../../context/GamesContext';
import Button from '../../GeneralComponents/Button/Button';
import Loading from '../../GeneralComponents/Loading/Loading';
import './VerifierOrders.css';

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

export default function VerifierOrders() {
  const { userData } = useAuth();
  const { games, loading: gamesLoading } = useGames();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'archive'
  const [pendingOrders, setPendingOrders] = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalOrderId, setModalOrderId] = useState(null);
  const [modalInputValue, setModalInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState({ src: null });

  // فلاتر داخلية
  const [filterType, setFilterType] = useState('all'); // all, transfer, gaming, crypto, exchange
  const [filterGameId, setFilterGameId] = useState('all');

  // جلب الطلبات المعلقة (pending_verification)
  const fetchPendingOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), where('status', '==', 'pending_verification'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error("❌ خطأ في جلب الطلبات المعلقة:", err);
      return [];
    }
  };

  // جلب الطلبات المكتملة/المرفوضة (الأرشيف)
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
      console.error("❌ خطأ في جلب الأرشيف:", err);
      // إذا لم يوجد فهرس، نجلب بدون orderBy
      const q2 = query(collection(db, 'orders'), where('status', 'in', ['completed', 'rejected']));
      const snap2 = await getDocs(q2);
      let orders = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
      orders.sort((a, b) => (b.updatedAt?.toDate?.() || 0) - (a.updatedAt?.toDate?.() || 0));
      return orders;
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    const [pending, archived] = await Promise.all([fetchPendingOrders(), fetchArchivedOrders()]);
    setPendingOrders(pending);
    setArchivedOrders(archived);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // فلترة الطلبات المعلقة حسب النوع واللعبة
  const filteredPending = useMemo(() => {
    let filtered = [...pendingOrders];
    if (filterType !== 'all') {
      filtered = filtered.filter(order => order.type === filterType);
    }
    if (filterType === 'gaming' && filterGameId !== 'all') {
      filtered = filtered.filter(order => order.gameId === filterGameId);
    }
    return filtered;
  }, [pendingOrders, filterType, filterGameId]);

  // الأرشيف جاهز بدون إجراءات (قراءة فقط)
  const handleAction = async (orderId, newStatus, noteOrReason = '') => {
    setActionLoading(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        status: newStatus,
        verifiedBy: userData?.uid,
        verifiedAt: new Date(),
      };
      if (newStatus === 'rejected') updateData.rejectReason = noteOrReason;
      if (newStatus === 'awaiting_customer_resubmit') updateData.resubmitNote = noteOrReason;
      await updateDoc(orderRef, updateData);
      // تحديث القوائم
      await loadAllData();
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
    if (modalType === 'reject') handleAction(modalOrderId, 'rejected', modalInputValue);
    else handleAction(modalOrderId, 'awaiting_customer_resubmit', modalInputValue);
    setModalOpen(false);
  };

  const handleModalClose = () => setModalOpen(false);
  const openImagePreview = (src) => setImagePreview({ src });
  const closeImagePreview = () => setImagePreview({ src: null });

  if (loading || gamesLoading) return <Loading text="جاري تحميل الطلبات..." />;

  return (
    <div className="verifier-orders" dir="rtl">
      <h2 className="verifier-orders__title">لوحة تدقيق الطلبات</h2>

      {/* تبويبات رئيسية */}
      <div className="verifier-tabs">
        <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>
          📋 طلبات معلقة ({pendingOrders.length})
        </button>
        <button className={activeTab === 'archive' ? 'active' : ''} onClick={() => setActiveTab('archive')}>
          📦 أرشيف (مكتمل/مرفوض)
        </button>
      </div>

      {activeTab === 'pending' && (
        <>
          {/* شريط الفلترة */}
          <div className="filter-bar">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">جميع الخدمات</option>
              <option value="transfer">تحويلات شام كاش</option>
              <option value="gaming">شحن ألعاب</option>
              <option value="crypto">عملات رقمية</option>
              <option value="exchange">صرافة</option>
            </select>

            {filterType === 'gaming' && (
              <select value={filterGameId} onChange={e => setFilterGameId(e.target.value)}>
                <option value="all">جميع الألعاب</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
            )}
          </div>

          {filteredPending.length === 0 ? (
            <p className="verifier-orders__empty">لا توجد طلبات معلقة تطابق الفلترة.</p>
          ) : (
            <div className="verifier-orders__list">
              {filteredPending.map(order => (
                <div key={order.id} className="verifier-orders__card">
                  <div className="verifier-orders__card-header">
                    <span>#{order.id.slice(-6)} - {orderTypes[order.type] || order.type}</span>
                    <span className="verifier-orders__status">قيد التدقيق</span>
                  </div>
                  <div className="verifier-orders__details">
                    {order.type === 'transfer' && (
                      <>
                        <p><strong>المستلم:</strong> {order.recipientName}</p>
                        <p><strong>رقم شام كاش:</strong> {order.shamCashPhone}</p>
                        <p><strong>المبلغ:</strong> {order.amount} $</p>
                      </>
                    )}
                    {order.type === 'gaming' && (
                      <>
                        <p><strong>اللعبة:</strong> {order.gameName}</p>
                        <p><strong>الباقة:</strong> {order.packageName}</p>
                        <p><strong>ID اللاعب:</strong> {order.playerId}</p>
                        <p><strong>المبلغ:</strong> {order.finalPrice || order.price} {order.currency || 'USD'}</p>
                      </>
                    )}
                    {order.type === 'crypto' && (
                      <>
                        <p><strong>نوع العملية:</strong> {order.tradeType === 'buy' ? 'شراء' : 'بيع'}</p>
                        <p><strong>الكمية:</strong> {order.amount} USDT</p>
                        <p><strong>السعر:</strong> {order.price}</p>
                      </>
                    )}
                    {order.type === 'exchange' && (
                      <>
                        <p><strong>نوع الصرافة:</strong> {order.exchangeType === 'buy_dollar' ? 'شراء دولار' : 'بيع دولار'}</p>
                        <p><strong>المبلغ:</strong> {order.amount}</p>
                        <p><strong>السعر:</strong> {order.rate}</p>
                      </>
                    )}
                    <p><strong>التاريخ:</strong> {order.createdAt?.toDate().toLocaleString('ar-SY')}</p>
                  </div>

                  {/* الصور */}
                  <div className="verifier-orders__files">
                    {(order.idImageUrl || order.idImage) && (
                      <button onClick={() => openImagePreview(order.idImageUrl || order.idImage)}>🆔 صورة الهوية</button>
                    )}
                    {(order.receiptImageUrl || order.receiptImage) && (
                      <button onClick={() => openImagePreview(order.receiptImageUrl || order.receiptImage)}>🧾 إيصال الدفع</button>
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
        </>
      )}

      {activeTab === 'archive' && (
        <div className="archive-orders">
          {archivedOrders.length === 0 ? (
            <p>لا توجد طلبات في الأرشيف.</p>
          ) : (
            <div className="verifier-orders__list archive-list">
              {archivedOrders.map(order => (
                <div key={order.id} className="verifier-orders__card archive-card">
                  <div className="verifier-orders__card-header">
                    <span>#{order.id.slice(-6)} - {orderTypes[order.type] || order.type}</span>
                    <span className={`status-badge status-${order.status}`}>{statusLabels[order.status]}</span>
                  </div>
                  <div className="verifier-orders__details">
                    <p><strong>العميل:</strong> {order.customerName}</p>
                    {order.type === 'transfer' && <p><strong>المستلم:</strong> {order.recipientName}</p>}
                    {order.type === 'gaming' && <p><strong>اللعبة:</strong> {order.gameName} - {order.packageName}</p>}
                    <p><strong>المبلغ:</strong> {order.finalPrice || order.amount} {order.currency || 'USD'}</p>
                    {order.rejectReason && <p><strong>سبب الرفض:</strong> {order.rejectReason}</p>}
                    {order.resubmitNote && <p><strong>ملاحظة التعديل:</strong> {order.resubmitNote}</p>}
                    <p><strong>تاريخ الإكمال/الرفض:</strong> {order.updatedAt?.toDate().toLocaleString('ar-SY') || '—'}</p>
                  </div>
                  {/* عرض الصور فقط (بدون أزرار إجراء) */}
                  <div className="verifier-orders__files">
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
        </div>
      )}

      {/* مودال إدخال السبب */}
      {modalOpen && (
        <div className="verifier-modal-overlay" onClick={handleModalClose}>
          <div className="verifier-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modalType === 'reject' ? 'سبب الرفض' : 'ملاحظة التعديل'}</h3>
            <textarea rows="3" value={modalInputValue} onChange={e => setModalInputValue(e.target.value)} autoFocus />
            <div className="verifier-modal-actions">
              <Button onClick={handleModalConfirm}>تأكيد</Button>
              <Button variant="danger" onClick={handleModalClose}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}

      {/* مودال معاينة الصورة */}
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
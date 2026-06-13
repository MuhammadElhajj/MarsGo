import { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { useAppStore } from '../../../store/store'; // ✅ استبدال السياقات بـ Zustand
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import Loading from '../../GeneralComponents/Loading/Loading';
import './VerifierOrders.css';

const orderTypes = {
  transfer: 'تحويل شام كاش',
  gaming: 'شحن ألعاب',
  crypto: 'عملات رقمية',
  exchange: 'صرافة',
};

export default function VerifierOrders() {
  const { userData } = useAuth();
  
  // ✅ استخدم الـ store المركزية بدلاً من السياقات
  const games = useAppStore((state) => state.games);
  const setGames = useAppStore((state) => state.setGames);
  const addNotification = useAppStore((state) => state.addNotification);
  const [gamesLoading, setGamesLoading] = useState(!games || games.length === 0);

  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalOrderId, setModalOrderId] = useState(null);
  const [modalInputValue, setModalInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState({ src: null });
  const [filterType, setFilterType] = useState('all');
  const [filterGameId, setFilterGameId] = useState('all');

  const isAdvanced = userData?.verifierType === 'advanced';

  // جلب الألعاب إذا لم تكن موجودة في الـ store
  useEffect(() => {
    const fetchGames = async () => {
      if (games && games.length > 0) {
        setGamesLoading(false);
        return;
      }
      setGamesLoading(true);
      try {
        const q = query(collection(db, 'games'));
        const snapshot = await getDocs(q);
        const gamesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGames(gamesList);
      } catch (err) {
        console.error('خطأ في جلب الألعاب:', err);
      } finally {
        setGamesLoading(false);
      }
    };
    fetchGames();
  }, [games, setGames]);

  // استخدام onSnapshot للاستماع للطلبات المعلقة
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'orders'), where('status', '==', 'pending_verification'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingOrders(orders);
      setLoading(false);
    }, (error) => {
      console.error("خطأ في الاستماع للطلبات:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredPending = useMemo(() => {
    let filtered = [...pendingOrders];
    if (filterType !== 'all') filtered = filtered.filter(order => order.type === filterType);
    if (filterType === 'gaming' && filterGameId !== 'all')
      filtered = filtered.filter(order => order.gameId === filterGameId);
    return filtered;
  }, [pendingOrders, filterType, filterGameId]);

  // تنفيذ الطلب (للمدقق المتقدم)
  const handleExecute = async (orderId, processNumber) => {
    if (!processNumber) {
      alert('الرجاء إدخال رقم العملية');
      return;
    }
    setActionLoading(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      const orderData = orderSnap.data();
      
      await updateDoc(orderRef, {
        status: 'completed',
        processNumber: processNumber,
        completedBy: userData?.uid,
        completedAt: new Date(),
      });

      // ✅ إضافة إشعار للمستخدم باستخدام addNotification من الـ store
      await addNotification({
        userId: orderData.userId,
        title: '🎉 تم تنفيذ طلبك',
        message: `طلب #${orderId.slice(-6)} - ${orderTypes[orderData.type] || orderData.type} تم تنفيذه بنجاح. رقم العملية: ${processNumber}`,
        type: 'order_completed',
        orderId: orderId,
        link: '/my-orders',
        read: false,
        createdAt: new Date(),
      });

      showToast('✅ تم تنفيذ الطلب بنجاح وإرسال إشعار للمستخدم', 'success', 4000);
    } catch (err) {
      console.error(err);
      showToast('❌ فشل تنفيذ الطلب', 'error', 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResubmit = async (orderId, note) => {
    if (!note.trim()) return;
    setActionLoading(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      const orderData = orderSnap.data();

      await updateDoc(orderRef, {
        status: 'awaiting_customer_resubmit',
        resubmitNote: note,
        verifiedBy: userData?.uid,
        verifiedAt: new Date(),
      });

      await addNotification({
        userId: orderData.userId,
        title: '✏️ مطلوب تعديل على طلبك',
        message: `طلب #${orderId.slice(-6)} بحاجة إلى تعديل: ${note}`,
        type: 'order_resubmit',
        orderId: orderId,
        link: '/my-orders',
        read: false,
        createdAt: new Date(),
      });

      showToast('✅ تم إرسال طلب تعديل للمستخدم', 'success', 4000);
    } catch (err) {
      console.error(err);
      showToast('❌ فشل إرسال طلب التعديل', 'error', 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId, reason) => {
    if (!reason.trim()) return;
    setActionLoading(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      const orderData = orderSnap.data();

      await updateDoc(orderRef, {
        status: 'rejected',
        rejectReason: reason,
        verifiedBy: userData?.uid,
        verifiedAt: new Date(),
      });

      await addNotification({
        userId: orderData.userId,
        title: '❌ تم رفض طلبك',
        message: `طلب #${orderId.slice(-6)} - ${orderTypes[orderData.type] || orderData.type} تم رفضه. السبب: ${reason}`,
        type: 'order_rejected',
        orderId: orderId,
        link: '/my-orders',
        read: false,
        createdAt: new Date(),
      });

      showToast('✅ تم رفض الطلب وإرسال إشعار للمستخدم', 'success', 4000);
    } catch (err) {
      console.error(err);
      showToast('❌ فشل رفض الطلب', 'error', 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const openExecuteModal = (id) => {
    setModalType('execute');
    setModalOrderId(id);
    setModalInputValue('');
    setModalOpen(true);
  };

  const openResubmitModal = (id) => {
    setModalType('resubmit');
    setModalOrderId(id);
    setModalInputValue('');
    setModalOpen(true);
  };

  const openRejectModal = (id) => {
    setModalType('reject');
    setModalOrderId(id);
    setModalInputValue('');
    setModalOpen(true);
  };

  const handleModalConfirm = () => {
    if (modalType !== 'execute' && !modalInputValue.trim()) {
      alert('الرجاء إدخال نص');
      return;
    }
    if (modalType === 'execute') {
      handleExecute(modalOrderId, modalInputValue);
    } else if (modalType === 'resubmit') {
      handleResubmit(modalOrderId, modalInputValue);
    } else if (modalType === 'reject') {
      handleReject(modalOrderId, modalInputValue);
    }
    setModalOpen(false);
  };

  const openImagePreview = (src) => setImagePreview({ src });
  const closeImagePreview = () => setImagePreview({ src: null });

  if (loading || gamesLoading) return <Loading text="جاري تحميل الطلبات..." />;

  return (
    <div className="verifier-orders" dir="rtl">
      <h2 className="verifier-orders__title">لوحة تدقيق الطلبات</h2>

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
        <p className="verifier-orders__empty">لا توجد طلبات معلقة.</p>
      ) : (
        <div className="verifier-orders__list">
          {filteredPending.map(order => (
            <div key={order.id} className="verifier-orders__card">
              <div className="verifier-orders__card-header">
                <span>#{order.id.slice(-6)} - {orderTypes[order.type] || order.type}</span>
                <span className="verifier-orders__status">قيد التدقيق</span>
              </div>
              <div className="verifier-orders__details">
                <p><strong>العميل:</strong> {order.customerName || '—'} ({order.userId?.slice(-6)})</p>
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

              <div className="verifier-orders__files">
                {(order.idImageUrl || order.idImage) && (
                  <button onClick={() => openImagePreview(order.idImageUrl || order.idImage)}>🆔 صورة الهوية</button>
                )}
                {(order.receiptImageUrl || order.receiptImage) && (
                  <button onClick={() => openImagePreview(order.receiptImageUrl || order.receiptImage)}>🧾 إيصال الدفع</button>
                )}
              </div>

              <div className="verifier-orders__actions">
                {isAdvanced ? (
                  <>
                    <Button onClick={() => openExecuteModal(order.id)} disabled={actionLoading === order.id}>
                      تنفيذ الطلب
                    </Button>
                    <Button variant="google" onClick={() => openResubmitModal(order.id)} disabled={actionLoading === order.id}>
                      طلب تعديل
                    </Button>
                    <Button variant="danger" onClick={() => openRejectModal(order.id)} disabled={actionLoading === order.id}>
                      رفض
                    </Button>
                  </>
                ) : (
                  <p className="verifier-orders__readonly">
                    📍 ليس لديك صلاحيات لإجراء تعديلات على الطلبات. أنت في وضع المشاهدة فقط.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال الإدخال */}
      {modalOpen && (
        <div className="verifier-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="verifier-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modalType === 'reject' && 'سبب الرفض'}
              {modalType === 'resubmit' && 'ملاحظة التعديل'}
              {modalType === 'execute' && 'رقم العملية'}
            </h3>
            {modalType === 'execute' ? (
              <Input
                placeholder="رقم العملية"
                value={modalInputValue}
                onChange={e => setModalInputValue(e.target.value)}
                autoFocus
              />
            ) : (
              <textarea rows="3" value={modalInputValue} onChange={e => setModalInputValue(e.target.value)} autoFocus />
            )}
            <div className="verifier-modal-actions">
              <Button onClick={handleModalConfirm}>تأكيد</Button>
              <Button variant="danger" onClick={() => setModalOpen(false)}>إلغاء</Button>
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
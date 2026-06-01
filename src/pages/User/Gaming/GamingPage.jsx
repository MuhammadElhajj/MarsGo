import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import PaymentButton from '../../../components/GeneralComponents/PaymentButton/PaymentButton';
import { useGames } from '../../../context/GamesContext';
import './GamingPage.css';

// مكون عرض اللعبة
function GameCard({ game, onSelect, isSelected }) {
  const { name, imageBase64, note, isAvailable, unavailableReason } = game;
  const statusText = isAvailable ? 'متاحة' : 'غير متاحة';
  const statusClass = isAvailable ? 'available' : 'unavailable';

  return (
    <div className={`game-card ${isSelected ? 'selected' : ''} ${statusClass}`} onClick={() => isAvailable && onSelect(game)}>
      <div className="game-card__image">
        {imageBase64 ? <img src={imageBase64} alt={name} /> : <div className="game-card__placeholder">🎮</div>}
      </div>
      <div className="game-card__info">
        <h3 className="game-card__title">{name}</h3>
        {note && <p className="game-card__note">{note}</p>}
        {!isAvailable && unavailableReason && <p className="game-card__unavailable-reason">⚠️ {unavailableReason}</p>}
        <span className={`game-card__status status-${statusClass}`}>{statusText}</span>
      </div>
    </div>
  );
}

// مكون عرض الباقة
function PackageCard({ pkg, onSelect }) {
  const { name, price, currency, discount, type } = pkg;
  const finalPrice = discount ? (price * (1 - discount / 100)).toFixed(2) : price;
  const discountText = discount ? `(خصم ${discount}%)` : '';

  return (
    <div className="package-card" onClick={() => onSelect(pkg)}>
      <div className="package-card__info">
        <h4 className="package-card__title">{name}</h4>
        {type === 'royalPass' && <span className="package-card__badge">رويال باس</span>}
        {type === 'direct' && <span className="package-card__badge">مباشر</span>}
      </div>
      <div className="package-card__price">
        <span className="package-card__amount">{finalPrice} {currency === 'USD' ? '$' : 'ل.س'}</span>
        {discount && <span className="package-card__old-price">{price} {currency === 'USD' ? '$' : 'ل.س'}</span>}
        {discountText && <span className="package-card__discount">{discountText}</span>}
      </div>
    </div>
  );
}

export default function GamingPage() {
  const { userData } = useAuth();
  const { games, loading: gamesLoading, fetchPackages } = useGames();

  const [selectedGame, setSelectedGame] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [receiptImageBase64, setReceiptImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusModal, setStatusModal] = useState({ show: false, type: '', message: '' });

  // جلب الباقات عند اختيار لعبة باستخدام السياق
  useEffect(() => {
    if (!selectedGame) {
      setPackages([]);
      setSelectedPackage(null);
      return;
    }
    const loadPackages = async () => {
      setPackages([]);
      setSelectedPackage(null);
      const pkgList = await fetchPackages(selectedGame.id);
      setPackages(pkgList);
    };
    loadPackages();
  }, [selectedGame, fetchPackages]);

  // جلب طلبات المستخدم السابقة
  const fetchOrders = async () => {
    if (!userData?.uid) return;
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userData.uid),
        where('type', '==', 'gaming'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userData]);

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setSelectedPackage(null);
    setError('');
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatusModal({ show: false, type: '', message: '' });

    if (!selectedGame || !selectedPackage || !playerId) {
      setError('يرجى اختيار اللعبة والباقة وإدخال ID اللاعب');
      return;
    }
    if (!receiptImageBase64) {
      setError('يرجى رفع إيصال الدفع');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: userData.uid,
        customerName: userData.name || '',
        type: 'gaming',
        gameId: selectedGame.id,
        gameName: selectedGame.name,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        finalPrice: selectedPackage.discount ? (selectedPackage.price * (1 - selectedPackage.discount / 100)).toFixed(2) : selectedPackage.price,
        currency: selectedPackage.currency || 'USD',
        discount: selectedPackage.discount || 0,
        playerId,
        receiptImage: receiptImageBase64,
        status: 'pending_verification',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'orders'), orderData);
      setStatusModal({ show: true, type: 'success', message: 'تم تقديم طلب الشحن بنجاح! سيتم مراجعته قريباً.' });
      // إعادة تعيين النموذج
      setSelectedPackage(null);
      setPlayerId('');
      setReceiptImageBase64('');
      fetchOrders();
    } catch (err) {
      console.error(err);
      setStatusModal({ show: true, type: 'error', message: 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setStatusModal({ show: false, type: '', message: '' });

  if (gamesLoading) return <Loading text="جاري تحميل الألعاب..." />;

  return (
    <div className="gaming-page" dir="rtl">
      <h2 className="gaming-page__title">شحن الألعاب</h2>

      {/* قائمة الألعاب */}
      <div className="games-grid">
        {games.map(game => (
          <GameCard
            key={game.id}
            game={game}
            onSelect={handleSelectGame}
            isSelected={selectedGame?.id === game.id}
          />
        ))}
      </div>

      {/* الباقات المختارة */}
      {selectedGame && (
        <div className="packages-section">
          <h3>باقات لعبة {selectedGame.name}</h3>
          <div className="packages-grid">
            {packages.length === 0 ? (
              <p>لا توجد باقات متاحة حالياً لهذه اللعبة</p>
            ) : (
              packages.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onSelect={handleSelectPackage}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* نموذج الطلب (يظهر بعد اختيار باقة) */}
      {selectedPackage && (
        <div className="order-form">
          <h3>تقديم طلب شحن</h3>
          <form onSubmit={handleSubmit}>
            <Input
              label="ID اللاعب"
              id="playerId"
              value={playerId}
              onChange={e => setPlayerId(e.target.value)}
              required
            />
            <div className="price-summary">
              <span>المبلغ المطلوب:</span>
              <strong>
                {selectedPackage.discount 
                  ? (selectedPackage.price * (1 - selectedPackage.discount / 100)).toFixed(2)
                  : selectedPackage.price} {selectedPackage.currency === 'USD' ? '$' : 'ل.س'}
                {selectedPackage.discount && <small> (بعد خصم {selectedPackage.discount}%)</small>}
              </strong>
            </div>
            <ImageUpload
              label="إيصال الدفع"
              onUploadComplete={setReceiptImageBase64}
              maxSizeMB={0.5}
              disabled={loading}
            />
            <PaymentButton text="ادفع عبر QR" variant="secondary" />
            <Button type="submit" disabled={loading || !receiptImageBase64}>
              {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </Button>
          </form>
        </div>
      )}

      {/* طلبات المستخدم السابقة */}
      <div className="gaming-page__orders">
        <h3>طلبات الشحن السابقة</h3>
        {ordersLoading ? <Loading /> : orders.length === 0 ? (
          <p>لا توجد طلبات شحن بعد</p>
        ) : (
          <table className="gaming-page__table">
            <thead>
              <tr>
                <th>اللعبة</th>
                <th>الباقة</th>
                <th>المبلغ</th>
                <th>ID اللاعب</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.gameName}</td>
                  <td>{order.packageName}</td>
                  <td>{order.finalPrice || order.price} {order.currency === 'USD' ? '$' : 'ل.س'}</td>
                  <td>{order.playerId}</td>
                  <td><span className={`status-badge status--${order.status}`}>{order.status}</span></td>
                  <td>{order.createdAt?.toDate().toLocaleDateString('ar-SY') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* مودال النتيجة */}
      {statusModal.show && (
        <div className="status-modal-overlay" onClick={closeModal}>
          <div className={`status-modal status-modal--${statusModal.type}`} onClick={e => e.stopPropagation()}>
            <div className="status-modal__icon">
              {statusModal.type === 'success' ? '✅' : '❌'}
            </div>
            <h3>{statusModal.type === 'success' ? 'تم بنجاح!' : 'فشل العملية'}</h3>
            <p>{statusModal.message}</p>
            <Button onClick={closeModal}>حسناً</Button>
          </div>
        </div>
      )}
    </div>
  );
}
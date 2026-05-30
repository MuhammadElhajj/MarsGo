import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import './GamingPage.css';
import PaymentButton from '../../../components/GeneralComponents/PaymentButton/PaymentButton';


const games = {
  pubg: 'ببجي (PUBG)',
  freefire: 'فري فاير',
  mlbb: 'موبايل ليجند',
};

const categories = {
  pubg: ['60 شدة', '120 شدة', '300 شدة', '600 شدة', '1500 شدة', '3000 شدة'],
  freefire: ['100 ماسة', '200 ماسة', '500 ماسة', '1000 ماسة'],
  mlbb: ['86 ماسة', '172 ماسة', '344 ماسة', '429 ماسة', '706 ماسة', '1000 ماسة'],
};

export default function GamingPage() {
  const { userData } = useAuth();
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [receiptImageBase64, setReceiptImageBase64] = useState(''); // ✅ تغيير من null إلى string فارغ
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

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
      const snap = await getDocs(q);
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedGame || !selectedCategory || !playerId) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    if (!receiptImageBase64) { // ✅ التحقق من وجود base64
      setError('يرجى رفع إيصال الدفع');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: userData.uid,
        customerName: userData.name || '',
        type: 'gaming',
        game: selectedGame,
        gameName: games[selectedGame],
        category: selectedCategory,
        playerId,
        receiptImage: receiptImageBase64, // ✅ تخزين base64 بدلاً من اسم الملف
        status: 'pending_verification',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setSelectedGame('');
      setSelectedCategory('');
      setPlayerId('');
      setReceiptImageBase64(''); // ✅ إعادة تعيين base64
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError('فشل إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gaming-page" dir="rtl">
      <h2 className="gaming-page__title">شحن الألعاب</h2>

      <div className="gaming-page__form">
        {success && <div className="gaming-page__success">تم تقديم طلب الشحن بنجاح!</div>}
        {error && <div className="gaming-page__error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="gaming-page__field">
            <label>اللعبة</label>
            <select value={selectedGame} onChange={e => { setSelectedGame(e.target.value); setSelectedCategory(''); }}>
              <option value="">اختر اللعبة</option>
              {Object.entries(games).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
          {selectedGame && (
            <div className="gaming-page__field">
              <label>الفئة</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                <option value="">اختر الفئة</option>
                {categories[selectedGame].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
          <Input
            label="ID اللاعب"
            id="playerId"
            value={playerId}
            onChange={e => setPlayerId(e.target.value)}
            required
          />

          {/* ✅ استخدام onUploadComplete بدلاً من onFileReady */}
          <ImageUpload
            label="إيصال الدفع"
            onUploadComplete={(base64) => setReceiptImageBase64(base64)}
            maxSizeMB={0.5}
            disabled={loading}
          />

<PaymentButton text="ادفع عبر QR" variant="secondary" />

          <Button type="submit" disabled={loading || !receiptImageBase64}>
            {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </Button>
        </form>
      </div>

      <div className="gaming-page__orders">
        <h3>طلبات الشحن السابقة</h3>
        {ordersLoading ? <Loading /> : orders.length === 0 ? (
          <p>لا توجد طلبات شحن بعد</p>
        ) : (
          <table className="gaming-page__table">
            <thead>
              <tr>
                <th>اللعبة</th>
                <th>الفئة</th>
                <th>ID اللاعب</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.gameName}</td>
                  <td>{order.category}</td>
                  <td>{order.playerId}</td>
                  <td><span className={`status-badge status--${order.status}`}>{order.status}</span></td>
                  <td>{order.createdAt?.toDate().toLocaleDateString('ar-SY') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
// src/components/UserComponents/Gaming/PackagesList/PackagesList.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../../store/store';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import CatalogList from '../../../Generic/CatalogList/CatalogList';
import GoBackButton from '../../../GeneralComponents/GoBackButton/GoBackButton'; // ✅ إضافة زر الرجوع
import { FiStar } from 'react-icons/fi';
import './PackagesList.css';

export default function PackagesList() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const games = useAppStore((state) => state.games);
  const [game, setGame] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!gameId) return;
      // البحث عن اللعبة في الـ store
      const foundGame = games?.find(g => g.id === gameId);
      setGame(foundGame || null);

      // جلب الباقات من Firestore
      try {
        const q = query(collection(db, 'games', gameId, 'packages'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const pkgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPackages(pkgs);
      } catch (err) {
        console.error('خطأ في جلب الباقات:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [gameId, games]);

  const handlePackageSelect = (pkg) => {
    navigate('/gaming/checkout', { state: { item: game, package: pkg, serviceType: 'gaming' } });
  };

  if (loading) return <div>جاري تحميل الباقات...</div>;
  if (!game) return <div>اللعبة غير موجودة</div>;

  return (
    <div className="packages-page" dir="rtl">
      
      {/* ✅ زر الرجوع في الأعلى */}
      <div className="packages-page__back-button">
        <GoBackButton text="رجوع" />
      </div>

      {/* ===== رأس الصفحة (معلومات اللعبة) ===== */}
      <div className="packages-page__header">
        <div className="packages-page__game-info">
          <div className="packages-page__game-image">
            <img src={game.imageUrl} alt={game.name} />
          </div>
          <div className="packages-page__game-details">
            <h1 className="packages-page__game-title">{game.name}</h1>
            
            {/* التقييم والمبيعات */}
            <div className="packages-page__game-stats">
              <span className="packages-page__rating">
                <FiStar /> {game.rating || '5.0'}
              </span>
              <span className="packages-page__separator">|</span>
              <span className="packages-page__sold">{game.sold || '100k+ Sold'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ وصف اللعبة – يظهر تحت الهيدر مباشرة */}
      {game.description && (
        <div className="packages-page__game-description-below">
          {game.description}
        </div>
      )}

      {/* ===== شبكة الباقات ===== */}
      <div className="packages-page__grid">
        <CatalogList
          items={packages}
          onItemClick={handlePackageSelect}
          showPrice={true}
          type="package"
          showBackButton={false}
          title=""
        />
      </div>
    </div>
  );
}
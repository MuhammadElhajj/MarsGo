// src/components/UserComponents/Gaming/PackagesList/PackagesList.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../../store/store';
import { useAuth } from '../../../../context/AuthContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { addRecentlyViewed } from '../../../../services/recentlyViewedService';
import CatalogList from '../../../Generic/CatalogList/CatalogList';
import GoBackButton from '../../../GeneralComponents/GoBackButton/GoBackButton';
import { FiStar } from 'react-icons/fi';
import './PackagesList.css';

export default function PackagesList() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const games = useAppStore((state) => state.games);
  const fetchGameContent = useAppStore((state) => state.fetchGameContent);
  const { userData } = useAuth();

  const [game, setGame] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!gameId) return;

      const foundGame = games?.find(g => g.id === gameId);
      setGame(foundGame || null);

      // ✅ تسجيل الزيارة في "آخر ما شاهدت"
      if (foundGame && userData?.email) {
        addRecentlyViewed(userData.email, {
          id: foundGame.id,
          name: foundGame.name,
          imageUrl: foundGame.imageUrl || '',
          type: 'game',
          link: `/gaming/game/${foundGame.id}`,
        });
      }

      const extraContent = await fetchGameContent(gameId);
      console.log('📦 المحتوى المستلم من Firestore:', extraContent);

      // ✅ التوزيع الصحيح: النص القصير فوق، النص الطويل تحت
      const normalizedContent = {
        shortDescription: extraContent?.shortDescription || extraContent?.description || '',
        shortImages: extraContent?.shortImages || [],
        longDescription: extraContent?.longDescription || '',
        longImages: extraContent?.longImages || extraContent?.images || [],
        tips: extraContent?.tips || [],
        videoUrl: extraContent?.videoUrl || '',
      };
      setContent(normalizedContent);

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
  }, [gameId, games, fetchGameContent, userData?.email]);

  const handlePackageSelect = (pkg) => {
    navigate('/gaming/checkout', { state: { item: game, package: pkg, serviceType: 'gaming' } });
  };

  if (loading) return <div className="packages-loading">جاري تحميل الباقات...</div>;
  if (!game) return <div className="packages-error">اللعبة غير موجودة</div>;

  const hasTopContent = content?.shortDescription?.trim() !== '';
  const hasTopImages = content?.shortImages?.length > 0;
  const hasBottomContent = content?.longDescription?.trim() !== '' || 
                           content?.longImages?.length > 0 || 
                           content?.tips?.length > 0 || 
                           content?.videoUrl;

  return (
    <div className="packages-page" dir="rtl">
      {/* زر الرجوع */}
      <div className="packages-page__back-button">
        <GoBackButton text="رجوع" />
      </div>

      {/* رأس الصفحة */}
      <div className="packages-page__header">
        <div className="packages-page__game-info">
          <div className="packages-page__game-image">
            <img src={game.imageUrl} alt={game.name} />
          </div>
          <div className="packages-page__game-details">
            <h1 className="packages-page__game-title">{game.name}</h1>
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

      {/* ===== المحتوى العلوي (وصف مختصر + صور) ===== */}
      {(hasTopContent || hasTopImages) && (
        <div className="packages-page__top-content">
          {hasTopContent && (
            <div className="packages-page__short-description">
              {content.shortDescription}
            </div>
          )}
          {hasTopImages && (
            <div className="packages-page__short-images">
              {content.shortImages.map((img, idx) => (
                <img key={idx} src={img} alt={`صورة ${idx + 1}`} className="packages-page__short-image" />
              ))}
            </div>
          )}
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

      {/* ===== المحتوى السفلي (وصف طويل + صور + نصائح + فيديو) ===== */}
      {hasBottomContent && (
        <div className="packages-page__bottom-content">
          {content.longDescription && (
            <div className="packages-page__long-description">
              {content.longDescription}
            </div>
          )}
          {content.longImages && content.longImages.length > 0 && (
            <div className="packages-page__long-images">
              {content.longImages.map((img, idx) => (
                <img key={idx} src={img} alt={`صورة ${idx + 1}`} className="packages-page__long-image" />
              ))}
            </div>
          )}
          {content.tips && content.tips.length > 0 && (
            <div className="packages-page__tips">
              <h4>💡 نصائح وإرشادات</h4>
              <ul>
                {content.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          {content.videoUrl && (
            <div className="packages-page__video">
              <iframe
                width="100%"
                height="315"
                src={content.videoUrl.replace('watch?v=', 'embed/')}
                title="فيديو توضيحي"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
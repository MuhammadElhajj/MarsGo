// src/components/UserComponents/App/AppPackages/AppPackages.jsx
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
import './AppPackages.css';

export default function AppPackages() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const apps = useAppStore((state) => state.apps);
  const { userData } = useAuth();

  const [app, setApp] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!appId) return;

      const foundApp = apps?.find(a => a.id === appId);
      setApp(foundApp || null);

      // ✅ تسجيل الزيارة في "آخر ما شاهدت"
      if (foundApp && userData?.email) {
        addRecentlyViewed(userData.email, {
          id: foundApp.id,
          name: foundApp.name,
          imageUrl: foundApp.imageUrl || '',
          type: 'app',
          link: `/apps/app/${foundApp.id}`,
        });
      }

      try {
        const q = query(collection(db, 'apps', appId, 'packages'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const pkgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPackages(pkgs);
      } catch (err) {
        console.error('خطأ في جلب باقات التطبيق:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appId, apps, userData?.email]);

  const handlePackageSelect = (pkg) => {
    navigate('/apps/checkout', { state: { item: app, package: pkg, serviceType: 'apps' } });
  };

  if (loading) return <div className="app-packages-loading">جاري تحميل الباقات...</div>;
  if (!app) return <div className="app-packages-error">التطبيق غير موجود</div>;

  return (
    <div className="app-packages-page" dir="rtl">
      {/* زر الرجوع */}
      <div className="app-packages-page__back-button">
        <GoBackButton text="رجوع" />
      </div>

      {/* ===== رأس الصفحة (معلومات التطبيق) ===== */}
      <div className="app-packages-page__header">
        <div className="app-packages-page__app-info">
          <div className="app-packages-page__app-image">
            <img src={app.imageUrl} alt={app.name} />
          </div>
          <div className="app-packages-page__app-details">
            <h1 className="app-packages-page__app-title">{app.name}</h1>
            <div className="app-packages-page__app-stats">
              <span className="app-packages-page__rating">
                <FiStar /> {app.rating || '5.0'}
              </span>
              <span className="app-packages-page__separator">|</span>
              <span className="app-packages-page__sold">{app.sold || '100k+ Downloads'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* وصف التطبيق (إذا وجد) */}
      {app.description && (
        <div className="app-packages-page__app-description-below">
          {app.description}
        </div>
      )}

      {/* شبكة الباقات */}
      <div className="app-packages-page__grid">
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
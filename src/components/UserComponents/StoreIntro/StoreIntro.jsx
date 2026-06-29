// src/components/GeneralComponents/StoreIntro/StoreIntro.jsx
import { useAuth } from '../../../context/AuthContext';
import { useAppStore } from '../../../store/store';
import './StoreIntro.css';

export default function StoreIntro() {
  const { userData } = useAuth();
  const storeSettings = useAppStore((state) => state.storeSettings);

  const backgroundImage = storeSettings?.backgroundImageUrl || storeSettings?.backgroundImageBase64;
  const bgStyle = backgroundImage
    ? { backgroundColor: 'var(--color-accent)' }
    : { backgroundColor: 'var(--color-accent)' };

  return (
    <div className="store-intro" style={bgStyle} dir="rtl">
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt="خلفية مارسغو"
          className="store-intro__bg-image"
          loading="lazy"
          decoding="async"
          width="1200"
          height="400"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      )}
      <div className="store-intro__overlay"></div>
      <div className="store-intro__content">
        <h2 className="store-intro__title">مرحباً بك {userData?.name || 'مستخدم'} في MarsGo</h2>
        <p className="store-intro__description">
          مارسغو منصتك الرقمية الأولى للخدمات المالية في سوريا. تحويل أموال، شحن ألعاب، بطاقات رقمية،
          وتداول العملات الرقمية بأمان وسرعة عبر نظام شام كاش.
        </p>
      </div>
    </div>
  );
}
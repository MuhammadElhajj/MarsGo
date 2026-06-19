// src/pages/User/BuyMGC/BuyMGC.jsx
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/GeneralComponents/Button/Button';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import VisaCard from '../../../components/GeneralComponents/VisaCard/VisaCard';
import { FiDollarSign, FiZap, FiShoppingBag, FiTag, FiCreditCard } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './BuyMGC.css';

const PACKAGES = [
  { mgc: 100, price: 1.00, discount: 0 },
  { mgc: 200, price: 1.90, discount: 5 },
  { mgc: 500, price: 4.75, discount: 5 },
  { mgc: 1000, price: 9.50, discount: 5 },
  { mgc: 2000, price: 19.00, discount: 5 },
  { mgc: 3000, price: 28.50, discount: 5 },
];

export default function BuyMGC() {
  const user = useAppStore((state) => state.user);
  const userData = useAppStore((state) => state.userData);
  const balance = useAppStore((state) => state.balance);
  const mgcBalance = useAppStore((state) => state.mgcBalance);

  const deductBalance = useAppStore((state) => state.deductBalance);
  const addMgcBalance = useAppStore((state) => state.addMgcBalance);

  const { updateUserData } = useAuth();

  const [loading, setLoading] = useState(false);

  const handleBuy = async (mgc, price) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    if (balance < price) {
      toast.error(`⚠️ رصيدك الحقيقي غير كافٍ! تحتاج ${price.toFixed(2)} $، رصيدك: ${balance.toFixed(2)} $`);
      return;
    }

    setLoading(true);
    try {
      const deducted = await deductBalance(price);
      if (!deducted) {
        toast.error('❌ فشل خصم الرصيد الحقيقي');
        setLoading(false);
        return;
      }

      await addMgcBalance(user.uid, mgc);

      // تسجيل عملية الشراء
      try {
        await addDoc(collection(db, 'mgcPurchases'), {
          userId: user.uid,
          mgcAmount: mgc,
          priceUSD: price,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('فشل تسجيل عملية شراء MGC:', err);
      }

      // إضافة XP
      const xpEarned = Math.floor(price * 5);
      if (xpEarned > 0) {
        const currentXP = userData?.xp || 0;
        const newXP = currentXP + xpEarned;
        const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
        const LEVEL_TITLES = {
          1: 'مبتدئ', 2: 'مستكشف', 3: 'مغامر', 4: 'الشاطر',
          5: 'بطل', 6: 'أسطورة', 7: 'محارب', 8: 'الحاج',
          9: 'سيد', 10: 'ملكي',
        };
        const newTitle = LEVEL_TITLES[newLevel] || LEVEL_TITLES[1];
        await updateUserData({
          xp: newXP,
          level: newLevel,
          title: newTitle,
        });
        toast.success(`⭐ ربحت ${xpEarned} XP! المستوى ${newLevel} (${newTitle})`);
      }

      toast.success(`✅ تم شراء ${mgc} MGC بنجاح!`);
    } catch (error) {
      console.error('❌ خطأ في الشراء:', error);
      toast.error(`❌ فشلت عملية الشراء: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="buy-mgc" dir="rtl">
     <div className="buy-mgc__header">
  <GoBackButton text="رجوع" />
  <h1>
    <FiDollarSign className="header-icon" style={{ color: '#f59e0b' }} />
    شراء عملات MGC
  </h1>
</div>

   <VisaCard 
  balance={balance} 
  mgcBalance={mgcBalance}
  cardHolderName={userData?.name || 'MarsGo User'}
  cardNumber={userData?.visaNumber || '8888 8888 8888 8888'}  // ✅ رقم فريد
  brand="MarsGo Visa"
  secret={userData?.visaSecret}  // ✅ الرقم السري
/>

      <p className="buy-mgc__subtitle">
        <FiShoppingBag style={{ color: '#8b5cf6', marginLeft: '0.3rem' }} />
        1 MGC = 1 سنت
        <span style={{ margin: '0 0.5rem' }}>•</span>
        <FiTag style={{ color: '#f59e0b', marginLeft: '0.3rem' }} />
        خصم 5% على الباقات من 200 عملة فأكثر
      </p>

      <div className="buy-mgc__packages">
        {PACKAGES.map((pkg) => (
          <div key={pkg.mgc} className="buy-mgc__card">
            <div className="buy-mgc__mgc">
              <FiZap className="mgc-icon" style={{ color: '#8b5cf6' }} />
              <span>{pkg.mgc}</span>
            </div>
            <div className="buy-mgc__price">
              <span className="price-amount">${pkg.price.toFixed(2)}</span>
              {pkg.discount > 0 && (
                <span className="price-discount">
                  <FiTag style={{ marginLeft: '0.2rem', fontSize: '0.7rem' }} />
                  -{pkg.discount}%
                </span>
              )}
            </div>
            <div className="buy-mgc__per-mgc">
              ≈ {(pkg.price / pkg.mgc * 100).toFixed(2)} سنت / MGC
            </div>
            <Button
              onClick={() => handleBuy(pkg.mgc, pkg.price)}
              disabled={loading}
              className="buy-mgc__btn"
            >
              {loading ? '⏳ جاري...' : (
                <>
                  <FiCreditCard style={{ marginLeft: '0.3rem' }} />
                  شراء
                </>
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="buy-mgc__note">
        <FiDollarSign style={{ color: '#10b981', fontSize: '1.2rem' }} />
        <p>سيتم خصم المبلغ من رصيدك الحقيقي المتاح.</p>
      </div>
    </div>
  );
}
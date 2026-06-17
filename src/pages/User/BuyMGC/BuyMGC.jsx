// src/pages/User/BuyMGC/BuyMGC.jsx
import { useState } from 'react';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext'; // ✅ استيراد useAuth
import Button from '../../../components/GeneralComponents/Button/Button';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import VisaCard from '../../../components/GeneralComponents/VisaCard/VisaCard';
import { FiDollarSign, FiZap } from 'react-icons/fi';
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
  // ✅ الرصيد الحقيقي (المودع)
  const user = useAppStore((state) => state.user);
  const userData = useAppStore((state) => state.userData);
  const balance = useAppStore((state) => state.balance); // الرصيد الحقيقي بالدولار
  
  // ✅ دوال الخصم والإضافة من الـ store
  const deductBalance = useAppStore((state) => state.deductBalance);   // يخصم من الرصيد الحقيقي
  const addMgcBalance = useAppStore((state) => state.addMgcBalance);   // يضيف MGC
  const addBalance = useAppStore((state) => state.addBalance);          // يضيف رصيد حقيقي (للتجربة)

  // ✅ استدعاء updateUserData من AuthContext
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
      // 1. خصم المبلغ من الرصيد الحقيقي
      const deducted = await deductBalance(price);
      if (!deducted) {
        toast.error('❌ فشل خصم الرصيد الحقيقي');
        setLoading(false);
        return;
      }

      // 2. إضافة عملات MGC
      await addMgcBalance(user.uid, mgc);

      // 3. إضافة نقاط خبرة (XP) مقابل الشراء (5 XP لكل دولار)
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

  // دالة لإضافة رصيد حقيقي تجريبي (للمطورين فقط)
  const handleAddTestBalance = async () => {
    if (!user) return;
    await addBalance(user.uid, 10);
    toast.success('تم إضافة 10 $ تجريبية');
  };

  return (
    <div className="buy-mgc" dir="rtl">
      <div className="buy-mgc__header">
        <GoBackButton text="رجوع" />
        <h1>💰 شراء عملات MGC</h1>
      </div>

      <VisaCard
        balance={balance}
        cardHolderName={userData?.name || 'MarsGo User'}
        cardNumber="4532 1234 5678 9012"
        brand="MarsGo"
        expiryDate="**/**"
      />

      {process.env.NODE_ENV === 'development' && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
          <Button onClick={handleAddTestBalance} variant="secondary" size="sm">
            إضافة 10 $ تجريبي
          </Button>
        </div>
      )}

      <p className="buy-mgc__subtitle">
        1 MGC = 1 سنت &bull; خصم 5% على الباقات من 200 عملة فأكثر
      </p>

      <div className="buy-mgc__packages">
        {PACKAGES.map((pkg) => (
          <div key={pkg.mgc} className="buy-mgc__card">
            <div className="buy-mgc__mgc">
              <FiZap className="mgc-icon" />
              <span>{pkg.mgc}</span>
            </div>
            <div className="buy-mgc__price">
              <span className="price-amount">${pkg.price.toFixed(2)}</span>
              {pkg.discount > 0 && (
                <span className="price-discount">-{pkg.discount}%</span>
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
              {loading ? 'جاري...' : 'شراء'}
            </Button>
          </div>
        ))}
      </div>

      <div className="buy-mgc__note">
        <FiDollarSign />
        <p>سيتم خصم المبلغ من رصيدك الحقيقي المتاح.</p>
      </div>
    </div>
  );
}
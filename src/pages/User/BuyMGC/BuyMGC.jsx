// src/pages/User/BuyMGC/BuyMGC.jsx
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/GeneralComponents/Button/Button';
import VisaCard from '../../../components/GeneralComponents/VisaCard/VisaCard';
import { FiDollarSign, FiZap, FiTag, FiCreditCard } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './BuyMGC.css';

// القيم الافتراضية للخصم (في حال عدم وجود إعدادات)
const DEFAULT_TIERS = [
  { min: 100, max: 500, discount: 0 },
  { min: 501, max: 2000, discount: 5 },
  { min: 2001, max: 5000, discount: 7 },
  { min: 5001, max: 10000, discount: 9 },
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
  const [quantity, setQuantity] = useState(100);
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);

  // جلب إعدادات الخصم من Firestore
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const docRef = doc(db, 'mgcDiscountTiers', 'default');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.tiers && Array.isArray(data.tiers) && data.tiers.length > 0) {
            setTiers(data.tiers);
            setSettingsError(false);
          } else {
            // في حال كانت الشرائح فارغة، نستخدم الافتراضية
            setTiers(DEFAULT_TIERS);
            setSettingsError(false);
          }
        } else {
          // المستند غير موجود، نستخدم الافتراضية
          setTiers(DEFAULT_TIERS);
          setSettingsError(false);
        }
      } catch (error) {
        // فشل الجلب بسبب الصلاحية أو أي خطأ آخر
        console.warn('فشل جلب إعدادات الخصم، سيتم استخدام القيم الافتراضية:', error.message);
        setSettingsError(true);
        setTiers(DEFAULT_TIERS);
        // لا نعرض رسالة للمستخدم حتى لا يشتت انتباهه
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchTiers();
  }, []);

  // دالة لحساب الخصم بناءً على الكمية
  const getDiscount = (qty) => {
    const tier = tiers.find(t => qty >= t.min && qty <= t.max);
    return tier ? tier.discount : 0;
  };

  // السعر الأساسي (بدون خصم): 1 MGC = 0.01 دولار (أي 100 MGC = 1.00 دولار)
  const BASE_PRICE_PER_MGC = 0.01;

  // الكمية يجب أن تكون بين 100 و 10000
  const validQuantity = Math.min(10000, Math.max(100, quantity));
  const discountPercent = getDiscount(validQuantity);
  const originalPrice = validQuantity * BASE_PRICE_PER_MGC;
  const finalPrice = originalPrice * (1 - discountPercent / 100);

  const handleQuantityChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val < 100) val = 100;
    if (val > 10000) val = 10000;
    setQuantity(val);
  };

  const handleBuy = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    if (balance < finalPrice) {
      toast.error(`رصيدك غير كافٍ! تحتاج ${finalPrice.toFixed(2)} $، رصيدك: ${balance.toFixed(2)} $`);
      return;
    }

    setLoading(true);
    try {
      // خصم الرصيد الحقيقي مع سبب واضح
      const deducted = await deductBalance(finalPrice, 'شراء MGC');
      if (!deducted) {
        toast.error('فشل خصم الرصيد الحقيقي');
        setLoading(false);
        return;
      }

      // إضافة رصيد MGC مع سبب واضح
      await addMgcBalance(validQuantity, 'شراء MGC');

      // تسجيل عملية الشراء في Firestore
      try {
        await addDoc(collection(db, 'mgcPurchases'), {
          userId: user.uid,
          mgcAmount: validQuantity,
          priceUSD: finalPrice,
          discountPercent: discountPercent,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('فشل تسجيل عملية شراء MGC:', err);
        // لا نعطي رسالة للمستخدم حتى لا يقلقه الأمر
      }

      // إضافة XP
      const xpEarned = Math.floor(finalPrice * 5);
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
        toast.success(`ربحت ${xpEarned} XP! المستوى ${newLevel} (${newTitle})`);
      }

      toast.success(`تم شراء ${validQuantity} MGC بنجاح`);
    } catch (error) {
      console.error('خطأ في الشراء:', error);
      toast.error(`فشلت عملية الشراء: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  if (settingsLoading) {
    return <div className="buy-mgc-loading">جاري تحميل الإعدادات...</div>;
  }

  return (
    <div className="buy-mgc" dir="rtl">
      <div className="buy-mgc__header">
        <h1>
          <FiDollarSign className="header-icon" style={{ color: '#f59e0b' }} />
          شراء عملات MGC
        </h1>
      </div>

      <VisaCard
        balance={balance}
        mgcBalance={mgcBalance}
        cardHolderName={userData?.name || 'MarsGo User'}
        cardNumber={userData?.visaNumber || '8888 8888 8888 8888'}
        brand="MarsGo Visa"
        secret={userData?.visaSecret}
      />

      {/* في حال فشل جلب الإعدادات، نعرض تنبيهاً بسيطاً (بدون إيموجي) */}
      {settingsError && (
        <div className="buy-mgc__settings-warning">
          <span>ملاحظة: يتم استخدام قيم الخصم الافتراضية. يمكن تعديلها من لوحة الإدارة.</span>
        </div>
      )}

      <div className="buy-mgc__custom">
        <div className="buy-mgc__input-group">
          <label className="buy-mgc__label">الكمية المطلوبة (MGC)</label>
          <div className="buy-mgc__input-row">
            <input
              type="number"
              className="buy-mgc__input"
              value={quantity}
              onChange={handleQuantityChange}
              min="100"
              max="10000"
              step="100"
            />
            <span className="buy-mgc__range-hint">من 100 إلى 10000</span>
          </div>
          <div className="buy-mgc__slider-container">
            <input
              type="range"
              className="buy-mgc__slider"
              min="100"
              max="10000"
              step="100"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
            <div className="buy-mgc__slider-labels">
              <span>100</span>
              <span>5000</span>
              <span>10000</span>
            </div>
          </div>
        </div>

        <div className="buy-mgc__summary">
          <div className="buy-mgc__summary-row">
            <span>السعر الأصلي</span>
            <span className="buy-mgc__original-price">${originalPrice.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div className="buy-mgc__summary-row buy-mgc__discount-row">
              <span>الخصم ({discountPercent}%)</span>
              <span className="buy-mgc__discount-amount">-${(originalPrice - finalPrice).toFixed(2)}</span>
            </div>
          )}
          <div className="buy-mgc__summary-row buy-mgc__total-row">
            <span>السعر النهائي</span>
            <span className="buy-mgc__final-price">${finalPrice.toFixed(2)}</span>
          </div>
          <div className="buy-mgc__summary-row buy-mgc__per-mgc">
            <span>سعر الوحدة</span>
            <span>{(finalPrice / validQuantity * 100).toFixed(2)} سنت / MGC</span>
          </div>
        </div>

        <Button
          onClick={handleBuy}
          disabled={loading || finalPrice <= 0 || validQuantity < 100 || validQuantity > 10000}
          className="buy-mgc__btn"
        >
          {loading ? 'جاري...' : (
            <>
              <FiCreditCard style={{ marginLeft: '0.3rem' }} />
              شراء {validQuantity} MGC
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
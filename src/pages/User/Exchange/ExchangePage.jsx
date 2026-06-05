// src/pages/User/Exchange/ExchangePage.jsx
import { Suspense, lazy } from 'react';
import { useAuth } from '../../../context/AuthContext';
import UnifiedCheckout from '../../../components/Generic/UnifiedCheckout/UnifiedCheckout';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import HowItWorks from '../../../components/UserComponents/HowItWorks/HowItWorks';
import './ExchangePage.css';

const OrdersList = lazy(() => import('../../../components/UserComponents/OrdersList/OrdersList'));

export default function ExchangePage() {
  const { userData } = useAuth();

  return (
    <div className="exchange-page" dir="rtl">
      <div style={{ marginBottom: '1rem' }}>
        <GoBackButton text="رجوع إلى لوحة التحكم" />
      </div>

      <h2 className="exchange-page__title">صرافة شام كاش</h2>

      <HowItWorks page="exchange" />

      {/* ✅ نموذج الدفع الموحد */}
      <UnifiedCheckout serviceType="exchange" redirectPath="/dashboard" />

      <Suspense fallback={<Loading text="جاري تحميل الطلبات..." />}>
        <OrdersList orderType="exchange" title="طلبات الصرافة السابقة" limitCount={10} />
      </Suspense>
    </div>
  );
}
// src/pages/User/Transfer/TransferPage.jsx
import { Suspense, lazy } from 'react';
import UnifiedCheckout from '../../../components/Generic/UnifiedCheckout/UnifiedCheckout'; // ✅ تغيير
import Loading from "../../../components/GeneralComponents/Loading/Loading";
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import "./TransferPage.css";

// تحميل المكونات بشكل lazy
const HowItWorks = lazy(() => import("../../../components/UserComponents/HowItWorks/HowItWorks"));
const OrdersList = lazy(() => import("../../../components/UserComponents/OrdersList/OrdersList"));

export default function TransferPage() {
  return (
    <div className="transfer-page" dir="rtl">
      {/* زر الرجوع */}
      <div style={{ marginBottom: '1rem' }}>
        <GoBackButton text="رجوع إلى لوحة التحكم" />
      </div>

      <h2 className="transfer-page__heading">خدمة التحويل عبر شام كاش</h2>

      {/* HowItWorks - يتم تحميله بشكل lazy */}
      <Suspense fallback={<Loading text="جاري تحميل التعليمات..." />}>
        <HowItWorks page="transfer" />
      </Suspense>

      {/* ✅ استخدام UnifiedCheckout بدلاً من TransferForm */}
      <UnifiedCheckout serviceType="transfer" redirectPath="/dashboard" />

      {/* قائمة الطلبات يتم تحميلها بشكل lazy */}
      <Suspense fallback={<Loading text="جاري تحميل الطلبات..." />}>
        <OrdersList orderType="transfer" title="طلبات التحويل السابقة" limitCount={10} />
      </Suspense>
    </div>
  );
}
// src/pages/User/Transfer/TransferPage.jsx
import { Suspense, lazy } from 'react';
import TransferForm from "../../../components/UserComponents/TransferForm/TransferForm";
import LazyOnScroll from "../../../components/GeneralComponents/LazyOnScroll/LazyOnScroll";
import Loading from "../../../components/GeneralComponents/Loading/Loading";
import "./TransferPage.css";

// تحميل المكونات بشكل lazy
const HowItWorks = lazy(() => import("../../../components/UserComponents/HowItWorks/HowItWorks"));
const OrdersList = lazy(() => import("../../../components/UserComponents/OrdersList/OrdersList"));

export default function TransferPage() {
  return (
    <div className="transfer-page" dir="rtl">
      <h2 className="transfer-page__heading">خدمة التحويل عبر شام كاش</h2>
      
      {/* HowItWorks يظهر عند التمرير */}
      <LazyOnScroll>
        <HowItWorks page="transfer" />
      </LazyOnScroll>

      {/* TransferForm يظهر فوراً (بدون تأخير) لأنه الجزء الأساسي */}
      <TransferForm />

      {/* قائمة الطلبات تظهر عند التمرير */}
      <LazyOnScroll>
        <OrdersList orderType="transfer" title="طلبات التحويل السابقة" limitCount={10} />
      </LazyOnScroll>
    </div>
  );
}
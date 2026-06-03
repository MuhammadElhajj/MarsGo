// src/pages/User/Gaming/GamingPage.jsx
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import './GamingPage.css';

const GamesList = lazy(() => import('../../../components/UserComponents/Gaming/GamesList/GamesList'));
const PackagesList = lazy(() => import('../../../components/UserComponents/Gaming/PackagesList/PackagesList')); // ✅ هذا المكون يجلب الباقات
const GenericCheckout = lazy(() => import('../../../components/Generic/CheckoutPage/GenericCheckout'));
const OrdersList = lazy(() => import('../../../components/UserComponents/OrdersList/OrdersList'));

export default function GamingPage() {
  return (
    <Suspense fallback={<Loading text="جاري تحميل الصفحة..." />}>
      <Routes>
        <Route index element={<GamesList />} />
        <Route path="game/:gameId" element={<PackagesList />} /> {/* ✅ استخدم PackagesList */}
        <Route path="checkout" element={<GenericCheckout orderType="gaming" redirectPath="/gaming" />} />
      </Routes>
      <Suspense fallback={<Loading text="جاري تحميل طلباتك..." />}>
        <OrdersList orderType="gaming" title="طلبات شحن الألعاب السابقة" limitCount={5} />
      </Suspense>
    </Suspense>
  );
}
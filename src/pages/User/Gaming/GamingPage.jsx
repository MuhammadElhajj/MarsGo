// src/pages/User/Gaming/GamingPage.jsx
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import './GamingPage.css';

const GamesList = lazy(() => import('../../../components/UserComponents/Gaming/GamesList/GamesList'));
const PackagesList = lazy(() => import('../../../components/UserComponents/Gaming/PackagesList/PackagesList'));
const CheckoutPage = lazy(() => import('../../../components/UserComponents/Gaming/CheckoutPage/CheckoutPage'));
const OrdersList = lazy(() => import('../../../components/UserComponents/OrdersList/OrdersList')); // ✅ إضافة OrdersList

export default function GamingPage() {
  return (
    <Suspense fallback={<Loading text="جاري تحميل الصفحة..." />}>
      <Routes>
        <Route 
          index 
          element={
            <>
              <GamesList />
              <Suspense fallback={<Loading text="جاري تحميل طلباتك..." />}>
                <OrdersList orderType="gaming" title="طلبات شحن الألعاب السابقة" limitCount={5} />
              </Suspense>
            </>
          } 
        />
        <Route path="game/:gameId" element={<PackagesList />} />
        <Route path="checkout/:gameId/:packageId" element={<CheckoutPage />} />
      </Routes>
    </Suspense>
  );
}
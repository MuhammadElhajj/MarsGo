// src/pages/User/Gaming/GamingPage.jsx
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import './GamingPage.css';

const GamesList = lazy(() => import('../../../components/UserComponents/Gaming/GamesList/GamesList'));
const PackagesList = lazy(() => import('../../../components/UserComponents/Gaming/PackagesList/PackagesList'));
const UnifiedCheckout = lazy(() => import('../../../components/Generic/UnifiedCheckout/UnifiedCheckout'));
const OrdersList = lazy(() => import('../../../components/UserComponents/OrdersList/OrdersList'));

export default function GamingPage() {
  return (
    <Suspense fallback={<Loading text="جاري تحميل الصفحة..." />}>
      <Routes>
        <Route index element={<GamesList />} />
        <Route path="game/:gameId" element={<PackagesList />} />
        <Route path="checkout" element={<UnifiedCheckout serviceType="gaming" redirectPath="/gaming" />} />
      </Routes>
    </Suspense>
  );
}
// src/pages/User/Wallet/WalletPage.jsx
import { Suspense, lazy } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAppStore } from '../../../store/store';
import VisaCard from '../../../components/GeneralComponents/VisaCard/VisaCard';
import ExchangeRateCard from '../../../components/GeneralComponents/ExchangeRateCard/ExchangeRateCard';
import TopUpButton from '../../../components/GeneralComponents/TopUpButton/TopUpButton';
import PaymentMethods from '../../../components/UserComponents/PaymentMethods/PaymentMethods';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import './WalletPage.css';

export default function WalletPage() {
  const { userData } = useAuth();
  const balance = useAppStore((state) => state.balance);
  const mgcBalance = useAppStore((state) => state.mgcBalance);

  return (
    <div className="wallet-page" dir="rtl">
      {/* طرق الدفع المتاحة قريباً - في الأعلى */}
      <div className="wallet-page__payment-methods">
        <PaymentMethods />
      </div>

      {/* صف البطاقات (فيزا + سعر الصرف) */}
      <div className="wallet-page__cards-row">
        <div className="wallet-page__visa-wrapper">
          <VisaCard
            balance={balance}
            mgcBalance={mgcBalance}
            cardHolderName={userData?.name || 'MarsGo User'}
            cardNumber={userData?.visaNumber}
            brand="MarsGo Visa"
            secret={userData?.visaSecret}
          />
        </div>

        <div className="wallet-page__exchange-wrapper">
          <Suspense fallback={<Loading text="جاري تحميل سعر الصرف..." />}>
            <ExchangeRateCard />
          </Suspense>
        </div>
      </div>

      {/* زر الإيداع */}
      <div className="wallet-page__deposit-button">
        <TopUpButton />
      </div>
    </div>
  );
}
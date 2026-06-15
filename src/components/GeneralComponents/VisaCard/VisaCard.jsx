// src/components/GeneralComponents/VisaCard/VisaCard.jsx
import './VisaCard.css';

export default function VisaCard({ 
  balance, 
  cardHolderName = "MarsGo User", 
  cardNumber = "4532 1234 5678 9012", 
  expiryDate = "**/**", 
  brand = "MarsGo" 
}) {
  // تنسيق الرقم ليكون مقروءاً
  const formattedNumber = cardNumber.replace(/(\d{4})/g, '$1 ').trim();

  return (
    <div className="visa-card">
      <div className="visa-card__bg"></div>
      <div className="visa-card__content">
        <div className="visa-card__header">
          <div className="visa-card__brand">{brand}</div>
          {/* <div className="visa-card__chip">💳</div> */}
        </div>
        <div className="visa-card__number">{formattedNumber}</div>
        <div className="visa-card__details">
          {expiryDate && expiryDate !== "**/**" && (
            <div className="visa-card__expiry">
              <span>صالح حتى</span>
              <strong>{expiryDate}</strong>
            </div>
          )}
          <div className="visa-card__balance">
            <span>الرصيد المتاح</span>
            <strong>{balance.toFixed(2)} $</strong>
          </div>
        </div>
        <div className="visa-card__holder">
          <span>اسم حامل البطاقة</span>
          <div>{cardHolderName}</div>
        </div>
      </div>
    </div>
  );
}
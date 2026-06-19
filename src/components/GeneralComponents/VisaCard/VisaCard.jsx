// import { useNavigate } from 'react-router-dom';
// import './VisaCard.css';

// export default function VisaCard({ 
//   balance, 
//   cardHolderName = "MarsGo User", 
//   cardNumber = "4532 1234 5678 9012", 
//   expiryDate = "**/**", 
//   brand = "MarsGo",
//   onTopUp
// }) {
//   const navigate = useNavigate();
//   const formattedNumber = cardNumber.replace(/(\d{4})/g, '$1 ').trim();

//   const handleTopUp = () => {
//     if (onTopUp) {
//       onTopUp();
//     } else {
//       navigate('/topup');
//     }
//   };

//   return (
//     <div className="visa-card">
//       <div className="visa-card__bg"></div>
//       <div className="visa-card__content">
//         <div className="visa-card__header">
//           <div className="visa-card__brand">{brand}</div>
//         </div>
//         <div className="visa-card__number">{formattedNumber}</div>
//         <div className="visa-card__details">
//           {expiryDate && expiryDate !== "**/**" && (
//             <div className="visa-card__expiry">
//               <span>صالح حتى</span>
//               <strong>{expiryDate}</strong>
//             </div>
//           )}
//           <div className="visa-card__balance">
//             <span>الرصيد المتاح</span>
//             <strong>{balance.toFixed(2)} $</strong>
//           </div>
//         </div>
//         <div className="visa-card__holder">
//           <div>
//           <span>اسم حامل البطاقة</span>
//           <div className="visa-card__holder-row">
//             <div className="visa-card__holder-name">{cardHolderName}</div>
//           </div> </div>
//             <button className="visa-card__topup-btn" onClick={handleTopUp}>
//               شحن
//             </button>
//         </div>
//       </div>
//     </div>
//   );
// }
import { useNavigate } from 'react-router-dom';
import './VisaCard.css';

export default function VisaCard({ 
  balance, 
  mgcBalance = 0,
  cardHolderName = "MarsGo User", 
  cardNumber = "4532 1234 5678 9012", 
  brand = "MarsGo",
  secret = null,
  onTopUp
}) {
  const navigate = useNavigate();
  const formattedNumber = cardNumber.replace(/(\d{4})/g, '$1 ').trim();

  const handleTopUp = () => {
    if (onTopUp) {
      onTopUp();
    } else {
      navigate('/topup');
    }
  };

  return (
    <div className="visa-card">
      <div className="visa-card__bg"></div>
      <div className="visa-card__content">
        <div className="visa-card__header">
          <div className="visa-card__brand">{brand}</div>
        </div>
        <div className="visa-card__number">{formattedNumber}</div>
        
        {/* الرصيد المتاح + رصيد MGC + الرقم السري في صف واحد */}
        <div className="visa-card__info-row">
          <div className="visa-card__info-item">
            <span>الرصيد المتاح</span>
            <strong>{balance.toFixed(2)} $</strong>
          </div>
          <div className="visa-card__info-item mgc">
            <span>رصيد MGC</span>
            <strong>{mgcBalance.toFixed(2)} MGC</strong>
          </div>
          <div className="visa-card__info-item secret">
            <span>الرقم السري</span>
            <strong>{secret || '—'}</strong>
          </div>
        </div>

        <div className="visa-card__holder">
          <div>
            <span>اسم حامل البطاقة</span>
            <div className="visa-card__holder-row">
              <div className="visa-card__holder-name">{cardHolderName}</div>
            </div>
          </div>
          <button className="visa-card__topup-btn" onClick={handleTopUp}>
            شحن
          </button>
        </div>
      </div>
    </div>
  );
}
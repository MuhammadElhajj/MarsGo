// import './CatalogCard.css';
// import useFinalPrice from '../../../hooks/useFinalPrice';
// import PriceDisplay from '../PriceDisplay/PriceDisplay';
// import { FiStar } from 'react-icons/fi';
// export default function CatalogCard({ 
//   item,           
//   type = 'item',  
//   onSelect,       
//   showPrice = false,
//   showBadge = false,
//   customBadge = null,
//   customLabels = {},  
// }) {
//   const {
//     name,
//     imageBase64,
//     imageUrl,
//     isAvailable = true,
//     unavailableReason,
//     price,
//     discount = 0,
//     currency = 'USD',
//     id,
//     rating,
//     sold,
//     description,
//     parentId
//   } = item || {};

//   const productType = (type === 'game' || type === 'app') ? type : null;

//   // ✅ تعيين قيمة افتراضية آمنة للسعر
//   const safePrice = (price !== null && price !== undefined && !isNaN(price)) 
//     ? (typeof price === 'number' ? price : parseFloat(price)) 
//     : 0;

//   // ✅ استدعاء الـ hook في أعلى المستوى دائماً
//   const { finalPrice, discountPercent } = useFinalPrice(
//     productType,
//     id,
//     safePrice,
//     discount || 0
//   );

//   // الآن نحدد ما إذا كنا نعرض السعر الحقيقي أم لا
//   const hasValidPrice = price !== null && price !== undefined && !isNaN(price);
//   let originalPriceUSD = hasValidPrice ? safePrice : null;
//   let finalPriceUSD = hasValidPrice ? finalPrice : null;
//   let finalDiscount = hasValidPrice ? discountPercent : 0;

//   const isUnavailable = isAvailable === false;
  
//   const labels = {
//     available: customLabels.available || 'متاح',
//     unavailable: customLabels.unavailable || 'غير متاح',
//     ...customLabels
//   };

//   const shouldShowPrice = showPrice || type === 'package';
//   const shouldShowBadge = showBadge || customBadge !== null;
//   const isCategory = type === 'category';

//   const handleClick = () => {
//     if (!isUnavailable && onSelect) {
//       onSelect(item);
//     }
//   };

//   const imgSrc = imageUrl || imageBase64;

//   if (!name) return null;

//   return (
//     <div 
//       className={`catalog-card ${isUnavailable ? 'catalog-card--unavailable' : ''} catalog-card--${type}`}
//       onClick={handleClick}
//       role="button"
//       tabIndex={0}
//       onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
//       aria-label={name}
//     >
//       {/* صورة + شارة الخصم */}
//       <div className="catalog-card__image-wrapper">
//         {imgSrc ? (
//           <img 
//             src={imgSrc} 
//             alt={name} 
//             loading="lazy"
//             decoding="async"
//             className="catalog-card__image"
//           />
//         ) : (
//           <div className="catalog-card__placeholder" aria-hidden="true">
//             {type === 'game' && '🎮'}
//             {type === 'app' && '📱'}
//             {type === 'package' && '📦'}
//             {type === 'category' && '📂'}
//             {!['game','app','package','category'].includes(type) && '🃏'}
//           </div>
//         )}

//         {/* شارة الخصم – فقط إذا كان الخصم > 0 */}
//         {!isCategory && finalDiscount > 0 && (
//           <span className="catalog-card__discount-badge">-{finalDiscount}%</span>
//         )}
//       </div>

//       {/* المعلومات */}
//       <div className="catalog-card__info">
//         <h3 className="catalog-card__title">{name}</h3>
        
//         {/* التقييم والمبيعات – يظهران فقط إذا وضعها المدير */}
//         {!isCategory && (rating !== undefined && rating !== null) && (
//           <div className="catalog-card__stats">
//             <span className="catalog-card__rating"> <FiStar/> {rating}</span>
//             {(sold !== undefined && sold !== null) && (
//               <span className="catalog-card__separator">|</span>
//             )}
//             {sold !== undefined && sold !== null && (
//               <span className="catalog-card__sold">{sold}</span>
//             )}
//           </div>
//         )}

//         {/* الوصف – للأقسام فقط */}
//         {isCategory && description && (
//           <p className="catalog-card__note">{description}</p>
//         )}

//         {/* حالة عدم التوفر */}
//         {isUnavailable && unavailableReason && (
//           <p className="catalog-card__unavailable-reason">⚠️ {unavailableReason}</p>
//         )}

//         {/* السعر – لا يظهر للأقسام */}
//         {!isCategory && shouldShowPrice && finalPriceUSD !== null && (
//           <PriceDisplay
//             originalPrice={originalPriceUSD}
//             finalPrice={finalPriceUSD}
//             currency={currency}
//             discountPercent={finalDiscount}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

import './CatalogCard.css';
import useFinalPrice from '../../../hooks/useFinalPrice';
import PriceDisplay from '../PriceDisplay/PriceDisplay';
import { FiStar } from 'react-icons/fi';

export default function CatalogCard({ 
  item,           
  type = 'item',  
  onSelect,       
  showPrice = false,
  showBadge = false,
  customBadge = null,
  customLabels = {},  
}) {
  const {
    name,
    imageBase64,
    imageUrl,
    isAvailable = true,
    unavailableReason,
    price,
    discount = 0,
    currency = 'USD',
    id,
    rating,
    sold,
    description,
    parentId
  } = item || {};

  const productType = (type === 'game' || type === 'app') ? type : null;

  // تعيين قيمة افتراضية آمنة للسعر
  const safePrice = (price !== null && price !== undefined && !isNaN(price)) 
    ? (typeof price === 'number' ? price : parseFloat(price)) 
    : 0;

  // استدعاء الـ hook في أعلى المستوى دائماً (لحساب السعر النهائي فقط)
  const { finalPrice, discountPercent } = useFinalPrice(
    productType,
    id,
    safePrice,
    discount || 0
  );

  // ✅ شارة الخصم: نستخدم item.discount مباشرة (وليس finalDiscount)
  const showDiscountBadge = discount && discount > 0;

  // تحديد ما إذا كنا نعرض السعر الحقيقي أم لا
  const hasValidPrice = price !== null && price !== undefined && !isNaN(price);
  let originalPriceUSD = hasValidPrice ? safePrice : null;
  let finalPriceUSD = hasValidPrice ? finalPrice : null;

  const isUnavailable = isAvailable === false;
  
  const labels = {
    available: customLabels.available || 'متاح',
    unavailable: customLabels.unavailable || 'غير متاح',
    ...customLabels
  };

  const shouldShowPrice = showPrice || type === 'package';
  const shouldShowBadge = showBadge || customBadge !== null;
  const isCategory = type === 'category';

  const handleClick = () => {
    if (!isUnavailable && onSelect) {
      onSelect(item);
    }
  };

  const imgSrc = imageUrl || imageBase64;

  if (!name) return null;

  return (
    <div 
      className={`catalog-card ${isUnavailable ? 'catalog-card--unavailable' : ''} catalog-card--${type}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      aria-label={name}
    >
      {/* صورة + شارة الخصم */}
      <div className="catalog-card__image-wrapper">
        {imgSrc ? (
          <img 
            src={imgSrc} 
            alt={name} 
            loading="lazy"
            decoding="async"
            className="catalog-card__image"
          />
        ) : (
          <div className="catalog-card__placeholder" aria-hidden="true">
            {type === 'game' && '🎮'}
            {type === 'app' && '📱'}
            {type === 'package' && '📦'}
            {type === 'category' && '📂'}
            {!['game','app','package','category'].includes(type) && '🃏'}
          </div>
        )}

        {/* ✅ شارة الخصم – تظهر فقط إذا كان discount من المدير > 0 */}
        {!isCategory && showDiscountBadge && (
          <span className="catalog-card__discount-badge">-{discount}%</span>
        )}
      </div>

      {/* المعلومات */}
      <div className="catalog-card__info">
        <h3 className="catalog-card__title">{name}</h3>
        
        {/* التقييم والمبيعات – يظهران فقط إذا وضعها المدير */}
        {!isCategory && (rating !== undefined && rating !== null) && (
          <div className="catalog-card__stats">
            <span className="catalog-card__rating"><FiStar/> {rating}</span>
            {(sold !== undefined && sold !== null) && (
              <span className="catalog-card__separator">|</span>
            )}
            {sold !== undefined && sold !== null && (
              <span className="catalog-card__sold">{sold}</span>
            )}
          </div>
        )}

        {/* الوصف – للأقسام فقط */}
        {isCategory && description && (
          <p className="catalog-card__note">{description}</p>
        )}

        {/* حالة عدم التوفر */}
        {isUnavailable && unavailableReason && (
          <p className="catalog-card__unavailable-reason">⚠️ {unavailableReason}</p>
        )}

        {/* السعر – لا يظهر للأقسام */}
        {!isCategory && shouldShowPrice && finalPriceUSD !== null && (
          <PriceDisplay
            originalPrice={originalPriceUSD}
            finalPrice={finalPriceUSD}
            currency={currency}
            discountPercent={discountPercent}
          />
        )}
      </div>
    </div>
  );
}
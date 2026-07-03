

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

//   const safePrice = (price !== null && price !== undefined && !isNaN(price)) 
//     ? (typeof price === 'number' ? price : parseFloat(price)) 
//     : 0;

//   const { finalPrice, discountPercent } = useFinalPrice(
//     productType,
//     id,
//     safePrice,
//     discount || 0
//   );

//   const showDiscountBadge = discount && Number(discount) > 0;

//   const hasValidPrice = price !== null && price !== undefined && !isNaN(price);
//   let originalPriceUSD = hasValidPrice ? safePrice : null;
//   let finalPriceUSD = hasValidPrice ? finalPrice : null;

//   const isUnavailable = isAvailable === false;
//   const shouldShowPrice = showPrice || type === 'package';
//   const shouldShowBadge = showBadge || customBadge !== null;
//   const isCategory = type === 'category';
//   const isPackage = type === 'package';

//   const discountAmount = isPackage && hasValidPrice && discount > 0 
//     ? (originalPriceUSD - finalPriceUSD).toFixed(2) 
//     : null;

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

//         {!isCategory && showDiscountBadge && (
//           <span className="catalog-card__discount-badge">-{discount}%</span>
//         )}
//       </div>

//       <div className="catalog-card__info">
//         <h3 className="catalog-card__title">{name}</h3>
        
//         {!isCategory && (rating !== undefined && rating !== null) && (
//           <div className="catalog-card__stats">
//             <span className="catalog-card__rating">
//               <FiStar />
//               {rating}
//             </span>
//             {(sold !== undefined && sold !== null) && (
//               <span className="catalog-card__separator"> | </span>
//             )}
//             {sold !== undefined && sold !== null && (
//               <span className="catalog-card__sold">{sold}</span>
//             )}
//           </div>
//         )}

//         {isCategory && description && (
//           <p className="catalog-card__note">{description}</p>
//         )}

//         {isUnavailable && unavailableReason && (
//           <p className="catalog-card__unavailable-reason"> {unavailableReason}</p>
//         )}

//         {isPackage && shouldShowPrice && finalPriceUSD !== null ? (
//           <div className="catalog-card__package-price">
//             <div className="catalog-card__price-row">
//               <span className="catalog-card__final-price">${finalPriceUSD.toFixed(2)}</span>
//               {discountAmount && (
//                 <span className="catalog-card__discount-box">-${discountAmount}</span>
//               )}
//             </div>
//             <div className="catalog-card__old-price">${originalPriceUSD.toFixed(2)}</div>
//           </div>
//         ) : (
//           !isCategory && shouldShowPrice && finalPriceUSD !== null && (
//             <PriceDisplay
//               originalPrice={originalPriceUSD}
//               finalPrice={finalPriceUSD}
//               currency={currency}
//               discountPercent={discountPercent}
//             />
//           )
//         )}
//       </div>
//     </div>
//   );
// }

// src/components/Generic/CatalogCard/CatalogCard.jsx
import './CatalogCard.css';
import useFinalPrice from '../../../hooks/useFinalPrice';
import PriceDisplay from '../PriceDisplay/PriceDisplay';
import { FiStar, FiMonitor, FiSmartphone, FiPackage, FiFolder, FiBox } from 'react-icons/fi';

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

  const safePrice = (price !== null && price !== undefined && !isNaN(price)) 
    ? (typeof price === 'number' ? price : parseFloat(price)) 
    : 0;

  const { finalPrice, discountPercent } = useFinalPrice(
    productType,
    id,
    safePrice,
    discount || 0
  );

  const showDiscountBadge = discount && Number(discount) > 0;

  const hasValidPrice = price !== null && price !== undefined && !isNaN(price);
  let originalPriceUSD = hasValidPrice ? safePrice : null;
  let finalPriceUSD = hasValidPrice ? finalPrice : null;

  const isUnavailable = isAvailable === false;
  const shouldShowPrice = showPrice || type === 'package';
  const shouldShowBadge = showBadge || customBadge !== null;
  const isCategory = type === 'category';
  const isPackage = type === 'package';

  const discountAmount = isPackage && hasValidPrice && discount > 0 
    ? (originalPriceUSD - finalPriceUSD).toFixed(2) 
    : null;

  // ✅ تحديد الأيقونة المناسبة حسب النوع (بدون إيموجيات)
  const getPlaceholderIcon = () => {
    switch (type) {
      case 'game': return <FiMonitor size={40} />;
      case 'app': return <FiSmartphone size={40} />;
      case 'package': return <FiPackage size={40} />;
      case 'category': return <FiFolder size={40} />;
      default: return <FiBox size={40} />;
    }
  };

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
            {getPlaceholderIcon()}
          </div>
        )}

        {!isCategory && showDiscountBadge && (
          <span className="catalog-card__discount-badge">-{discount}%</span>
        )}
      </div>

      <div className="catalog-card__info">
        <h3 className="catalog-card__title">{name}</h3>
        
        {!isCategory && (rating !== undefined && rating !== null) && (
          <div className="catalog-card__stats">
            <span className="catalog-card__rating">
              <FiStar />
              {rating}
            </span>
            {(sold !== undefined && sold !== null) && (
              <span className="catalog-card__separator"> | </span>
            )}
            {sold !== undefined && sold !== null && (
              <span className="catalog-card__sold">{sold}</span>
            )}
          </div>
        )}

        {isCategory && description && (
          <p className="catalog-card__note">{description}</p>
        )}

        {isUnavailable && unavailableReason && (
          <p className="catalog-card__unavailable-reason"> {unavailableReason}</p>
        )}

        {isPackage && shouldShowPrice && finalPriceUSD !== null ? (
          <div className="catalog-card__package-price">
            <div className="catalog-card__price-row">
              <span className="catalog-card__final-price">${finalPriceUSD.toFixed(2)}</span>
              {discountAmount && (
                <span className="catalog-card__discount-box">-${discountAmount}</span>
              )}
            </div>
            <div className="catalog-card__old-price">${originalPriceUSD.toFixed(2)}</div>
          </div>
        ) : (
          !isCategory && shouldShowPrice && finalPriceUSD !== null && (
            <PriceDisplay
              originalPrice={originalPriceUSD}
              finalPrice={finalPriceUSD}
              currency={currency}
              discountPercent={discountPercent}
            />
          )
        )}
      </div>
    </div>
  );
}
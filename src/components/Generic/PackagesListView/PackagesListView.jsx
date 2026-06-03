// // components/Generic/PackagesListView/PackagesListView.jsx
// import PackageCard from '../PackageCard/PackageCard';
// import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
// import './PackagesListView.css';

// export default function PackagesListView({ parentName, packages, onPackageSelect, backPath }) {
//   return (
//     <div className="gaming-page" dir="rtl">
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
//         <GoBackButton text="رجوع" onClick={() => window.history.back()} />
//       </div>
//       <h2 className="gaming-page__title">باقات {parentName}</h2>
//       <div className="packages-grid">
//         {packages.length === 0 ? (
//           <p>لا توجد باقات لهذه الخدمة حالياً</p>
//         ) : (
//           packages.map(pkg => (
//             <PackageCard key={pkg.id} pkg={pkg} onSelect={onPackageSelect} />
//           ))
//         )}
//       </div>
//     </div>
//   );
// }
// src/components/Generic/PackagesListView/PackagesListView.jsx
// src/components/Generic/PackagesListView/PackagesListView.jsx
import PackageCard from '../PackageCard/PackageCard';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import './PackagesListView.css';

export default function PackagesListView({ parentName, packages = [], onPackageSelect }) {
  // ✅ التأكد من أن packages هي مصفوفة
  const packagesArray = Array.isArray(packages) ? packages : [];
  
  return (
    <div className="gaming-page" dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
        <GoBackButton text="رجوع" />
      </div>
      <h2 className="gaming-page__title">باقات {parentName || ''}</h2>
      <div className="packages-grid">
        {packagesArray.length === 0 ? (
          <p>لا توجد باقات لهذه الخدمة حالياً</p>
        ) : (
          packagesArray.map(pkg => (
            <PackageCard key={pkg.id} pkg={pkg} onSelect={onPackageSelect} />
          ))
        )}
      </div>
    </div>
  );
}
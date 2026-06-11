// import { useState, useEffect, useRef } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../../../context/AuthContext';
// import { useServices } from '../../../context/ServicesContext';
// import { useGames } from '../../../context/GamesContext';
// import { useApps } from '../../../context/AppsContext';
// import { useNavLinks } from '../../../context/NavLinksContext';
// import { db } from '../../../firebase';
// import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
// import './Search.css';

// export default function Search({ placeholder = "ابحث عن خدمة، لعبة، تطبيق، طلب..." }) {
//   const { userData } = useAuth();
//   const { services } = useServices();
//   const { games } = useGames();
//   const { apps } = useApps();
//   const { links: navLinks } = useNavLinks();

//   const [searchTerm, setSearchTerm] = useState('');
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showResults, setShowResults] = useState(false);
//   const searchRef = useRef(null);

//   // إغلاق النتائج عند الضغط خارج المربع
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setShowResults(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // البحث في جميع الأقسام
//   useEffect(() => {
//     if (!searchTerm.trim() || searchTerm.length < 2) {
//       setResults([]);
//       return;
//     }

//     const searchAll = async () => {
//       setLoading(true);
//       const searchLower = searchTerm.toLowerCase();
//       const allResults = [];

//       // 1. خدمات المتجر
//       services.forEach(service => {
//         if (service.name?.toLowerCase().includes(searchLower) ||
//             service.description?.toLowerCase().includes(searchLower)) {
//           allResults.push({
//             id: `service-${service.id}`,
//             type: 'service',
//             title: service.name,
//             subtitle: service.description || 'خدمة',
//             link: service.link,
//             icon: service.icon || '🔧',
//           });
//         }
//       });

//       // 2. الألعاب
//       games.forEach(game => {
//         if (game.name?.toLowerCase().includes(searchLower)) {
//           allResults.push({
//             id: `game-${game.id}`,
//             type: 'game',
//             title: game.name,
//             subtitle: game.note || 'لعبة',
//             link: `/gaming/game/${game.id}`,
//             icon: '🎮',
//           });
//         }
//       });

//       // 3. التطبيقات
//       apps.forEach(app => {
//         if (app.name?.toLowerCase().includes(searchLower)) {
//           allResults.push({
//             id: `app-${app.id}`,
//             type: 'app',
//             title: app.name,
//             subtitle: app.note || 'تطبيق',
//             link: `/apps/app/${app.id}`,
//             icon: '📱',
//           });
//         }
//       });

//       // 4. روابط التنقل
//       navLinks.forEach(link => {
//         if (link.name?.toLowerCase().includes(searchLower)) {
//           allResults.push({
//             id: `nav-${link.id}`,
//             type: 'nav',
//             title: link.name,
//             subtitle: link.url,
//             link: link.url,
//             icon: link.icon || '🔗',
//             isExternal: link.isExternal,
//           });
//         }
//       });

//       // 5. طلبات المستخدم (فقط إذا كان مسجلاً)
//       if (userData?.uid) {
//         try {
//           const ordersRef = collection(db, 'orders');
//           const q = query(ordersRef, where('userId', '==', userData.uid), orderBy('createdAt', 'desc'), limit(50));
//           const snapshot = await getDocs(q);
//           const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//           const filteredOrders = userOrders.filter(order => {
//             if (order.id.toLowerCase().includes(searchLower)) return true;
//             if (order.recipientName?.toLowerCase().includes(searchLower)) return true;
//             if (order.customerName?.toLowerCase().includes(searchLower)) return true;
//             if (order.type?.toLowerCase().includes(searchLower)) return true;
//             if (order.status?.toLowerCase().includes(searchLower)) return true;
//             return false;
//           });

//           filteredOrders.forEach(order => {
//             allResults.push({
//               id: `order-${order.id}`,
//               type: 'order',
//               title: `طلب #${order.id.slice(-8)}`,
//               subtitle: `${order.type === 'transfer' ? 'تحويل' : order.type === 'gaming' ? 'شحن ألعاب' : order.type} - ${getStatusLabel(order.status)}`,
//               link: '/my-orders',
//               icon: '📄',
//             });
//           });
//         } catch (err) {
//           console.error('خطأ في جلب الطلبات للبحث:', err);
//         }
//       }

//       // ترتيب النتائج
//       allResults.sort((a, b) => a.title.localeCompare(b.title));
//       // ✅ عرض أول 3 نتائج فقط في جميع الأجهزة
//       setResults(allResults.slice(0, 3));
//       setLoading(false);
//     };

//     const debounce = setTimeout(() => {
//       searchAll();
//     }, 300);

//     return () => clearTimeout(debounce);
//   }, [searchTerm, services, games, apps, navLinks, userData]);

//   const getTypeLabel = (type) => {
//     const types = {
//       transfer: 'تحويل شام كاش',
//       gaming: 'شحن ألعاب',
//       crypto: 'عملات رقمية',
//       exchange: 'صرافة'
//     };
//     return types[type] || type;
//   };

//   const getStatusLabel = (status) => {
//     const statuses = {
//       pending_verification: 'قيد التدقيق',
//       awaiting_customer_resubmit: 'بانتظار تعديلك',
//       verified_pending_execution: 'تم التدقيق',
//       rejected: 'مرفوض',
//       completed: 'مكتمل'
//     };
//     return statuses[status] || status;
//   };

//   return (
//     <div className="search-container" ref={searchRef}>
//       <div className="search-input-wrapper">
//         <input
//           type="text"
//           className="search-input"
//           placeholder={placeholder}
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           onFocus={() => setShowResults(true)}
//         />
//         {searchTerm && (
//           <button className="search-clear" onClick={() => setSearchTerm('')}>
//             ✕
//           </button>
//         )}
//       </div>

//       {showResults && (searchTerm.length >= 2 || results.length > 0) && (
//         <div className="search-results">
//           {loading ? (
//             <div className="search-loading">جاري البحث...</div>
//           ) : results.length > 0 ? (
//             <>
//               <div className="search-results-header">
//                 <span>نتائج البحث ({results.length})</span>
//                 <button onClick={() => setShowResults(false)}>إغلاق</button>
//               </div>
//               <ul className="search-results-list">
//                 {results.map((item) => (
//                   <li key={item.id} className="search-result-item">
//                     {item.isExternal ? (
//                       <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={() => setShowResults(false)}>
//                         <div className="search-result-info">
//                           <span className="search-result-icon">{item.icon}</span>
//                           <span className="search-result-title">{item.title}</span>
//                         </div>
//                         <div className="search-result-subtitle">{item.subtitle}</div>
//                       </a>
//                     ) : (
//                       <Link to={item.link} onClick={() => setShowResults(false)}>
//                         <div className="search-result-info">
//                           <span className="search-result-icon">{item.icon}</span>
//                           <span className="search-result-title">{item.title}</span>
//                         </div>
//                         <div className="search-result-subtitle">{item.subtitle}</div>
//                       </Link>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </>
//           ) : searchTerm.length >= 2 ? (
//             <div className="search-no-results">
//               <span>🔍</span>
//               <p>لا توجد نتائج لـ "{searchTerm}"</p>
//             </div>
//           ) : null}
//         </div>
//       )}
//     </div>
//   );
// }


import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAppStore } from '../../../store/store';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import './Search.css';

export default function Search({ placeholder = "ابحث عن خدمة، لعبة، تطبيق، طلب..." }) {
  const { userData } = useAuth();
  // استخدم الـ store المركزية بدلاً من السياقات المحذوفة
  const services = useAppStore((state) => state.services || []);
  const games = useAppStore((state) => state.games || []);
  const apps = useAppStore((state) => state.apps || []);
  const navLinks = useAppStore((state) => state.navLinks || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // إغلاق النتائج عند الضغط خارج المربع
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // دالة للحصول على تسمية الحالة (لن تتغير)
  const getStatusLabel = (status) => {
    const statuses = {
      pending_verification: 'قيد التدقيق',
      awaiting_customer_resubmit: 'بانتظار تعديلك',
      verified_pending_execution: 'تم التدقيق',
      rejected: 'مرفوض',
      completed: 'مكتمل'
    };
    return statuses[status] || status;
  };

  // البحث في جميع الأقسام
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const searchAll = async () => {
      setLoading(true);
      const searchLower = searchTerm.toLowerCase();
      const allResults = [];

      // 1. خدمات المتجر
      services.forEach(service => {
        if (service.name?.toLowerCase().includes(searchLower) ||
            service.description?.toLowerCase().includes(searchLower)) {
          allResults.push({
            id: `service-${service.id}`,
            type: 'service',
            title: service.name,
            subtitle: service.description || 'خدمة',
            link: service.link,
            icon: service.icon || '🔧',
          });
        }
      });

      // 2. الألعاب
      games.forEach(game => {
        if (game.name?.toLowerCase().includes(searchLower)) {
          allResults.push({
            id: `game-${game.id}`,
            type: 'game',
            title: game.name,
            subtitle: game.note || 'لعبة',
            link: `/gaming/game/${game.id}`,
            icon: '🎮',
          });
        }
      });

      // 3. التطبيقات
      apps.forEach(app => {
        if (app.name?.toLowerCase().includes(searchLower)) {
          allResults.push({
            id: `app-${app.id}`,
            type: 'app',
            title: app.name,
            subtitle: app.note || 'تطبيق',
            link: `/apps/app/${app.id}`,
            icon: '📱',
          });
        }
      });

      // 4. روابط التنقل
      navLinks.forEach(link => {
        if (link.name?.toLowerCase().includes(searchLower)) {
          allResults.push({
            id: `nav-${link.id}`,
            type: 'nav',
            title: link.name,
            subtitle: link.url,
            link: link.url,
            icon: link.icon || '🔗',
            isExternal: link.isExternal,
          });
        }
      });

      // 5. طلبات المستخدم (فقط إذا كان مسجلاً)
      if (userData?.uid) {
        try {
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('userId', '==', userData.uid), orderBy('createdAt', 'desc'), limit(50));
          const snapshot = await getDocs(q);
          const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const filteredOrders = userOrders.filter(order => {
            if (order.id.toLowerCase().includes(searchLower)) return true;
            if (order.recipientName?.toLowerCase().includes(searchLower)) return true;
            if (order.customerName?.toLowerCase().includes(searchLower)) return true;
            if (order.type?.toLowerCase().includes(searchLower)) return true;
            if (order.status?.toLowerCase().includes(searchLower)) return true;
            return false;
          });

          filteredOrders.forEach(order => {
            allResults.push({
              id: `order-${order.id}`,
              type: 'order',
              title: `طلب #${order.id.slice(-8)}`,
              subtitle: `${order.type === 'transfer' ? 'تحويل' : order.type === 'gaming' ? 'شحن ألعاب' : order.type} - ${getStatusLabel(order.status)}`,
              link: '/my-orders',
              icon: '📄',
            });
          });
        } catch (err) {
          console.error('خطأ في جلب الطلبات للبحث:', err);
        }
      }

      // ترتيب النتائج حسب العنوان
      allResults.sort((a, b) => a.title.localeCompare(b.title));
      // عرض أول 10 نتائج فقط لتحسين الأداء (يمكنك تغيير الرقم)
      setResults(allResults.slice(0, 10));
      setLoading(false);
    };

    const debounce = setTimeout(() => {
      searchAll();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, services, games, apps, navLinks, userData]);

  return (
    <div className="search-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowResults(true)}
        />
        {searchTerm && (
          <button className="search-clear" onClick={() => setSearchTerm('')}>
            ✕
          </button>
        )}
      </div>

      {showResults && (searchTerm.length >= 2 || results.length > 0) && (
        <div className="search-results">
          {loading ? (
            <div className="search-loading">جاري البحث...</div>
          ) : results.length > 0 ? (
            <>
              <div className="search-results-header">
                <span>نتائج البحث ({results.length})</span>
                <button onClick={() => setShowResults(false)}>إغلاق</button>
              </div>
              <ul className="search-results-list">
                {results.map((item) => (
                  <li key={item.id} className="search-result-item">
                    {item.isExternal ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={() => setShowResults(false)}>
                        <div className="search-result-info">
                          <span className="search-result-icon">{item.icon}</span>
                          <span className="search-result-title">{item.title}</span>
                        </div>
                        <div className="search-result-subtitle">{item.subtitle}</div>
                      </a>
                    ) : (
                      <Link to={item.link} onClick={() => setShowResults(false)}>
                        <div className="search-result-info">
                          <span className="search-result-icon">{item.icon}</span>
                          <span className="search-result-title">{item.title}</span>
                        </div>
                        <div className="search-result-subtitle">{item.subtitle}</div>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : searchTerm.length >= 2 ? (
            <div className="search-no-results">
              <span>🔍</span>
              <p>لا توجد نتائج لـ "{searchTerm}"</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
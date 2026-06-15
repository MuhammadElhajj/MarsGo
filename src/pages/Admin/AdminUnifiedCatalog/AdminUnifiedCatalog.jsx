// import { useState } from 'react';
// import { useAppStore } from '../../../store/store';
// import AdminCatalog from '../../../components/AdminCoponent/AdminCatalog/AdminCatalog';

// export default function AdminUnifiedCatalog() {
//   const [type, setType] = useState('games'); // 'games' أو 'apps'
  
//   // دوال الألعاب من الـ store
//   const {
//     games,
//     loading: gamesLoading,
//     addGame,
//     updateGame,
//     deleteGame,
//     fetchPackages,
//     addPackage,
//     updatePackage,
//     deletePackage,
//   } = useAppStore();

//   // دوال التطبيقات من الـ store
//   const {
//     apps,
//     loading: appsLoading,
//     addApp,
//     updateApp,
//     deleteApp,
//     fetchAppPackages,
//     addAppPackage,
//     updateAppPackage,
//     deleteAppPackage,
//   } = useAppStore();

//   // اختيار الدوال بناءً على النوع
//   const isGames = type === 'games';
//   const items = isGames ? games : apps;
//   const loading = isGames ? gamesLoading : appsLoading;
//   const addItem = isGames ? addGame : addApp;
//   const updateItem = isGames ? updateGame : updateApp;
//   const deleteItem = isGames ? deleteGame : deleteApp;
//   const fetchPkgs = isGames ? fetchPackages : fetchAppPackages;
//   const addPkg = isGames ? addPackage : addAppPackage;
//   const updatePkg = isGames ? updatePackage : updateAppPackage;
//   const deletePkg = isGames ? deletePackage : deleteAppPackage;

//   const title = isGames ? '🎮 إدارة الألعاب' : '📱 إدارة التطبيقات';
//   const itemLabel = isGames ? 'لعبة' : 'تطبيق';
//   const packageTypeOptions = isGames 
//     ? ['normal', 'royalPass', 'direct'] 
//     : ['normal', 'premium', 'subscription'];

//   return (
//     <div>
//       <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
//         <button 
//           onClick={() => setType('games')} 
//           style={{ fontWeight: type === 'games' ? 'bold' : 'normal' }}
//         >
//           🎮 ألعاب
//         </button>
//         <button 
//           onClick={() => setType('apps')} 
//           style={{ fontWeight: type === 'apps' ? 'bold' : 'normal' }}
//         >
//           📱 تطبيقات
//         </button>
//       </div>

//       <AdminCatalog
//         type={type}
//         items={items}
//         loading={loading}
//         fetchPackages={fetchPkgs}
//         addItem={addItem}
//         updateItem={updateItem}
//         deleteItem={deleteItem}
//         addPackage={addPkg}
//         updatePackage={updatePkg}
//         deletePackage={deletePkg}
//         title={title}
//         itemLabel={itemLabel}
//         packageTypeOptions={packageTypeOptions}
//       />
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/store';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import AdminCatalog from '../../../components/AdminCoponent/AdminCatalog/AdminCatalog';

export default function AdminUnifiedCatalog() {
  const [type, setType] = useState('games'); // 'games' أو 'apps'
  const [loadingData, setLoadingData] = useState(false);
  
  // دوال الألعاب من الـ store
  const {
    games,
    setGames,
    loading: gamesLoading,
    addGame,
    updateGame,
    deleteGame,
    fetchPackages,
    addPackage,
    updatePackage,
    deletePackage,
  } = useAppStore();

  // دوال التطبيقات من الـ store
  const {
    apps,
    setApps,
    loading: appsLoading,
    addApp,
    updateApp,
    deleteApp,
    fetchAppPackages,
    addAppPackage,
    updateAppPackage,
    deleteAppPackage,
  } = useAppStore();

  // ✅ دالة لجلب البيانات من Firestore وتحديث الـ store
  const refreshData = async () => {
    setLoadingData(true);
    try {
      const collectionName = type === 'games' ? 'games' : 'apps';
      const q = query(collection(db, collectionName), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (type === 'games') {
        setGames(items);
      } else {
        setApps(items);
      }
    } catch (err) {
      console.error(`خطأ في جلب ${type}:`, err);
    } finally {
      setLoadingData(false);
    }
  };

  // ✅ جلب البيانات عند تحميل الصفحة أو تغيير النوع
  useEffect(() => {
    refreshData();
  }, [type]);

  // اختيار الدوال بناءً على النوع
  const isGames = type === 'games';
  const items = isGames ? games : apps;
  const loading = isGames ? gamesLoading : appsLoading || loadingData;
  const addItem = isGames ? addGame : addApp;
  const updateItem = isGames ? updateGame : updateApp;
  const deleteItem = isGames ? deleteGame : deleteApp;
  const fetchPkgs = isGames ? fetchPackages : fetchAppPackages;
  const addPkg = isGames ? addPackage : addAppPackage;
  const updatePkg = isGames ? updatePackage : updateAppPackage;
  const deletePkg = isGames ? deletePackage : deleteAppPackage;

  const title = isGames ? '🎮 إدارة الألعاب' : '📱 إدارة التطبيقات';
  const itemLabel = isGames ? 'لعبة' : 'تطبيق';
  const packageTypeOptions = isGames 
    ? ['normal', 'royalPass', 'direct'] 
    : ['normal', 'premium', 'subscription'];

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => setType('games')} 
          style={{ fontWeight: type === 'games' ? 'bold' : 'normal' }}
        >
          🎮 ألعاب
        </button>
        <button 
          onClick={() => setType('apps')} 
          style={{ fontWeight: type === 'apps' ? 'bold' : 'normal' }}
        >
          📱 تطبيقات
        </button>
        <button 
          onClick={refreshData}
          style={{ 
            background: 'none', 
            border: '1px solid var(--color-border)', 
            borderRadius: '0.5rem', 
            padding: '0.2rem 0.8rem',
            cursor: 'pointer'
          }}
          disabled={loadingData}
        >
          🔄 {loadingData ? 'جاري التحديث...' : 'تحديث'}
        </button>
      </div>

      <AdminCatalog
        type={type}
        items={items}
        loading={loading}
        fetchPackages={fetchPkgs}
        addItem={addItem}
        updateItem={updateItem}
        deleteItem={deleteItem}
        addPackage={addPkg}
        updatePackage={updatePkg}
        deletePackage={deletePkg}
        title={title}
        itemLabel={itemLabel}
        packageTypeOptions={packageTypeOptions}
      />
    </div>
  );
}
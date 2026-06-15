import { useState } from 'react';
import { useAppStore } from '../../../store/store';
import AdminCatalog from '../../../components/AdminCoponent/AdminCatalog/AdminCatalog';

export default function AdminUnifiedCatalog() {
  const [type, setType] = useState('games'); // 'games' أو 'apps'
  
  // دوال الألعاب من الـ store
  const {
    games,
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
    loading: appsLoading,
    addApp,
    updateApp,
    deleteApp,
    fetchAppPackages,
    addAppPackage,
    updateAppPackage,
    deleteAppPackage,
  } = useAppStore();

  // اختيار الدوال بناءً على النوع
  const isGames = type === 'games';
  const items = isGames ? games : apps;
  const loading = isGames ? gamesLoading : appsLoading;
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
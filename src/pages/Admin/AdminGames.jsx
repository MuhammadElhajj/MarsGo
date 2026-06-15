// src/pages/Admin/AdminGames.jsx
import { useAppStore } from '../../store/store';
import AdminCatalog from '../../components/AdminCoponent/AdminCatalog/AdminCatalog';

export default function AdminGames() {
  // استخدم useAppStore مباشرة دون قيم افتراضية
  const {
    games,
    loading,
    fetchPackages,
    addGame,
    updateGame,
    deleteGame,
    addPackage,
    updatePackage,
    deletePackage,
  } = useAppStore();

  return (
    <AdminCatalog
      type="games"
      items={games}
      loading={loading}
      fetchPackages={fetchPackages}
      addItem={addGame}
      updateItem={updateGame}
      deleteItem={deleteGame}
      addPackage={addPackage}
      updatePackage={updatePackage}
      deletePackage={deletePackage}
      title="🎮 إدارة الألعاب"
      itemLabel="لعبة"
      packageTypeOptions={['normal', 'royalPass', 'direct']}
    />
  );
}
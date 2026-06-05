// src/pages/Admin/AdminApps.jsx
import { useApps } from '../../context/AppsContext';
import AdminCatalog from '../../components/AdminCoponent/AdminCatalog/AdminCatalog';

export default function AdminApps() {
  const {
    apps,
    loading,
    fetchPackages,
    addApp,
    updateApp,
    deleteApp,
    addPackage,
    updatePackage,
    deletePackage,
  } = useApps();

  return (
    <AdminCatalog
      type="apps"
      items={apps}
      loading={loading}
      fetchPackages={fetchPackages}
      addItem={addApp}
      updateItem={updateApp}
      deleteItem={deleteApp}
      addPackage={addPackage}
      updatePackage={updatePackage}
      deletePackage={deletePackage}
      title="📱 إدارة التطبيقات"
      itemLabel="تطبيق"
      packageTypeOptions={['normal', 'premium', 'subscription']}
    />
  );
}
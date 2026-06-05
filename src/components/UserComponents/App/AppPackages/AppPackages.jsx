// src/components/UserComponents/App/AppPackages/AppPackages.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApps } from '../../../../context/AppsContext';        // ✅ 4 مستويات لأعلى
import CatalogList from '../../../../components/Generic/CatalogList/CatalogList';

export default function AppPackages() {
  const { appId } = useParams();
  const { apps, fetchPackages } = useApps();
  const [app, setApp] = useState(null);
  const [packages, setPackages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const foundApp = apps.find(a => a.id === appId);
      setApp(foundApp);
      const pkgs = await fetchPackages(appId);
      setPackages(pkgs);
    };
    load();
  }, [appId, apps]);

  const handlePackageSelect = (pkg) => {
    navigate('/apps/checkout', { state: { item: app, package: pkg } });
  };

  if (!app) return null;

  return (
    <CatalogList
      items={packages}
      onItemClick={handlePackageSelect}
      title={`باقات ${app.name}`}
      showBackButton={true}
      showPrice={true}
    />
  );
}
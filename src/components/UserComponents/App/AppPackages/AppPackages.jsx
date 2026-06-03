// pages/User/Apps/AppPackages.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApps } from '../../../../context/AppsContext';
import PackagesListView from '../../../Generic/PackagesListView/PackagesListView';

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
    // ✅ استخدام المسار /apps/checkout بدون معرّفات، مع تمرير العنصر والباقة عبر state
    navigate('/apps/checkout', { state: { item: app, package: pkg } });
  };

  if (!app) return null;

  return (
    <PackagesListView
      parentName={app.name}
      packages={packages}
      onPackageSelect={handlePackageSelect}
    />
  );
}
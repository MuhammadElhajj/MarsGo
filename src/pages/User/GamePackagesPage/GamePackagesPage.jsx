import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import CatalogList from '../../../components/Generic/CatalogList/CatalogList';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Loading from '../../../components/GeneralComponents/Loading/Loading';

function extractGameName(packageName) {
  if (packageName.includes(' - ')) {
    return packageName.split(' - ')[1].trim();
  }
  return packageName.trim();
}

export default function GamePackagesPage() {
  const { gameName } = useParams();
  const decodedGameName = decodeURIComponent(gameName);
  const products = useAppStore((state) => state.products);
  const loading = useAppStore((state) => state.loadingProducts);

  if (loading) return <Loading />;

  // تصفية الباقات التي تنتمي إلى هذه اللعبة
  const packages = products.filter(product => {
    if (product.categoryId !== 'games') return false;
    const pkgGameName = extractGameName(product.name);
    return pkgGameName === decodedGameName;
  });

  return (
    <div style={{ padding: '2rem' }} dir="rtl">
      <div style={{ marginBottom: '1rem' }}>
        <GoBackButton text="رجوع إلى الألعاب" />
      </div>
      <h2>🎮 {decodedGameName} - الباقات المتاحة</h2>
      {packages.length === 0 ? (
        <p>لا توجد باقات لهذه اللعبة حالياً.</p>
      ) : (
        <CatalogList items={packages} showPrice={true} />
      )}
    </div>
  );
}
// src/pages/User/CategoryProductsPage/CategoryProductsPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useSubCategories } from '../../../hooks/useSubCategories';
import CatalogList from '../../../components/Generic/CatalogList/CatalogList';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Loading from '../../../components/GeneralComponents/Loading/Loading';

export default function CategoryProductsPage() {
  const { categoryId, subItemSlug } = useParams();  // subItemSlug بدلاً من subItemId
  const navigate = useNavigate();
  const products = useAppStore((state) => state.products);
  const loadingProducts = useAppStore((state) => state.loadingProducts);
  const { subCategories, loading: subLoading } = useSubCategories(categoryId);

  if (loadingProducts || subLoading) return <Loading />;

  // الأقسام الهرمية (التي لها أقسام فرعية) نحددها بوجود بيانات في subCategories
  const isHierarchical = subCategories.length > 0;

  // ---------- الحالة 1: عرض باقات عنصر فرعي محدد (لعبة معينة) ----------
  if (subItemSlug && isHierarchical) {
    const parent = subCategories.find(sc => sc.slug === subItemSlug);
    if (!parent) {
      return (
        <div dir="rtl">
          <GoBackButton text={`رجوع إلى ${categoryId === 'games' ? 'الألعاب' : 'التطبيقات'}`} />
          <p>⚠️ العنصر غير موجود</p>
        </div>
      );
    }
    // استخدام parentId لتصفية المنتجات
    const filteredProducts = products.filter(
      (p) => p.categoryId === categoryId && p.parentId === parent.id
    );
    const backText = categoryId === 'games' ? 'رجوع إلى الألعاب' : 'رجوع إلى التطبيقات';
    const titleIcon = categoryId === 'games' ? '🎮' : '📱';
    return (
      <div dir="rtl">
        <GoBackButton text={backText} />
        <h2>{titleIcon} {parent.name} - الباقات المتاحة</h2>
        {filteredProducts.length === 0 ? (
          <p>⚠️ لا توجد باقات لهذا العنصر حالياً.</p>
        ) : (
          <CatalogList items={filteredProducts} showPrice />
        )}
      </div>
    );
  }

  // ---------- الحالة 2: عرض قائمة العناصر الفرعية (الآباء) إذا كان القسم هرمياً ----------
  if (isHierarchical && !subItemSlug) {
    const parentsList = subCategories.map(sc => ({
      id: sc.id,
      name: sc.name,
      imageUrl: sc.imageUrl,
      slug: sc.slug,
      description: sc.description,
    }));
    const title = categoryId === 'games' ? 'اختر اللعبة' : 'اختر التطبيق';
    const itemType = categoryId === 'games' ? 'game' : 'app';
    return (
      <div dir="rtl">
        <GoBackButton text="رجوع إلى الأقسام" />
        <h2>{title}</h2>
        <CatalogList
          items={parentsList}
          onItemClick={(parent) => navigate(`/category/${categoryId}/${parent.slug}`)} // استخدام slug
          showPrice={false}
          type={itemType}
          showBackButton={false}
        />
      </div>
    );
  }

  // ---------- الحالة 3: الأقسام غير الهرمية (خدمات، شحن، عملات، ...) ----------
  const filtered = products.filter((p) => p.categoryId === categoryId);
  const sectionTitles = {
    services: 'الخدمات',
    topup: 'شحن رصيد',
    crypto: 'عملات رقمية',
    exchange: 'تحويل عملات',
    transfer: 'تحويل أموال',
  };
  const title = sectionTitles[categoryId] || categoryId;
  const iconMap = {
    services: '🛠️',
    topup: '💰',
    crypto: '₿',
    exchange: '🔄',
    transfer: '💸',
  };
  const icon = iconMap[categoryId] || '📂';
  return (
    <div dir="rtl">
      <GoBackButton text="رجوع إلى الأقسام" />
      <h2>{icon} {title}</h2>
      {filtered.length === 0 ? (
        <p>⚠️ لا توجد منتجات في هذا القسم.</p>
      ) : (
        <CatalogList items={filtered} showPrice />
      )}
    </div>
  );
}
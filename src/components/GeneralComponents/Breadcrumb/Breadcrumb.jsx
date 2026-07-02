// src/components/GeneralComponents/Breadcrumb/Breadcrumb.jsx
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiHome, FiSearch } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import './Breadcrumb.css';

// ✅ خريطة لتسمية الصفحات بالعربية
const routeNames = {
  '/': 'الرئيسية',
  '/dashboard': 'لوحة التحكم',
  '/gaming': 'الألعاب',
  '/apps': 'التطبيقات',
  '/transfer': 'تحويل شام كاش',
  '/crypto': 'العملات الرقمية',
  '/exchange': 'الصرافة',
  '/about': 'من نحن',
  '/profile': 'الملف الشخصي',
  '/my-orders': 'طلباتي',
  '/notifications': 'الإشعارات',
  '/topup': 'شحن الرصيد',
  '/referral': 'الإحالات',
  '/wheel': 'دولاب الحظ',
  '/missions': 'المهام',
  '/memberships': 'العضويات',
  '/buy-mgc': 'شراء MGC',
  '/sell-mgc': 'بيع MGC',
  '/search-user': 'بحث عن مستخدم',
  '/search': 'بحث شامل',
  '/friends': 'الأصدقاء',
  '/mianfriendspage': 'الأصدقاء',
  '/chat': 'الدردشة',
  '/clans': 'الكلانات',
  '/clan/create': 'إنشاء كلان',
  '/leaderboard': 'المتصدرين',
  '/reviews': 'التقييمات',
  '/privacy-policy': 'سياسة الخصوصية',
  '/supervisor-candidacy': 'الترشح لمشرف',
  '/my-activities': 'نشاطاتي',
  '/delete-account': 'حذف الحساب',
  '/verify-delete-account': 'تأكيد حذف الحساب',
  '/games-hub': 'العاب الحظ ',
};

// ✅ صفحات نريد إخفاء Breadcrumb فيها
const hiddenPaths = ['/chat/room/', '/login', '/signup', '/verify-code', '/forgot-password', '/reset-password'];

export default function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pathHistory, setPathHistory] = useState([]);
  const [canGoBack, setCanGoBack] = useState(false);

  // تحديث سجل الصفحات عند تغيير المسار
  useEffect(() => {
    if (hiddenPaths.some(path => location.pathname.startsWith(path))) return;

    // استرجاع السجل من sessionStorage
    let history = sessionStorage.getItem('breadcrumb_history');
    let parsedHistory = history ? JSON.parse(history) : [];

    // إزالة أي مسار مكرر (آخر دخول)
    parsedHistory = parsedHistory.filter(path => path !== location.pathname);

    // إضافة المسار الحالي
    parsedHistory.push(location.pathname);

    // ✅ الاحتفاظ بآخر مسارين فقط
    if (parsedHistory.length > 2) {
      parsedHistory = parsedHistory.slice(-2);
    }

    sessionStorage.setItem('breadcrumb_history', JSON.stringify(parsedHistory));
    setPathHistory(parsedHistory);

    // ✅ التحقق من إمكانية الرجوع: يوجد صفحة سابقة وليست الرئيسية
    const hasPrevious = parsedHistory.length > 1;
    const isRoot = location.pathname === '/';
    setCanGoBack(hasPrevious && !isRoot);
  }, [location.pathname]);

  const getPageLabel = (path) => {
    // محاولة الحصول على الاسم من الخريطة
    if (routeNames[path]) return routeNames[path];

    // معالجة المسارات الديناميكية
    if (path.match(/\/clan\/[^/]+$/)) return 'تفاصيل الكلان';
    if (path.match(/\/gaming\/game\/[^/]+$/)) return 'تفاصيل اللعبة';
    if (path.match(/\/apps\/app\/[^/]+$/)) return 'تفاصيل التطبيق';
    if (path.match(/\/profile\/[^/]+$/)) return 'الملف الشخصي';
    if (path.match(/\/clan\/join\/[^/]+$/)) return 'الانضمام للكلان';

    // إذا كان المسار يحتوي على معرف، نحاول استخراج الاسم من الرابط
    const parts = path.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    // إذا كان الجزء الأخير معرف (رقم أو ID طويل)، نستخدم الاسم السابق
    if (parts.length > 1 && lastPart.match(/^[a-zA-Z0-9_-]{8,}$/)) {
      return routeNames[`/${parts[parts.length - 2]}`] || parts[parts.length - 2];
    }

    return lastPart.replace(/-/g, ' ');
  };

  // بناء المسار الكامل من السجل
  const buildBreadcrumbs = () => {
    // إذا لم يكن هناك سجل، نرجع المسار الحالي فقط
    if (pathHistory.length === 0) {
      return [{ url: location.pathname, label: getPageLabel(location.pathname), isLast: true }];
    }

    return pathHistory.map((path, index) => ({
      url: path,
      label: getPageLabel(path),
      isLast: index === pathHistory.length - 1,
    }));
  };

  const breadcrumbs = buildBreadcrumbs();

  // التحقق من إخفاء Breadcrumb
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  // ✅ التحقق من أننا في صفحة البحث لإخفاء أيقونة البحث
  const isSearchPage = location.pathname === '/search';

  return (
    <div className="breadcrumb">
      {/* زر الرجوع */}
      <button
        className={`breadcrumb__back ${!canGoBack ? 'breadcrumb__back--disabled' : ''}`}
        onClick={() => canGoBack && navigate(-1)}
        disabled={!canGoBack}
        title={!canGoBack ? 'لا توجد صفحة سابقة للرجوع إليها' : 'رجوع للصفحة السابقة'}
      >
        <FiChevronLeft /> رجوع
      </button>

      {/* مسار التنقل */}
      <nav className="breadcrumb__nav" aria-label="مسار التنقل">
        <ol className="breadcrumb__list">
          {/* رابط الرئيسية */}
          <li className="breadcrumb__item">
            <Link to="/" className="breadcrumb__link">
              <FiHome className="breadcrumb__home-icon" />
            </Link>
            <span className="breadcrumb__separator">›</span>
          </li>

          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.url} className="breadcrumb__item">
              {crumb.isLast ? (
                <span className="breadcrumb__current">{crumb.label}</span>
              ) : (
                <Link to={crumb.url} className="breadcrumb__link">
                  {crumb.label}
                </Link>
              )}
              {!crumb.isLast && <span className="breadcrumb__separator">›</span>}
            </li>
          ))}
        </ol>
      </nav>

      {/* ✅ أيقونة البحث – تظهر في جميع الصفحات ما عدا صفحة البحث نفسها */}
      {!isSearchPage && (
        <button
          className="breadcrumb__search"
          onClick={() => navigate('/search')}
          title="بحث شامل"
          aria-label="بحث شامل"
        >
          <FiSearch className="breadcrumb__search-icon" />
        </button>
      )}
    </div>
  );
}
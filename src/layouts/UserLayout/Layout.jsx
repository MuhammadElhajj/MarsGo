import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../../components/UserComponents/Header/Header";
import Sidebar from "../../components/UserComponents/Sidebar/Sidebar";
import SecondarySidebar from "../../components/UserComponents/SecondarySidebar/SecondarySidebar";
import MobileNav from "../../components/UserComponents/MobileNav/MobileNav";
import Footer from "../../components/UserComponents/Footer/Footer";
import Search from "../../components/GeneralComponents/Search/Search";
import SupportButton from "../../components/GeneralComponents/SupportButton/SupportButton";
import Breadcrumb from "../../components/GeneralComponents/Breadcrumb/Breadcrumb"; // ✅ إضافة
import './Layout.css';
import GamesWidget from '../../components/GeneralComponents/GamesWidget/GamesWidget';
export default function Layout() {
  // حالات السايدبارين
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [secondaryOpen, setSecondaryOpen] = useState(false);

  const location = useLocation();
  const isChatRoom = location.pathname.startsWith('/chat/room/');
  const isChatPage = location.pathname.startsWith('/chat');
const isCheckoutPage = location.pathname.includes('/checkout');
// تحديد إذا كنا في Dashboard أو Profile
// ✅ إخفاء الفوتر وزر الدعم في صفحات حذف الحساب
  const isDeletePage = location.pathname.startsWith('/delete-account') || 
                       location.pathname.startsWith('/verify-delete-account');
  const showGamesWidget = location.pathname === '/dashboard' || location.pathname.startsWith('/profile');
  // حالات حجم الشاشة
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMedium, setIsMedium] = useState(
    window.innerWidth > 768 && window.innerWidth <= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width <= 768;
      const medium = width > 768 && width <= 1024;

      setIsMobile(mobile);
      setIsMedium(medium);

      if (!mobile) {
        setSidebarOpen(false);
        setSecondaryOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleSecondary = () => setSecondaryOpen(prev => !prev);

  return (
    <div className="app-layout">
      {/* الهيدر */}
      <Header
        onToggleSidebar={toggleSidebar}
        onToggleSecondary={toggleSecondary}
        isMobile={isMobile}
      />

      {/* شريط البحث – يظهر فقط على الجوال */}
      <div className="layout__search-mobile">
        {!isChatPage && <Search placeholder="ابحث عن خدمة، لعبة، تطبيق، طلب..." />}
      </div>

      <div className="app-body">
        {/* ===== السايدبار الثانوي (الأيسر) ===== */}
        {!isMobile && (
          <SecondarySidebar
            isOpen={secondaryOpen}
            onClose={() => setSecondaryOpen(false)}
            isMedium={isMedium}
          />
        )}

        {/* ===== المحتوى الأساسي ===== */}
        <div className="app-content-wrapper">
          {/* ✅ Breadcrumb ثابت أسفل الهيدر وفوق المحتوى */}
          {!isChatPage && (
            <div className="layout__breadcrumb-wrapper">
              <Breadcrumb />
            </div>
          )}
{showGamesWidget && <GamesWidget />}
          <main className={`app-content ${isChatPage ? 'chat-page-layout' : ''}`}>
            <Outlet />
          </main>

          {!isChatPage && !isCheckoutPage && !isDeletePage  &&  <Footer />}
          {!isChatPage && <SupportButton />}
        </div>

        {/* ===== السايدبار الأساسي (الأيمن) ===== */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ===== الشريط السفلي للجوال ===== */}
      {isMobile && !isChatRoom && <MobileNav />}
    </div>
  );
}
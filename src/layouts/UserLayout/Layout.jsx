import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom"; // ✅ استيراد مرة واحدة
import Header from "../../components/UserComponents/Header/Header";
import Sidebar from "../../components/UserComponents/Sidebar/Sidebar";
import SecondarySidebar from "../../components/UserComponents/SecondarySidebar/SecondarySidebar";
import MobileNav from "../../components/UserComponents/MobileNav/MobileNav";
import Footer from "../../components/UserComponents/Footer/Footer";
import Search from "../../components/GeneralComponents/Search/Search";
import SupportButton from "../../components/GeneralComponents/SupportButton/SupportButton";
import './Layout.css';

export default function Layout() {
  // حالات السايدبارين
  const [sidebarOpen, setSidebarOpen] = useState(false);      // الأيمن (الأساسي)
  const [secondaryOpen, setSecondaryOpen] = useState(false);  // الأيسر (الثانوي)

  // تحديد صفحة الدردشة لإخفاء الفوتر
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

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

      // إغلاق السايدبارين تلقائياً عند التكبير
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
      {/* الهيدر مع أزرار التحكم لكلا السايدبارين */}
      <Header
        onToggleSidebar={toggleSidebar}
        onToggleSecondary={toggleSecondary}
        isMobile={isMobile}
      />

      {/* شريط البحث – يظهر فقط على الجوال */}
      <div className="layout__search-mobile">
        <Search placeholder="ابحث عن خدمة، لعبة، تطبيق، طلب..." />
      </div>

      <div className="app-body">
        {/* ===== السايدبار الثانوي (الأيسر) – يختفي على الجوال ===== */}
        {!isMobile && (
          <SecondarySidebar
            isOpen={secondaryOpen}
            onClose={() => setSecondaryOpen(false)}
            isMedium={isMedium}        // لتفعيل وضع الأيقونات فقط
          />
        )}

        {/* ===== المحتوى الأساسي + الفوتر ===== */}
        <div className="app-content-wrapper">
          <main className="app-content">
            <Outlet />
          </main>
          {!isChatPage && <Footer />}
          <SupportButton />
        </div>

        {/* ===== السايدبار الأساسي (الأيمن) – يظهر كدرج على الجوال ===== */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ===== الشريط السفلي للجوال (يحل محل الثانوي) ===== */}
      {isMobile && <MobileNav />}
    </div>
  );
}
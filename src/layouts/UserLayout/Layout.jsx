
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../../components/UserComponents/Header/Header";
import Sidebar from "../../components/UserComponents/Sidebar/Sidebar";
import Footer from "../../components/UserComponents/Footer/Footer";
import NavigationBar from "../../components/UserComponents/NavigationBar/NavigationBar";
import Search from "../../components/GeneralComponents/Search/Search"; // ✅ استيراد البحث
import './Layout.css';
import SupportButton from '../../components/GeneralComponents/SupportButton/SupportButton';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      <Header onToggleSidebar={toggleSidebar} />
      
      {/* شريط التنقل أسفل الهيدر وفوق المحتوى الرئيسي */}
      <NavigationBar />
      
      {/* ✅ شريط البحث المخصص للجوال (يظهر فقط على الشاشات الصغيرة) */}
      <div className="layout__search-mobile">
        <Search placeholder="ابحث عن خدمة، لعبة، تطبيق، طلب..." />
      </div>

      <div className="app-body">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
        <div className="app-content-wrapper">
          <main className="app-content">
            <Outlet />
          </main>
          <Footer />
          <SupportButton />
        </div>
      </div>
    </div>
  );
}
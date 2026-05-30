import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../../components/AdminCoponent/AdminHeader/AdminHeader';
import AdminSidebar from '../../components/AdminCoponent/AdminSidebar/AdminSidebar';
import './AdminLayout.css';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-layout">
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <div className="admin-layout__body">
        <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
        <main className="admin-layout__content"><Outlet /></main>
      </div>
    </div>
  );
}
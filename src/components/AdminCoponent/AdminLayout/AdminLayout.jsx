import { Outlet } from 'react-router-dom';
import AdminHeader from '../../components/AdminHeader/AdminHeader';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import './AdminLayout.css';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="admin-layout__body">
        <AdminSidebar />
        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
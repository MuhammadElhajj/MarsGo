import AdminStats from '../../components/AdminCoponent/AdminStats/AdminStats';
      
import { useAuth } from '../../context/AuthContext';
import AdminOrders from '../../components/AdminCoponent/AdminOrders/AdminOrders';
import UserManagement from '../../components/UserComponents/UserManagement/UserManagement';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { userData } = useAuth();
  if (!userData || userData.role !== 'admin') {
    return <div className="admin-dashboard__unauthorized">غير مصرح لك بالوصول</div>;
  }
  return (
    <div className="admin-dashboard" dir="rtl">
      <h2 className="admin-dashboard__title">لوحة الإدارة</h2>
      <UserManagement />
      <AdminOrders />
     
    
            <AdminStats />
   
    </div>
  );
}
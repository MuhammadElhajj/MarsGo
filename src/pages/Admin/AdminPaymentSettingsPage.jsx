import AdminSidebar from '../../components/AdminCoponent/AdminSidebar/AdminSidebar';
import AdminHeader from '../../components/AdminCoponent/AdminHeader/AdminHeader';
import AdminPaymentSettings from '../../components/AdminCoponent/AdminPaymentSettings/AdminPaymentSettings';

export default function AdminPaymentSettingsPage() {
  return (

      <div className="admin-main">
        <AdminPaymentSettings />   {/* ✅ بدون أي padding إضافي */}
      </div>
   
  );
}
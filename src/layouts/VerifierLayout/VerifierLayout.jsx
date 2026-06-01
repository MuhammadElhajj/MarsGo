import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import VerifierHeader from '../../components/VerifierComponents/VerifierHeader/VerifierHeader';
import VerifierSidebar from '../../components/VerifierComponents/VerifierSidebar/VerifierSidebar';
import './VerifierLayout.css';

export default function VerifierLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="verifier-layout">
      <VerifierHeader onToggleSidebar={toggleSidebar} />
      <div className="verifier-layout__body">
        <VerifierSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
        <main className="verifier-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
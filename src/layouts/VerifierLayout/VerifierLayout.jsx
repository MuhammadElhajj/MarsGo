import { Outlet } from 'react-router-dom';
import VerifierHeader from '../../components/VerifierComponents/VerifierHeader/VerifierHeader';
import VerifierSidebar from '../../components/VerifierComponents/VerifierSidebar/VerifierSidebar';
import './VerifierLayout.css';

export default function VerifierLayout() {
  return (
    <div className="verifier-layout">
      <VerifierHeader />
      <div className="verifier-layout__body">
        <VerifierSidebar />
        <main className="verifier-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
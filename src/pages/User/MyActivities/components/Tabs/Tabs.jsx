// src/pages/User/MyActivitiesPage/components/Tabs/Tabs.jsx
import { FiDollarSign, FiShoppingBag, FiZap } from 'react-icons/fi';

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="my-activities-page__tabs">
      <button
        className={`tab-btn ${activeTab === 'deposits' ? 'active' : ''}`}
        onClick={() => setActiveTab('deposits')}
      >
        <FiDollarSign /> الإيداعات
      </button>
      <button
        className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
        onClick={() => setActiveTab('orders')}
      >
        <FiShoppingBag /> الطلبات
      </button>
      <button
        className={`tab-btn ${activeTab === 'mgc' ? 'active' : ''}`}
        onClick={() => setActiveTab('mgc')}
      >
        <FiZap /> MGC
      </button>
    </div>
  );
}
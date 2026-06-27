// src/pages/User/MyActivitiesPage/components/ActivityList/ActivityItem.jsx
import {
  FiCheckCircle, FiXCircle, FiAlertCircle, FiClock,
  FiRefreshCw, FiZap, FiGift, FiActivity
} from 'react-icons/fi';

// تعريف الثوابت محلياً أو استيرادها من constants
const statusLabels = {
  pending: 'قيد المراجعة',
  approved: 'تمت الموافقة',
  rejected: 'مرفوض',
};

const orderStatusLabels = {
  pending_verification: 'قيد التدقيق',
  awaiting_customer_resubmit: 'بانتظار تعديلك',
  verified_pending_execution: 'تم التدقيق',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};

const orderTypes = {
  transfer: 'تحويل شام كاش',
  gaming: 'شحن ألعاب',
  apps: 'شحن تطبيقات',
  crypto: 'عملات رقمية',
  exchange: 'صرافة',
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'approved':
    case 'completed':
      return <FiCheckCircle className="status-icon approved" />;
    case 'rejected':
      return <FiXCircle className="status-icon rejected" />;
    case 'pending':
    case 'pending_verification':
    case 'awaiting_customer_resubmit':
    case 'verified_pending_execution':
      return <FiAlertCircle className="status-icon pending" />;
    default:
      return <FiClock className="status-icon" />;
  }
};

const getStatusClass = (status) => {
  if (['approved', 'completed'].includes(status)) return 'status-approved';
  if (['rejected'].includes(status)) return 'status-rejected';
  return 'status-pending';
};

const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('ar-EG');
};

// ===== عرض عنصر الإيداع =====
const DepositItem = ({ item }) => (
  <div className="activity-item deposit-item">
    <div className="activity-icon-wrapper">{getStatusIcon(item.status)}</div>
    <div className="activity-info">
      <div className="activity-header">
        <span className="activity-title">إيداع #{item.id.slice(-6)}</span>
        <span className={`activity-status ${getStatusClass(item.status)}`}>
          {statusLabels[item.status] || item.status}
        </span>
      </div>
      <div className="activity-details">
        <span className="activity-amount">+{item.amount} $</span>
        <span className="activity-method">
          {item.paymentMethod === 'usdt' ? 'USDT' :
            item.paymentMethod === 'shamCash' ? 'شام كاش' : 'سيريتل كاش'}
        </span>
      </div>
      <span className="activity-date">{formatDate(item.createdAt)}</span>
    </div>
  </div>
);

// ===== عرض عنصر الطلب =====
const OrderItem = ({ order }) => (
  <div className="activity-item order-item">
    <div className="activity-icon-wrapper">{getStatusIcon(order.status)}</div>
    <div className="activity-info">
      <div className="activity-header">
        <span className="activity-title">
          {orderTypes[order.type] || order.type} #{order.id.slice(-6)}
        </span>
        <span className={`activity-status ${getStatusClass(order.status)}`}>
          {orderStatusLabels[order.status] || order.status}
        </span>
      </div>
      <div className="activity-details">
        <span className="activity-amount">
          {order.finalPriceUSD || order.finalPrice || order.amount} $
        </span>
        <span className="activity-type">
          {order.type === 'gaming' && `${order.gameName || 'لعبة'}`}
          {order.type === 'transfer' && `تحويل إلى ${order.recipientName}`}
          {order.type === 'apps' && `${order.itemName || 'تطبيق'}`}
          {order.type === 'crypto' && `${order.tradeType === 'buy' ? 'شراء' : 'بيع'} ${order.amount} USDT`}
          {order.type === 'exchange' && `صرافة ${order.exchangeType === 'buy_dollar' ? 'دولار' : 'ليرة'}`}
        </span>
      </div>
      <span className="activity-date">{formatDate(order.createdAt)}</span>
    </div>
  </div>
);

// ===== عرض عنصر نشاط MGC =====
const MgcItem = ({ item }) => {
  const getMgcIcon = (activityType) => {
    switch (activityType) {
      case 'wheel': return <FiRefreshCw className="mgc-icon wheel" />;
      case 'machine': return <FiZap className="mgc-icon machine" />;
      case 'mgc_purchase': return <FiGift className="mgc-icon purchase" />;
      default: return <FiActivity className="mgc-icon" />;
    }
  };

  const getMgcLabel = (item) => {
    if (item.activityType === 'wheel') return `دولاب الحظ - ربح ${item.amount} MGC`;
    if (item.activityType === 'machine') return `ماكينة الحظ - ${item.reward || 'جائزة'}`;
    if (item.activityType === 'mgc_purchase') return `شراء ${item.amount} MGC`;
    return 'نشاط MGC';
  };

  const icon = getMgcIcon(item.activityType);
  const label = getMgcLabel(item);
  const date = formatDate(item.timestamp || item.createdAt);

  return (
    <div className="activity-item mgc-item">
      <div className="activity-icon-wrapper mgc-icon-wrapper">{icon}</div>
      <div className="activity-info">
        <div className="activity-header">
          <span className="activity-title">{label}</span>
          <span className="activity-amount">{item.amount > 0 && `+${item.amount} MGC`}</span>
        </div>
        <div className="activity-details">
          <span className="activity-type">
            {item.activityType === 'wheel' && `سعر الدخول: ${item.cost || 0.25} MGC`}
            {item.activityType === 'machine' && `سعر الدخول: ${item.cost || 75} MGC`}
            {item.activityType === 'mgc_purchase' && `السعر: ${item.price || 0} $`}
          </span>
        </div>
        <span className="activity-date">{date}</span>
      </div>
    </div>
  );
};

// ===== المكون الرئيسي =====
export default function ActivityItem({ item, type }) {
  if (type === 'deposits') return <DepositItem item={item} />;
  if (type === 'orders') return <OrderItem order={item} />;
  if (type === 'mgc') return <MgcItem item={item} />;
  return null;
}
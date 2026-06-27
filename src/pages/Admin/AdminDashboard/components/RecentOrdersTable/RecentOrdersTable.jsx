// src/pages/Admin/AdminDashboard/components/RecentOrdersTable/RecentOrdersTable.jsx
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function RecentOrdersTable({ orders }) {
  if (!orders || orders.length === 0) {
    return <p className="admin-dashboard__chart-empty">لا توجد طلبات حديثة</p>;
  }

  return (
    <div className="admin-dashboard__chart-card admin-dashboard__chart-card--full">
      <div className="admin-dashboard__chart-header">
        <h3>🕐 آخر الطلبات</h3>
      </div>
      <div className="admin-dashboard__recent-orders">
        <div className="admin-dashboard__recent-orders-list">
          <table className="admin-dashboard__recent-orders-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>النوع</th>
                <th>العميل</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id.slice(-6)}</td>
                  <td>{ORDER_TYPE_LABELS[order.type] || order.type}</td>
                  <td>{order.customerName || '—'}</td>
                  <td>
                    {formatCurrency(
                      order.finalPriceUSD || order.finalPrice || order.amount || 0
                    )}
                  </td>
                  <td>
                    <span
                      className={`admin-dashboard__status-badge admin-dashboard__status-badge--${order.status}`}
                    >
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
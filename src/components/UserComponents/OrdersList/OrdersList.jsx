// src/components/UserComponents/OrdersList/OrdersList.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import "./OrdersList.css";

const statusLabels = {
  pending_verification: "قيد التدقيق",
  awaiting_customer_resubmit: "بانتظار تعديل الزبون",
  verified_pending_execution: "تم التدقيق - بانتظار التنفيذ",
  rejected: "مرفوض",
  completed: "مكتمل",
};

const getOrderTypeLabel = (type) => {
  switch(type) {
    case 'transfer': return 'تحويل شام كاش';
    case 'gaming': return 'شحن ألعاب';
    case 'crypto': return 'عملات رقمية';
    case 'exchange': return 'صرافة';
    default: return type;
  }
};

const getOrderDetails = (order) => {
  switch(order.type) {
    case 'transfer': return `${order.recipientName} (${order.shamCashPhone})`;
    case 'gaming': return `${order.gameName} - ${order.packageName} (${order.playerId})`;
    case 'crypto': return `${order.tradeType === 'buy' ? 'شراء' : 'بيع'} ${order.amount} USDT`;
    case 'exchange': return `${order.exchangeType === 'buy_dollar' ? 'شراء دولار' : 'بيع دولار'} - المبلغ: ${order.amount}`;
    default: return '';
  }
};

const getAmount = (order) => {
  if (order.type === 'gaming') return order.finalPrice || order.price;
  if (order.type === 'crypto') return order.amount;
  return order.amount;
};

const getCurrency = (order) => {
  if (order.type === 'gaming') return order.currency === 'USD' ? '$' : 'ل.س';
  if (order.type === 'crypto') return 'USDT';
  if (order.type === 'transfer') return '$';
  return 'ل.س';
};

export default function OrdersList({ orderType = "transfer", title = "آخر طلباتي", limitCount = 10, showViewAll = false, onViewAll }) {
  const { userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData?.uid) return;
      try {
        let q;
        if (orderType === 'all') {
          q = query(
            collection(db, "orders"),
            where("userId", "==", userData.uid),
            orderBy("createdAt", "desc"),
            limit(limitCount)
          );
        } else {
          q = query(
            collection(db, "orders"),
            where("userId", "==", userData.uid),
            where("type", "==", orderType),
            orderBy("createdAt", "desc"),
            limit(limitCount)
          );
        }
        const snapshot = await getDocs(q);
        const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersList);
      } catch (err) {
        console.error(`Error fetching orders:`, err);
        // محاولة بدون orderBy
        try {
          let q2;
          if (orderType === 'all') {
            q2 = query(collection(db, "orders"), where("userId", "==", userData.uid));
          } else {
            q2 = query(collection(db, "orders"), where("userId", "==", userData.uid), where("type", "==", orderType));
          }
          const snapshot2 = await getDocs(q2);
          let ordersList2 = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          ordersList2.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
          setOrders(ordersList2.slice(0, limitCount));
        } catch (err2) {
          console.error(err2);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userData, orderType, limitCount]);

  if (loading) return <div className="orders-list__loading">جاري تحميل الطلبات...</div>;
  if (!orders.length) return <p className="orders-list__empty">لا توجد طلبات {title} بعد.</p>;

  return (
    <div className="orders-list" dir="rtl">
      <div className="orders-list__header">
        <h3 className="orders-list__title">{title}</h3>
        {showViewAll && onViewAll && (
          <button className="orders-list__view-all-btn" onClick={onViewAll}>مشاهدة الجميع →</button>
        )}
      </div>
      <div className="orders-list__table-wrapper">
        <table className="orders-list__table">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              {orderType === 'all' && <th>الخدمة</th>}
              <th>التفاصيل</th>
              <th>المبلغ</th>
              <th>الحالة</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>#{order.id.slice(-6)}</td>
                {orderType === 'all' && <td>{getOrderTypeLabel(order.type)}</td>}
                <td>{getOrderDetails(order)}</td>
                <td>{getAmount(order)} {getCurrency(order)}</td>
                <td>
                  <span className={`orders-list__status orders-list__status--${order.status}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td>
                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("ar-SY") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
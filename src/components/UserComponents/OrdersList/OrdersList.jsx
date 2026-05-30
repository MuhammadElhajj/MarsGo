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

export default function OrdersList() {
  const { userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData?.uid) return;
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", userData.uid),
          where("type", "==", "transfer"),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const ordersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersList);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userData]);

  if (loading) return <div className="orders-list__loading">جاري تحميل الطلبات...</div>;
  if (!orders.length) return <p className="orders-list__empty">لا توجد طلبات تحويل بعد.</p>;

  return (
    <div className="orders-list" dir="rtl">
      <h3 className="orders-list__title">آخر طلباتي</h3>
      <div className="orders-list__table-wrapper">
        <table className="orders-list__table">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>المستلم</th>
              <th>المبلغ</th>
              <th>الحالة</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>#{order.id.slice(-6)}</td>
                <td>{order.recipientName}</td>
                <td>{order.amount?.toFixed(2)} $</td>
                <td>
                  <span className={`orders-list__status orders-list__status--${order.status}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td>
                  {order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleDateString("ar-SY")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
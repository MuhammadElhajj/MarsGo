// src/components/AdminCoponent/AdminDashboard/AdminCharts.jsx
import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import './AdminCharts.css';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdminCharts({ period }) {
  const [ordersByType, setOrdersByType] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        // جلب جميع الطلبات
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 1. توزيع الطلبات حسب النوع
        const typeMap = {};
        orders.forEach(order => {
          const type = order.type || 'unknown';
          typeMap[type] = (typeMap[type] || 0) + 1;
        });
        const typeData = Object.keys(typeMap).map(key => ({
          name: key === 'gaming' ? 'شحن ألعاب' : 
                key === 'apps' ? 'شحن تطبيقات' :
                key === 'transfer' ? 'تحويل' :
                key === 'crypto' ? 'عملات رقمية' :
                key === 'exchange' ? 'صرافة' : key,
          value: typeMap[key]
        }));
        setOrdersByType(typeData);

        // 2. توزيع الطلبات حسب الحالة
        const statusMap = {};
        orders.forEach(order => {
          const status = order.status || 'unknown';
          statusMap[status] = (statusMap[status] || 0) + 1;
        });
        const statusData = Object.keys(statusMap).map(key => ({
          name: key === 'completed' ? 'مكتمل' :
                key === 'pending_verification' ? 'قيد التدقيق' :
                key === 'awaiting_customer_resubmit' ? 'بانتظار تعديل' :
                key === 'verified_pending_execution' ? 'تم التدقيق' :
                key === 'rejected' ? 'مرفوض' : key,
          value: statusMap[key]
        }));
        setOrdersByStatus(statusData);

        // 3. النشاط الأسبوعي (آخر 7 أيام)
        const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const weekData = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dayStr = date.toISOString().split('T')[0];
          const dayOrders = orders.filter(o => {
            const createdAt = o.createdAt?.toDate?.() || new Date(o.createdAt);
            return createdAt.toISOString().split('T')[0] === dayStr;
          });
          weekData.push({
            day: dayNames[date.getDay()],
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, o) => sum + (o.finalPriceUSD || o.finalPrice || o.amount || 0), 0)
          });
        }
        setWeeklyActivity(weekData);

        // 4. الاتجاه الشهري (آخر 12 شهراً)
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const monthData = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthOrders = orders.filter(o => {
            const createdAt = o.createdAt?.toDate?.() || new Date(o.createdAt);
            return `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}` === monthStr;
          });
          monthData.push({
            month: monthNames[date.getMonth()],
            orders: monthOrders.length,
            revenue: monthOrders.reduce((sum, o) => sum + (o.finalPriceUSD || o.finalPrice || o.amount || 0), 0)
          });
        }
        setMonthlyTrend(monthData);

      } catch (err) {
        console.error('خطأ في جلب بيانات الرسوم:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [period]);

  if (loading) {
    return <div className="admin-charts-loading">جاري تحميل الرسوم البيانية...</div>;
  }

  return (
    <div className="admin-charts">
      <div className="chart-row">
        <div className="chart-card chart-card--half">
          <h3>📊 توزيع الطلبات حسب النوع</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={ordersByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ordersByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card chart-card--half">
          <h3>📈 حالة الطلبات</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ordersByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card chart-card--full">
          <h3>📅 النشاط اليومي (آخر 7 أيام)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="orders" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} yAxisId="left" />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} yAxisId="right" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card chart-card--full">
          <h3>📈 الاتجاه الشهري</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#4f46e5" strokeWidth={2} yAxisId="left" />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} yAxisId="right" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
// src/components/UserComponents/UserManagement/UserManagement.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { 
  collection, getDocs, query, where, orderBy, limit, 
  startAfter, getDoc, doc, updateDoc 
} from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import './UserManagement.css';

const PAGE_SIZE = 10;

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [roleActionLoading, setRoleActionLoading] = useState(null);
  const [typeActionLoading, setTypeActionLoading] = useState(null);

  // جلب المستخدمين الأولي
  const fetchUsers = useCallback(async (isSearch = false) => {
    setLoading(true);
    try {
      let q;
      if (searchTerm.trim()) {
        // بحث بالاسم أو البريد الإلكتروني (نستخدم where مع >= و <=)
        const searchLower = searchTerm.trim().toLowerCase();
        // إذا كان البحث يبدو كـ UID (يبدأ بـ MGC_ أو أرقام)
        if (searchLower.startsWith('mgc_') || /^\d+$/.test(searchLower)) {
          // بحث في uniqueId
          const uidSearch = searchLower.startsWith('mgc_') ? searchLower : `mgc_${searchLower}`;
          q = query(
            collection(db, 'users'),
            where('uniqueId', '>=', uidSearch),
            where('uniqueId', '<=', uidSearch + '\uf8ff'),
            limit(PAGE_SIZE)
          );
        } else {
          // بحث في الاسم أو البريد الإلكتروني (بحاجة إلى فهارس)
          // نستخدم استعلامين منفصلين ونجمع النتائج (بدون تكرار)
          const nameQuery = query(
            collection(db, 'users'),
            where('name', '>=', searchLower),
            where('name', '<=', searchLower + '\uf8ff'),
            limit(PAGE_SIZE)
          );
          const emailQuery = query(
            collection(db, 'users'),
            where('email', '>=', searchLower),
            where('email', '<=', searchLower + '\uf8ff'),
            limit(PAGE_SIZE)
          );
          const [nameSnap, emailSnap] = await Promise.all([
            getDocs(nameQuery),
            getDocs(emailQuery)
          ]);
          const nameUsers = nameSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const emailUsers = emailSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          // دمج النتائج وإزالة التكرار (حسب id)
          const merged = [...nameUsers, ...emailUsers];
          const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          setUsers(unique);
          setLastVisible(null);
          setHasMore(false);
          setLoading(false);
          return;
        }
      } else {
        q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
      }

      const snap = await getDocs(q);
      const usersList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersList);
      setLastVisible(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل المستخدمين', 'error');
      // إذا فشل بسبب نقص الفهارس، نستخدم fallback: جلب الكل وتصفية محلياً
      if (err.code === 'failed-precondition') {
        try {
          const snap = await getDocs(collection(db, 'users'));
          const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // تصفية محلياً
          const searchLower = searchTerm.trim().toLowerCase();
          const filtered = allUsers.filter(u => 
            u.name?.toLowerCase().includes(searchLower) ||
            u.email?.toLowerCase().includes(searchLower) ||
            u.uniqueId?.toLowerCase().includes(searchLower)
          );
          setUsers(filtered.slice(0, PAGE_SIZE));
          setLastVisible(null);
          setHasMore(false);
        } catch (fallbackErr) {
          console.error(fallbackErr);
          showToast('فشل تحميل المستخدمين', 'error');
        }
      }
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [searchTerm]);

  // تحميل المزيد
  const loadMore = useCallback(async () => {
    if (!lastVisible || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      let q;
      if (searchTerm.trim()) {
        // البحث مع التحميل الإضافي صعب مع searchTerm، لذا نمنع loadMore أثناء البحث
        setHasMore(false);
        return;
      }
      q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const newUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(prev => [...prev, ...newUsers]);
      setLastVisible(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل المزيد', 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [lastVisible, loadingMore, hasMore, searchTerm]);

  // البحث عند تغيير النص
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm.length === 0) {
        setSearching(true);
        fetchUsers(true);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, fetchUsers]);

  // تحميل أولي
  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (userId, newRole) => {
    setRoleActionLoading(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast('تم تغيير الدور بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('فشل تغيير الدور', 'error');
    } finally {
      setRoleActionLoading(null);
    }
  };

  const changeCustomerType = async (userId, newType) => {
    const user = users.find(u => u.id === userId);
    const oldType = user?.customerType || 'customer';
    if (oldType === newType) return;
    setTypeActionLoading(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { customerType: newType });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, customerType: newType } : u));
      showToast(`تم تغيير نوع العميل إلى ${newType === 'merchant' ? 'تاجر' : 'عادي'}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('فشل تحديث نوع العميل', 'error');
    } finally {
      setTypeActionLoading(null);
    }
  };

  const handleRowClick = (userId) => {
    navigate(`/admin/user/${userId}`);
  };

  if (loading && users.length === 0) {
    return <p>جاري تحميل المستخدمين...</p>;
  }

  return (
    <div className="user-management">
      <div className="user-management__header">
        <h2 className="user-management__title">إدارة المستخدمين</h2>
        <div className="user-management__search">
          <Input
            placeholder="ابحث بالاسم، البريد، أو المعرف (MGC_)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="user-management__search-input"
          />
        </div>
      </div>

      <div className="user-management__table-wrapper">
        <table className="user-management__table">
          <thead>
            <tr>
              <th>#</th>
              <th>المستخدم</th>
              <th>البريد الإلكتروني</th>
              <th>المعرف الفريد</th>
              <th>الدور</th>
              <th>نوع العميل</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, index) => {
              const isRoleLoading = roleActionLoading === u.id;
              const isTypeLoading = typeActionLoading === u.id;
              return (
                <tr 
                  key={u.id} 
                  className="user-management__row"
                  onClick={() => handleRowClick(u.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{(index + 1)}</td>
                  <td>
                    <div className="user-management__user-info">
                      <img src={u.avatar || '/default-avatar.png'} alt={u.name} className="user-management__avatar" />
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td className="user-management__unique-id">{u.uniqueId || '—'}</td>
                  <td>
                    <span className={`user-management__role user-management__role--${u.role}`}>
                      {u.role === 'admin' && 'مدير'}
                      {u.role === 'verifier' && 'مدقق'}
                      {u.role === 'finance_verifier' && 'مدقق مالي'}
                      {u.role === 'customer' && 'زبون'}
                    </span>
                  </td>
                  <td>
                    <select
                      value={u.customerType || 'customer'}
                      onChange={(e) => changeCustomerType(u.id, e.target.value)}
                      disabled={isTypeLoading}
                      className="customer-type-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="customer">زبون عادي</option>
                      <option value="merchant">تاجر</option>
                    </select>
                  </td>
                  <td>
                    <div className="user-management__actions" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => changeRole(u.id, 'admin')}
                        disabled={u.role === 'admin' || isRoleLoading}
                        className="user-management__btn"
                        size="sm"
                      >
                        مدير
                      </Button>
                      <Button
                        onClick={() => changeRole(u.id, 'verifier')}
                        disabled={u.role === 'verifier' || isRoleLoading}
                        className="user-management__btn"
                        size="sm"
                      >
                        مدقق
                      </Button>
                      <Button
                        onClick={() => changeRole(u.id, 'finance_verifier')}
                        disabled={u.role === 'finance_verifier' || isRoleLoading}
                        className="user-management__btn"
                        size="sm"
                      >
                        مدقق مالي
                      </Button>
                      <Button
                        onClick={() => changeRole(u.id, 'customer')}
                        disabled={u.role === 'customer' || isRoleLoading}
                        variant="danger"
                        className="user-management__btn"
                        size="sm"
                      >
                        زبون
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="user-management__empty">لا يوجد مستخدمون مطابقون للبحث</p>
        )}
      </div>

      {hasMore && !searchTerm.trim() && (
        <div className="user-management__load-more">
          <Button onClick={loadMore} disabled={loadingMore} variant="secondary">
            {loadingMore ? 'جاري التحميل...' : 'تحميل 10 مستخدمين إضافيين'}
          </Button>
        </div>
      )}
      {hasMore && searchTerm.trim() && (
        <p className="user-management__hint">نتائج البحث محدودة، قم بتضييق البحث للحصول على نتائج أدق</p>
      )}
    </div>
  );
}
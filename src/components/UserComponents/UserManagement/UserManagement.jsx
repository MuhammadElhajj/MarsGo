import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import './UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <p>جاري تحميل المستخدمين...</p>;

  return (
    <div className="user-management">
      <h2 className="user-management__title">إدارة المستخدمين</h2>
      <div className="user-management__table-wrapper">
        <table className="user-management__table">
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>البريد الإلكتروني</th>
              <th>الدور الحالي</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="user-management__user-info">
                    <img src={u.avatar || '/default-avatar.png'} alt={u.name} className="user-management__avatar" />
                    <span>{u.name}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`user-management__role user-management__role--${u.role}`}>
                    {u.role === 'admin' && 'مدير'}
                    {u.role === 'verifier' && 'مدقق'}
                    {u.role === 'finance_verifier' && 'مدقق مالي'}
                    {u.role === 'customer' && 'زبون'}
                  </span>
                </td>
                <td>
                  <div className="user-management__actions">
                    <Button
                      onClick={() => changeRole(u.id, 'admin')}
                      disabled={u.role === 'admin' || actionLoading === u.id}
                      className="user-management__btn"
                    >
                      مدير
                    </Button>
                    <Button
                      onClick={() => changeRole(u.id, 'verifier')}
                      disabled={u.role === 'verifier' || actionLoading === u.id}
                      className="user-management__btn"
                    >
                      مدقق
                    </Button>
                    <Button
                      onClick={() => changeRole(u.id, 'finance_verifier')}
                      disabled={u.role === 'finance_verifier' || actionLoading === u.id}
                      className="user-management__btn"
                    >
                      مدقق مالي
                    </Button>
                    <Button
                      onClick={() => changeRole(u.id, 'customer')}
                      disabled={u.role === 'customer' || actionLoading === u.id}
                      variant="danger"
                      className="user-management__btn"
                    >
                      زبون
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
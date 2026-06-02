// src/pages/Admin/AdminVerifiers.jsx
import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import './AdminVerifiers.css';

export default function AdminVerifiers() {
  const [verifiers, setVerifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchVerifiers();
  }, []);

  const fetchVerifiers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVerifiers(users.filter(u => u.role === 'verifier'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVerifierType = async (userId, currentType) => {
    const newType = currentType === 'basic' ? 'advanced' : 'basic';
    setUpdating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { verifierType: newType });
      await fetchVerifiers();
    } catch (err) {
      console.error(err);
      alert('فشل تحديث صلاحية المدقق');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div className="admin-verifiers">
      <h2>إدارة المدققين</h2>
      <div className="verifiers-list">
        {verifiers.map(v => (
          <div key={v.id} className="verifier-card">
            <div className="verifier-info">
              <strong>{v.name}</strong>
              <span>{v.email}</span>
              <span className={`verifier-type ${v.verifierType}`}>
                {v.verifierType === 'basic' ? 'مدقق عادي' : 'مدقق متقدم (ينفذ الطلبات)'}
              </span>
            </div>
            <Button
              onClick={() => toggleVerifierType(v.id, v.verifierType)}
              disabled={updating === v.id}
            >
              {updating === v.id ? 'جاري...' : (v.verifierType === 'basic' ? 'ترقية إلى متقدم' : 'تنزيل إلى عادي')}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
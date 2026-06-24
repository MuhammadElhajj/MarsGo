// src/pages/Admin/AdminMissions/AdminMissions.jsx
import { useState, lazy, Suspense, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import Button from '../../../components/GeneralComponents/Button/Button';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import './AdminMissions.css';

// ✅ تحميل المكونات بشكل lazy
const MissionList = lazy(() => import('../../../components/AdminCoponent/AdminMissions/MissionList/MissionList'));
const MissionForm = lazy(() => import('../../../components/AdminCoponent/AdminMissions/MissionForm/MissionForm'));

export default function AdminMissions() {
  const { userData } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState(null);

  // جلب المهام من Firestore
  const fetchMissions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'quests'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const missionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMissions(missionsData);
    } catch (error) {
      console.error('خطأ في جلب المهام:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ إضافة مهمة جديدة (تستقبل id و data، وتتجاهل id)
  const handleAddMission = async (id, missionData) => {
    try {
      const newMission = {
        ...missionData,
        startDate: new Date().toISOString(), // تاريخ البداية الآن
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'quests'), newMission);
      await fetchMissions();
      setShowForm(false);
    } catch (error) {
      console.error('خطأ في إضافة المهمة:', error);
    }
  };

  // ✅ تحديث مهمة موجودة
  const handleUpdateMission = async (id, missionData) => {
    try {
      await updateDoc(doc(db, 'quests', id), {
        ...missionData,
        updatedAt: new Date().toISOString(),
      });
      await fetchMissions();
      setEditingMission(null);
      setShowForm(false);
    } catch (error) {
      console.error('خطأ في تحديث المهمة:', error);
    }
  };

  // حذف مهمة
  const handleDeleteMission = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      try {
        await deleteDoc(doc(db, 'quests', id));
        await fetchMissions();
      } catch (error) {
        console.error('خطأ في حذف المهمة:', error);
      }
    }
  };

  // تبديل حالة التفعيل
  const handleToggleActive = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'quests', id), {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString(),
      });
      await fetchMissions();
    } catch (error) {
      console.error('خطأ في تحديث حالة المهمة:', error);
    }
  };

  // فتح نموذج التعديل
  const handleEditMission = (mission) => {
    setEditingMission(mission);
    setShowForm(true);
  };

  // إغلاق النموذج
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMission(null);
  };

  // تحميل البيانات عند فتح الصفحة
  useEffect(() => {
    fetchMissions();
  }, []);

  if (!userData || userData.role !== 'admin') {
    return <div className="admin-missions__unauthorized">غير مصرح لك بالوصول</div>;
  }

  return (
    <div className="admin-missions" dir="rtl">
      <div className="admin-missions__header">
        <h2 className="admin-missions__title">🎯 إدارة المهام</h2>
        <div className="admin-missions__actions">
          <Button onClick={fetchMissions} variant="secondary" disabled={loading}>
            <FiRefreshCw className={loading ? 'spinning' : ''} /> تحديث
          </Button>
          <Button onClick={() => { setEditingMission(null); setShowForm(true); }} variant="primary">
            <FiPlus /> إضافة مهمة جديدة
          </Button>
        </div>
      </div>

      {showForm && (
        <Suspense fallback={<Loading text="جاري تحميل النموذج..." />}>
          <MissionForm
            mission={editingMission}
            onSave={editingMission ? handleUpdateMission : handleAddMission}
            onCancel={handleCloseForm}
            loading={loading}
          />
        </Suspense>
      )}

      <Suspense fallback={<Loading text="جاري تحميل المهام..." />}>
        <MissionList
          missions={missions}
          loading={loading}
          onEdit={handleEditMission}
          onDelete={handleDeleteMission}
          onToggleActive={handleToggleActive}
        />
      </Suspense>
    </div>
  );
}
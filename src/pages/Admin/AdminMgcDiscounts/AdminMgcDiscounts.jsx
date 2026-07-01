// src/pages/Admin/AdminMgcDiscounts/AdminMgcDiscounts.jsx
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import { FiPlus, FiTrash2, FiSave, FiEdit, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminMgcDiscounts.css';

const DEFAULT_TIERS = [
  { min: 100, max: 500, discount: 0 },
  { min: 501, max: 2000, discount: 5 },
  { min: 2001, max: 5000, discount: 7 },
  { min: 5001, max: 10000, discount: 9 },
];

export default function AdminMgcDiscounts() {
  const { userData } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newTier, setNewTier] = useState({ min: '', max: '', discount: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  // التحقق من الصلاحية (المدقق المالي أو المدير)
  const isAuthorized = userData?.role === 'finance_verifier' || userData?.role === 'admin';

  // جلب الشرائح من Firestore
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const docRef = doc(db, 'mgcDiscountTiers', 'default');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.tiers && Array.isArray(data.tiers) && data.tiers.length > 0) {
            setTiers(data.tiers);
          } else {
            setTiers(DEFAULT_TIERS);
          }
        } else {
          setTiers(DEFAULT_TIERS);
        }
      } catch (error) {
        console.error('خطأ في جلب شرائح الخصم:', error);
        toast.error('فشل تحميل الشرائح، سيتم استخدام القيم الافتراضية');
        setTiers(DEFAULT_TIERS);
      } finally {
        setLoading(false);
      }
    };
    fetchTiers();
  }, []);

  // التحقق من عدم تداخل الشرائح
  const validateTiers = (newTiers) => {
    const sorted = [...newTiers].sort((a, b) => a.min - b.min);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].max >= sorted[i + 1].min) {
        return false;
      }
    }
    return true;
  };

  // حفظ الشرائح في Firestore
  const saveTiers = async () => {
    if (!validateTiers(tiers)) {
      toast.error('يوجد تداخل بين الشرائح. تأكد من أن كل شريحة تبدأ حيث تنتهي السابقة.');
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, 'mgcDiscountTiers', 'default');
      await setDoc(docRef, { tiers, updatedAt: new Date().toISOString() });
      toast.success('تم حفظ شرائح الخصم بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ الشرائح:', error);
      toast.error('فشل حفظ الشرائح');
    } finally {
      setSaving(false);
    }
  };

  // إضافة شريحة جديدة
  const handleAddTier = () => {
    const min = parseInt(newTier.min);
    const max = parseInt(newTier.max);
    const discount = parseFloat(newTier.discount);

    if (isNaN(min) || isNaN(max) || isNaN(discount)) {
      toast.error('الرجاء إدخال قيم صحيحة');
      return;
    }

    if (min < 0 || max < 0 || discount < 0 || discount > 100) {
      toast.error('يجب أن تكون القيم موجبة ونسبة الخصم بين 0 و 100');
      return;
    }

    if (min >= max) {
      toast.error('الحد الأدنى يجب أن يكون أقل من الحد الأعلى');
      return;
    }

    // التحقق من التداخل مع الشرائح الحالية
    const overlapping = tiers.some(t => 
      (min >= t.min && min <= t.max) || 
      (max >= t.min && max <= t.max) ||
      (min <= t.min && max >= t.max)
    );

    if (overlapping) {
      toast.error('هذه الشريحة تتداخل مع شريحة موجودة');
      return;
    }

    setTiers([...tiers, { min, max, discount }]);
    setNewTier({ min: '', max: '', discount: '' });
    setShowAddForm(false);
    toast.success('تمت إضافة الشريحة');
  };

  // حذف شريحة
  const handleDeleteTier = (index) => {
    if (tiers.length <= 1) {
      toast.error('لا يمكن حذف آخر شريحة');
      return;
    }
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه الشريحة؟');
    if (confirmed) {
      setTiers(tiers.filter((_, i) => i !== index));
      toast.success('تم حذف الشريحة');
    }
  };

  // تعديل شريحة
  const handleEditTier = (index, field, value) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    setTiers(updated);
  };

  // استعادة القيم الافتراضية
  const handleResetDefault = () => {
    if (window.confirm('سيتم استعادة الشرائح الافتراضية. هل أنت متأكد؟')) {
      setTiers(DEFAULT_TIERS);
      toast.success('تم استعادة الشرائح الافتراضية');
    }
  };

  if (loading) {
    return <div className="admin-mgc-loading">جاري تحميل شرائح الخصم...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="admin-mgc-unauthorized">
        <p>غير مصرح لك بالوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="admin-mgc-discounts" dir="rtl">
      <div className="admin-mgc-header">
       
        <h2>إدارة شرائح خصم MGC</h2>
      </div>

      <div className="admin-mgc-description">
        <p>قم بتحديد الشرائح التي تحدد نسبة الخصم بناءً على الكمية المشتراة من عملات MGC.</p>
        <p className="admin-mgc-hint">مثال: من 100 إلى 500 MGC خصم 0%، من 501 إلى 2000 خصم 5% ... إلخ</p>
      </div>

      <div className="admin-mgc-toolbar">
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="secondary" size="sm">
          <FiPlus /> إضافة شريحة
        </Button>
        <Button onClick={handleResetDefault} variant="outline" size="sm">
          استعادة الافتراضي
        </Button>
        <Button onClick={saveTiers} disabled={saving} variant="primary" size="sm">
          <FiSave /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      {showAddForm && (
        <div className="admin-mgc-add-form card">
          <h4>إضافة شريحة جديدة</h4>
          <div className="admin-mgc-form-row">
            <Input
              label="الحد الأدنى"
              type="number"
              value={newTier.min}
              onChange={(e) => setNewTier({ ...newTier, min: e.target.value })}
              placeholder="مثال: 501"
            />
            <Input
              label="الحد الأعلى"
              type="number"
              value={newTier.max}
              onChange={(e) => setNewTier({ ...newTier, max: e.target.value })}
              placeholder="مثال: 2000"
            />
            <Input
              label="نسبة الخصم (%)"
              type="number"
              value={newTier.discount}
              onChange={(e) => setNewTier({ ...newTier, discount: e.target.value })}
              placeholder="مثال: 5"
            />
          </div>
          <div className="admin-mgc-form-actions">
            <Button onClick={handleAddTier} variant="primary" size="sm">إضافة</Button>
            <Button onClick={() => { setShowAddForm(false); setNewTier({ min: '', max: '', discount: '' }); }} variant="danger" size="sm">إلغاء</Button>
          </div>
        </div>
      )}

      <div className="admin-mgc-table-wrapper">
        <table className="admin-mgc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>الحد الأدنى</th>
              <th>الحد الأعلى</th>
              <th>نسبة الخصم</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <input
                    type="number"
                    className="admin-mgc-input"
                    value={tier.min}
                    onChange={(e) => handleEditTier(index, 'min', e.target.value)}
                    min="0"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="admin-mgc-input"
                    value={tier.max}
                    onChange={(e) => handleEditTier(index, 'max', e.target.value)}
                    min="0"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="admin-mgc-input"
                    value={tier.discount}
                    onChange={(e) => handleEditTier(index, 'discount', e.target.value)}
                    min="0"
                    max="100"
                  />
                </td>
                <td>
                  <button
                    className="admin-mgc-delete-btn"
                    onClick={() => handleDeleteTier(index)}
                    title="حذف الشريحة"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tiers.length === 0 && (
        <div className="admin-mgc-empty">لا توجد شرائح مضافة. أضف شريحة جديدة.</div>
      )}
    </div>
  );
}
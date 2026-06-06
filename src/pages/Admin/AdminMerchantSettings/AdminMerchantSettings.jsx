import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
import './AdminMerchantSettings.css';

export default function AdminMerchantSettings() {
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'merchantSettings', 'default');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDiscountPercent(docSnap.data().discountPercent || 0);
      } else {
        // إنشاء وثيقة افتراضية إذا لم توجد (نسبة خصم 10%)
        setDoc(docRef, { discountPercent: 10, updatedAt: new Date() });
        setDiscountPercent(10);
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      showToast('خطأ في تحميل الإعدادات', 'error');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    const percent = parseFloat(discountPercent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      showToast('يجب إدخال نسبة بين 0 و 100', 'error');
      return;
    }
    setSaving(true);
    try {
      const docRef = doc(db, 'merchantSettings', 'default');
      await updateDoc(docRef, {
        discountPercent: percent,
        updatedAt: new Date(),
      });
      showToast('تم حفظ نسبة الخصم بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('فشل حفظ النسبة', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-merchant-settings-loading">جاري التحميل...</div>;

  return (
    <div className="admin-merchant-settings">
      <h2>🏷️ إعدادات خصم التجار</h2>
      <div className="card">
        <Input
          label="نسبة الخصم (%)"
          type="number"
          step="1"
          min="0"
          max="100"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
        />
        <p className="note">
          سيتم تطبيق هذا الخصم تلقائياً على جميع الخدمات للمستخدمين من نوع <strong>"تاجر"</strong>.
        </p>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'جاري الحفظ...' : '💾 حفظ النسبة'}
        </Button>
      </div>
    </div>
  );
}
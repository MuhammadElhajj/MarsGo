// src/pages/User/AddPhonePage/AddPhonePage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
import './AddPhonePage.css';

export default function AddPhonePage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState(userData?.whatsappNumber || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 8) {
      showToast('الرجاء إدخال رقم صحيح (مثال: 963939454690)', 'error');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        whatsappNumber: cleaned,
      });
      showToast('✅ تم حفظ رقم واتساب بنجاح', 'success');
      navigate('/topup'); // العودة إلى صفحة الإيداع
    } catch (error) {
      console.error(error);
      showToast('فشل حفظ الرقم', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-phone-page" dir="rtl">
      <div className="add-phone-page__header">
        {/* <GoBackButton text="رجوع" /> */}
        <h2 className="add-phone-page__title">📞 إضافة رقم واتساب</h2>
      </div>

      <div className="add-phone-page__card">
        <p className="add-phone-page__desc">
          يرجى إضافة رقم واتساب الخاص بك لضمان التواصل السريع بخصوص طلبات الإيداع.
        </p>
        <form onSubmit={handleSave} className="add-phone-page__form">
          <Input
            label="رقم واتساب (بدون + أو مسافات)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="مثال: 963939454690"
            dir="ltr"
            required
          />
          <div className="add-phone-page__actions">
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : '💾 حفظ الرقم'}
            </Button>
            <Button type="button" variant="danger" onClick={() => navigate('/topup')}>
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
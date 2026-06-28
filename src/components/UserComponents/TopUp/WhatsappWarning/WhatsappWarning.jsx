import { useNavigate } from 'react-router-dom';
import Button from '../../../GeneralComponents/Button/Button';
import "./WhatsappWarning.css"
export default function WhatsappWarning() {
  const navigate = useNavigate();
  return (
    <div className="whatsapp-warning-box">
      <div className="whatsapp-warning-text">
        <strong>رقم واتساب غير موجود</strong>
        <p>لضمان التواصل السريع بخصوص طلبات الإيداع، يرجى إضافة رقم واتساب الخاص بك أولاً.</p>
      </div>
      <Button onClick={() => navigate('/add-phone')} variant="primary" className="whatsapp-warning-btn">
         إضافة رقم واتساب
      </Button>
    </div>
  );
}
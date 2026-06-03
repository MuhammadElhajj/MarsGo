import toast from 'react-hot-toast';
import './ToastNotification.css';

/**
 * دالة لعرض إشعار منبثق
 * @param {string} message - نص الرسالة
 * @param {string} type - نوع الإشعار: 'success', 'error', 'loading', 'info'
 * @param {number} duration - مدة الظهور بالمللي ثانية (الافتراضي 3000)
 * @param {object} options - خيارات إضافية (مثل position)
 */
export const showToast = (message, type = 'success', duration = 3000, options = {}) => {
  const defaultOptions = { duration, ...options };
  
  switch (type) {
    case 'success':
      toast.success(message, defaultOptions);
      break;
    case 'error':
      toast.error(message, defaultOptions);
      break;
    case 'loading':
      toast.loading(message, defaultOptions);
      break;
    case 'info':
    default:
      toast(message, defaultOptions);
      break;
  }
};

/**
 * دالة لإخفاء جميع الإشعارات (اختياري)
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * المكون الرئيسي (اختياري، للاستخدام كـ JSX إذا احتجت)
 */
export default function ToastNotification({ message, type, onClose }) {
  return (
    <div className={`toast-notification toast-notification--${type}`}>
      <div className="toast-notification__icon">
        {type === 'success' && '✅'}
        {type === 'error' && '❌'}
        {type === 'loading' && '⏳'}
        {type === 'info' && 'ℹ️'}
      </div>
      <div className="toast-notification__message">{message}</div>
      <button className="toast-notification__close" onClick={onClose}>✕</button>
    </div>
  );
}
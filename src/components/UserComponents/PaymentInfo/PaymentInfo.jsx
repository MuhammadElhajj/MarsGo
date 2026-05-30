import { usePaymentSettings } from '../../../context/PaymentSettingsContext';
import { FiCopy, FiDownload, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PaymentInfo.css';

export default function PaymentInfo() {
  const { settings, loading } = usePaymentSettings();

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label} بنجاح`);
  };

  const downloadQR = () => {
    if (!settings?.qrImageBase64) return;
    const link = document.createElement('a');
    link.href = settings.qrImageBase64;
    link.download = 'qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تحميل رمز QR');
  };

  if (loading) return <div className="payment-info loading">جاري التحميل...</div>;
  if (!settings) return null;

  return (
    <div className="payment-info">
      <h3>💳 معلومات الدفع</h3>
      
      {settings.qrImageBase64 && (
        <div className="qr-section">
          <div className="qr-image">
            <img src={settings.qrImageBase64} alt="رمز الدفع السريع" />
          </div>
          <button onClick={downloadQR} className="btn-icon">
            <FiDownload /> تحميل الصورة
          </button>
        </div>
      )}

      <div className="account-details">
        {settings.accountNumber && (
          <div className="detail-row">
            <strong>رقم الحساب:</strong>
            <code>{settings.accountNumber}</code>
            <button onClick={() => copyToClipboard(settings.accountNumber, 'رقم الحساب')} className="copy-btn">
              <FiCopy />
            </button>
          </div>
        )}
        {settings.accountName && (
          <div className="detail-row">
            <strong>اسم المستفيد:</strong>
            <span>{settings.accountName}</span>
            <button onClick={() => copyToClipboard(settings.accountName, 'اسم المستفيد')} className="copy-btn">
              <FiCopy />
            </button>
          </div>
        )}
        {settings.bankName && (
          <div className="detail-row">
            <strong>البنك:</strong>
            <span>{settings.bankName}</span>
          </div>
        )}
      </div>

      {settings.link && (
        <a href={settings.link} target="_blank" rel="noopener noreferrer" className="payment-link">
          <FiExternalLink /> رابط دفع إلكتروني
        </a>
      )}
    </div>
  );
}
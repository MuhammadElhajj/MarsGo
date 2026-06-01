import { usePaymentSettings } from '../../../context/PaymentSettingsContext';
import { FiCopy, FiDownload, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
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

  if (loading) return <div className="payment-info__loading">جاري التحميل...</div>;
  if (!settings) return null;

  return (
    <div className="payment-info">
      <div className="payment-info__card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <GoBackButton text="رجوع" />
          <h3 className="payment-info__title" style={{ marginBottom: 0 }}>💳 معلومات الدفع</h3>
          <div style={{ width: '70px' }}></div> {/* للحفاظ على التوازن */}
        </div>

        {settings.qrImageBase64 && (
          <div className="payment-info__qr">
            <img
              src={settings.qrImageBase64}
              alt="رمز الدفع السريع"
              className="payment-info__qr-image"
            />
            <button onClick={downloadQR} className="payment-info__download-btn" style={{ marginTop: '0.5rem' }}>
              <FiDownload /> تحميل الصورة
            </button>
          </div>
        )}

        <div className="payment-info__details">
          {settings.accountNumber && (
            <div className="payment-info__detail-row">
              <strong>رقم الحساب:</strong>
              <code>{settings.accountNumber}</code>
              <button
                onClick={() => copyToClipboard(settings.accountNumber, 'رقم الحساب')}
                className="payment-info__copy-btn"
              >
                <FiCopy />
              </button>
            </div>
          )}
          {settings.accountName && (
            <div className="payment-info__detail-row">
              <strong>اسم المستفيد:</strong>
              <span>{settings.accountName}</span>
              <button
                onClick={() => copyToClipboard(settings.accountName, 'اسم المستفيد')}
                className="payment-info__copy-btn"
              >
                <FiCopy />
              </button>
            </div>
          )}
          {settings.bankName && (
            <div className="payment-info__detail-row">
              <strong>البنك:</strong>
              <span>{settings.bankName}</span>
            </div>
          )}
        </div>

        {settings.link && (
          <a
            href={settings.link}
            target="_blank"
            rel="noopener noreferrer"
            className="payment-info__link"
          >
            <FiExternalLink /> رابط دفع إلكتروني
          </a>
        )}
      </div>
    </div>
  );
}
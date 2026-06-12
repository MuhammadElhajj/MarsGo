import { useState } from 'react';
import "./TopUpMethods.css";
import { FiCopy, FiDownload } from 'react-icons/fi';

export default function TopUpMethods({ methods, selectedMethod, onSelectMethod, currentMethod }) {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, fieldId) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadQR = (qrBase64) => {
    if (!qrBase64) return;
    const link = document.createElement('a');
    link.href = qrBase64;
    link.download = `qr_${selectedMethod}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasValidQR = currentMethod?.qrCode && currentMethod.qrCode.trim() !== '';

  return (
    <div className="topup-page__beneficiary">
      <h3>معلومات التحويل</h3>
      <div className="beneficiary-methods">
        {methods.map(method => (
          <button
            key={method.id}
            className={`method-tab ${selectedMethod === method.id ? 'active' : ''}`}
            onClick={() => onSelectMethod(method.id)}
          >
            <span className="method-icon">{method.icon}</span>
            {method.name}
          </button>
        ))}
      </div>

      <div className="beneficiary-details">
        {selectedMethod === 'usdt' && (
          <>
            <div className="detail-row">
              <strong> الشبكة:</strong> {currentMethod?.network || 'TRC20'}
            </div>
            <div className="detail-row">
              <strong> عنوان المحفظة:</strong>
              <div className="detail-value-wrapper">
                <code className="detail-value">{currentMethod?.address || '—'}</code>
                {currentMethod?.address && (
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(currentMethod.address, 'address')}
                    title="نسخ العنوان"
                  >
                    <FiCopy /> {copiedField === 'address' ? 'تم النسخ!' : 'نسخ'}
                  </button>
                )}
              </div>
            </div>
            {hasValidQR && (
              <div className="qr-code">
                {/* ✅ تحسين صورة QR: lazy loading + async decoding */}
                <img 
                  src={currentMethod.qrCode} 
                  alt="QR Code"
                  loading="lazy"
                  decoding="async"
                />
                <button
                  className="download-qr-btn"
                  onClick={() => downloadQR(currentMethod.qrCode)}
                  title="تحميل QR Code"
                >
                  <FiDownload /> تحميل QR
                </button>
              </div>
            )}
          </>
        )}

        {(selectedMethod === 'shamCash' || selectedMethod === 'siretelCash') && (
          <>
            <div className="detail-row">
              <strong> اسم المستفيد:</strong>
              <span className="detail-value">{currentMethod?.accountName || '—'}</span>
            </div>
            <div className="detail-row">
              <strong> رقم الحساب/الهاتف:</strong>
              <div className="detail-value-wrapper">
                <code className="detail-value">{currentMethod?.accountNumber || '—'}</code>
                {currentMethod?.accountNumber && (
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(currentMethod.accountNumber, 'accountNumber')}
                    title="نسخ الرقم"
                  >
                    <FiCopy /> {copiedField === 'accountNumber' ? 'تم النسخ!' : 'نسخ'}
                  </button>
                )}
              </div>
            </div>
            {hasValidQR && (
              <div className="qr-code">
                {/* ✅ تحسين صورة QR: lazy loading + async decoding */}
                <img 
                  src={currentMethod.qrCode} 
                  alt="QR Code"
                  loading="lazy"
                  decoding="async"
                />
                <button
                  className="download-qr-btn"
                  onClick={() => downloadQR(currentMethod.qrCode)}
                  title="تحميل QR Code"
                >
                  <FiDownload /> تحميل QR
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
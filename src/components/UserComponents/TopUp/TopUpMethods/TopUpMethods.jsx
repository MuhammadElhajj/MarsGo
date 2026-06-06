export default function TopUpMethods({ methods, selectedMethod, onSelectMethod, currentMethod }) {
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
            <p><strong>🔗 الشبكة:</strong> {currentMethod?.network || 'TRC20'}</p>
            <p><strong>🏦 عنوان المحفظة:</strong> <code>{currentMethod?.address || '—'}</code></p>
            {currentMethod?.qrCode && (
              <div className="qr-code">
                <img src={currentMethod.qrCode} alt="QR Code" />
              </div>
            )}
          </>
        )}
        {(selectedMethod === 'shamCash' || selectedMethod === 'siretelCash') && (
          <>
            <p><strong>👤 اسم المستفيد:</strong> {currentMethod?.accountName || '—'}</p>
            <p><strong>📞 رقم الحساب/الهاتف:</strong> {currentMethod?.accountNumber || '—'}</p>
            {currentMethod?.qrCode && (
              <div className="qr-code">
                <img src={currentMethod.qrCode} alt="QR Code" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
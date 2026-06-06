import Button from '../../../GeneralComponents/Button/Button';
import Input from '../../../GeneralComponents/Input/Input';
import ImageUpload from '../../../GeneralComponents/ImageUpload/ImageUpload';
import './TopUpForm.css';
export default function TopUpForm({
  amount,
  setAmount,
  amountIsInvalid,
  getMinDepositDisplay,
  transactionNumber,
  setTransactionNumber,
  senderName,
  setSenderName,
  receiptImage,
  setReceiptImage,
  loading,
  onSubmit,
}) {
  return (
    <div className="topup-page__form">
      <h3>تقديم طلب شحن</h3>
      <form onSubmit={onSubmit}>
        <div className="input-group amount-input-group">
          <Input
            label="المبلغ (دولار أمريكي)"
            type="number"
            step="1"
            min="3"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className={amountIsInvalid ? 'input-error' : ''}
          />
          {amountIsInvalid && (
            <div className="input-error-message">
              ⚠️ الحد الأدنى للإيداع هو {getMinDepositDisplay()}
            </div>
          )}
        </div>

        <Input
          label="رقم العملية (رقم التحويل المرجعي)"
          value={transactionNumber}
          onChange={(e) => setTransactionNumber(e.target.value)}
          placeholder="مثال: TRC20-123456"
          required
        />
        <Input
          label="اسم المرسل (الاسم الذي أرسل به التحويل)"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          required
        />
        <ImageUpload
          label="إيصال الدفع (صورة)"
          onUploadComplete={setReceiptImage}
          maxSizeMB={0.5}
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الإرسال...' : 'تقديم طلب ايداع'}
        </Button>
      </form>
    </div>
  );
}
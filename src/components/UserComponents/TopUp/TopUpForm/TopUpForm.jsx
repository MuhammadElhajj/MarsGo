import Button from '../../../GeneralComponents/Button/Button';
import Input from '../../../GeneralComponents/Input/Input';
import './TopUpForm.css';

export default function TopUpForm({
  amount,
  setAmount,
  amountIsInvalid,
  getMinDepositDisplay,
  transactionNumber,
  setTransactionNumber,
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
          placeholder="رقم عملية التحويل"
          required
        />
        {/* تم إزالة حقل اسم المرسل */}
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الإرسال...' : 'تقديم طلب ايداع'}
        </Button>
      </form>
    </div>
  );
}
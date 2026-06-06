// src/components/Generic/UnifiedCheckout/forms/GamingAppsForm.jsx
import Input from '../../../GeneralComponents/Input/Input';

export default function GamingAppsForm({ playerId, setPlayerId, displayPrice, pkg, balance }) {
  return (
    <>
      <Input
        label="المعرف (ID اللاعب / رقم الحساب)"
        value={playerId}
        onChange={(e) => setPlayerId(e.target.value)}
        required
      />
      <div className="unified-checkout__price-summary">
        <span>المبلغ المطلوب:</span>
        <strong>{displayPrice}</strong>
        {pkg?.discount > 0 && <small> (بعد خصم {pkg.discount}%)</small>}
      </div>
      <div className="unified-checkout__balance-info">
        رصيدك الحالي: <strong>{balance.toFixed(2)} $</strong>
      </div>
    </>
  );
}
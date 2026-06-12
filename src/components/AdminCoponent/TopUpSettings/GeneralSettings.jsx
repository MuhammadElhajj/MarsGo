import Input from '../../GeneralComponents/Input/Input';

export default function GeneralSettings({ minDeposit, supportWhatsApp, onGeneralChange }) {
  return (
    <div className="general-settings">
      <h3>الإعدادات العامة</h3>
      <div className="general-row">
        <Input 
          label="الحد الأدنى للإيداع (دولار أمريكي)" 
          type="number" 
          step="1" 
          min="1" 
          value={minDeposit} 
          onChange={(e) => onGeneralChange('minDeposit', parseInt(e.target.value) || 3)} 
        />
        <Input 
          label="رقم واتساب الدعم (بدون + أو مسافات)" 
          value={supportWhatsApp} 
          onChange={(e) => onGeneralChange('supportWhatsApp', e.target.value.replace(/\D/g, ''))} 
          placeholder="963939454690" 
        />
      </div>
    </div>
  );
}
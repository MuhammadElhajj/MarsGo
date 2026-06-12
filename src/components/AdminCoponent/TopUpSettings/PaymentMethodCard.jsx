import { lazy, Suspense } from 'react';
import Input from '../../GeneralComponents/Input/Input';
import Button from '../../GeneralComponents/Button/Button';
import Loading from '../../GeneralComponents/Loading/Loading';

// Lazy load ImageUpload (مكون ثقيل)
const ImageUpload = lazy(() => import('../../GeneralComponents/ImageUpload/ImageUpload'));

export default function PaymentMethodCard({ 
  method,           // 'usdt', 'shamCash', 'siretelCash'
  title, 
  icon, 
  data, 
  onToggle, 
  onFieldChange 
}) {
  const isUSDT = method === 'usdt';
  const isShamOrSirel = method === 'shamCash' || method === 'siretelCash';

  return (
    <div className="method-card">
      <div className="method-card__header">
        <h3>{icon} {title}</h3>
        <label className="toggle-switch">
          <input type="checkbox" checked={data.enabled} onChange={(e) => onToggle(method, e.target.checked)} />
          <span className="toggle-slider"></span>
        </label>
      </div>
      <div className="method-card__body">
        <Input 
          label="اسم التطبيق الذي سيظهر للمستخدم" 
          value={data.displayName || ''} 
          onChange={(e) => onFieldChange(method, 'displayName', e.target.value)} 
        />
        
        <div className="qr-upload">
          <label>شعار التطبيق (صورة)</label>
          <Suspense fallback={<div>جاري تحميل رافع الصور...</div>}>
            <ImageUpload 
              onUploadComplete={(url) => onFieldChange(method, 'logoImage', url)} 
              maxSizeMB={0.5} 
              storagePath={`topup/${method}`} 
            />
          </Suspense>
          {data.logoImage && (
            <img src={data.logoImage} alt={`شعار ${title}`} style={{ width: '60px', marginTop: '8px' }} />
          )}
        </div>

        {isUSDT && (
          <>
            <Input 
              label="عنوان المحفظة (Address)" 
              value={data.address || ''} 
              onChange={(e) => onFieldChange(method, 'address', e.target.value)} 
              placeholder="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" 
            />
            <div className="form-field">
              <label>الشبكة</label>
              <select value={data.network || 'TRC20'} onChange={(e) => onFieldChange(method, 'network', e.target.value)}>
                <option value="TRC20">TRC20 (Tron) - موصى به</option>
                <option value="BEP20">BEP20 (BSC)</option>
                <option value="ERC20">ERC20 (Ethereum)</option>
              </select>
            </div>
          </>
        )}

        {isShamOrSirel && (
          <>
            <Input 
              label="اسم المستفيد" 
              value={data.accountName || ''} 
              onChange={(e) => onFieldChange(method, 'accountName', e.target.value)} 
              placeholder="الاسم الكامل للمستفيد" 
            />
            <Input 
              label="رقم الحساب / الهاتف" 
              value={data.accountNumber || ''} 
              onChange={(e) => onFieldChange(method, 'accountNumber', e.target.value)} 
              placeholder="09XXXXXXXX" 
            />
          </>
        )}

        <div className="qr-upload">
          <label>صورة QR Code (اختياري)</label>
          <Suspense fallback={<div>جاري التحميل...</div>}>
            <ImageUpload 
              onUploadComplete={(url) => onFieldChange(method, 'qrCode', url)} 
              maxSizeMB={0.5} 
              storagePath={`topup/${method}/qr`} 
            />
          </Suspense>
          {data.qrCode && (
            <img src={data.qrCode} alt="QR" style={{ width: '80px', marginTop: '8px' }} />
          )}
        </div>
      </div>
    </div>
  );
}
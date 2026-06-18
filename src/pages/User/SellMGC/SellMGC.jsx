// src/pages/User/SellMGC/SellMGC.jsx
import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import { FiDollarSign, FiZap, FiLock, FiUnlock, FiTrendingUp, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './SellMGC.css';

export default function SellMGC() {
  const { userData } = useAuth();
  const { 
    mgcBalance, 
    referralBalance, 
    balance, 
    sellMgc, 
    getMgcSalesHistory 
  } = useAppStore();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // جلب سجل البيع
  useEffect(() => {
    const loadHistory = async () => {
      if (!userData) return;
      const sales = await getMgcSalesHistory();
      setHistory(sales);
      setHistoryLoading(false);
    };
    loadHistory();
  }, [userData, getMgcSalesHistory]);

  const availableBalance = mgcBalance; // يمكن بيعها
  const lockedBalance = referralBalance || 0; // محجوزة (مثال: من الإحالات)
  const totalBalance = availableBalance + lockedBalance;

  const handleSell = async () => {
    const mgcAmount = parseFloat(amount);
    if (!mgcAmount || mgcAmount <= 0) {
      toast.error('الرجاء إدخال كمية صحيحة');
      return;
    }
    if (mgcAmount > availableBalance) {
      toast.error(`الرصيد المتاح للبيع هو ${availableBalance} MGC فقط`);
      return;
    }

    setLoading(true);
    const success = await sellMgc(mgcAmount);
    setLoading(false);
    if (success) {
      setAmount('');
      // تحديث السجل
      const sales = await getMgcSalesHistory();
      setHistory(sales);
      toast.success(`✅ تم بيع ${mgcAmount} MGC بنجاح!`);
    }
  };

  const estimatedUsd = amount ? (parseFloat(amount) * 0.007).toFixed(2) : '0.00';

  return (
    <div className="sell-mgc-page" dir="rtl">
      <div className="sell-mgc__header">
        <GoBackButton text="رجوع" />
        <h1>
          <FiDollarSign className="header-icon" style={{ color: '#f59e0b' }} />
          بيع عملات MGC
        </h1>
      </div>

      {/* بطاقة الرصيد الإجمالي */}
      <div className="sell-mgc__balance-summary">
        <div className="balance-item total">
          <span className="balance-label">إجمالي الرصيد</span>
          <span className="balance-value">{totalBalance} MGC</span>
        </div>
        <div className="balance-item available">
          <FiUnlock className="balance-icon" style={{ color: '#10b981' }} />
          <span className="balance-label">متاح للبيع</span>
          <span className="balance-value">{availableBalance} MGC</span>
        </div>
        <div className="balance-item locked">
          <FiLock className="balance-icon" style={{ color: '#f59e0b' }} />
          <span className="balance-label">محجوز (غير قابل للصرف)</span>
          <span className="balance-value">{lockedBalance} MGC</span>
        </div>
      </div>

      {/* سعر البيع */}
      <div className="sell-mgc__rate-info">
        <FiTrendingUp style={{ color: '#8b5cf6', marginLeft: '0.5rem' }} />
        <span>سعر البيع: <strong>100 MGC = 0.70 $</strong> (خصم 30%)</span>
      </div>

      {/* نموذج البيع */}
      <div className="sell-mgc__form">
        <div className="sell-mgc__input-group">
          <label>الكمية المراد بيعها (MGC)</label>
          <div className="input-with-max">
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="أدخل عدد MGC"
              className="sell-input"
            />
            <button 
              className="max-btn"
              onClick={() => setAmount(String(availableBalance))}
              disabled={availableBalance === 0}
            >
              الحد الأقصى
            </button>
          </div>
        </div>

        <div className="sell-mgc__preview">
          <span>القيمة المقدرة:</span>
          <strong>{estimatedUsd} $</strong>
        </div>

        <Button
          onClick={handleSell}
          disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance}
          className="sell-btn"
        >
          {loading ? '⏳ جاري البيع...' : `💸 بيع ${amount || 0} MGC`}
        </Button>
      </div>

      {/* سجل عمليات البيع */}
      <div className="sell-mgc__history">
        <h3>
          <FiClock style={{ color: '#8b5cf6', marginLeft: '0.5rem' }} />
          سجل البيع
        </h3>
        {historyLoading ? (
          <p className="history-loading">جاري التحميل...</p>
        ) : history.length === 0 ? (
          <p className="empty-history">لا توجد عمليات بيع حتى الآن</p>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-info">
                  <span className="history-amount">{item.mgcAmount} MGC</span>
                  <span className="history-usd">→ {item.usdReceived.toFixed(2)} $</span>
                </div>
                <div className="history-meta">
                  <span className="history-rate">{item.rate} $/MGC</span>
                  <span className="history-date">{new Date(item.timestamp?.toDate?.() || item.timestamp).toLocaleString('ar-EG')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
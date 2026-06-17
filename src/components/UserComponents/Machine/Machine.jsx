// src/components/UserComponents/Machine/Machine.jsx
import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/store';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiAward, FiStar, FiZap, FiGift } from 'react-icons/fi';
import './Machine.css';

export default function Machine() {
  // ✅ استخدام mgcBalance بدلاً من balance (رصيد MGC)
  const { mgcBalance, pullMachine, userData } = useAppStore(
    useShallow((state) => ({
      mgcBalance: state.mgcBalance,   // رصيد MGC
      pullMachine: state.pullMachine,
      userData: state.userData,
    }))
  );

  const [isSpinning, setIsSpinning] = useState(false);
  const [reward, setReward] = useState(null);
  const [prizeMessage, setPrizeMessage] = useState('');
  const [isPity, setIsPity] = useState(false);
  const [pityCounter, setPityCounter] = useState(userData?.pityCounter || 0);
  const [showResult, setShowResult] = useState(false);
  const [spinHistory, setSpinHistory] = useState([]);

  const SPIN_COST = 75;

  useEffect(() => {
    setPityCounter(userData?.pityCounter || 0);
  }, [userData]);

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setReward(null);
    setPrizeMessage('');
    setShowResult(false);

    const result = await pullMachine();
    if (!result.success) {
      toast.error(result.error || 'حدث خطأ');
      setIsSpinning(false);
      return;
    }

    // تحديث السجل
    setSpinHistory(prev => {
      const newHistory = [{ reward: result.reward, isPity: result.isPity, time: new Date() }, ...prev];
      return newHistory.slice(0, 10);
    });

    // عرض النتيجة مع تأخير بسيط
    setTimeout(() => {
      setReward(result.reward);
      setPrizeMessage(result.prizeMessage);
      setIsPity(result.isPity || false);
      setPityCounter(result.pityCounter);
      setShowResult(true);
      setIsSpinning(false);
    }, 600);
  };

  const getPityText = () => {
    if (pityCounter >= 2) return '🔮 السحب القادم مضمون!';
    if (pityCounter === 1) return '⚡ سحب آخر فاشل والسحب القادم مضمون!';
    return '🎲 جرب حظك';
  };

  const getPityColor = () => {
    if (pityCounter >= 2) return '#f59e0b';
    if (pityCounter === 1) return '#f97316';
    return 'var(--color-text-secondary)';
  };

  return (
    <div className="machine">
      <div className="machine__header">
        <h2 className="machine__title">
          <FiAward className="machine__title-icon" /> ماكينة الحظ
        </h2>
        {/* ✅ عرض رصيد MGC */}
        <div className="machine__balance-badge">
          <FiZap /> {mgcBalance.toFixed(0)} MGC
        </div>
      </div>

      <div className="machine__cost-wrapper">
        <span className="machine__cost-label">تكلفة السحب</span>
        <span className="machine__cost-value">{SPIN_COST} MGC</span>
      </div>

      <div 
        className="machine__pity-status" 
        style={{ color: getPityColor() }}
      >
        {getPityText()}
      </div>

      {/* صندوق النتيجة */}
      <div className={`machine__slot-display ${isSpinning ? 'spinning' : ''} ${showResult ? 'result-shown' : ''}`}>
        {isSpinning ? (
          <div className="machine__spinner">
            <FiRefreshCw className="spin-icon" />
            <span>جاري السحب...</span>
          </div>
        ) : showResult && reward ? (
          <div className={`machine__reward ${isPity ? 'pity' : ''}`}>
            <span className="reward-icon">
              {isPity ? '🎁' : reward.includes('MGC') ? '💰' : reward.includes('XP') ? '⭐' : '🏅'}
            </span>
            <span className="reward-text">{reward}</span>
            {isPity && <span className="pity-badge">تعويض</span>}
          </div>
        ) : (
          <div className="machine__placeholder">
            <FiGift size={40} />
            <span>اضغط على سحب للبدء</span>
          </div>
        )}
      </div>

      {prizeMessage && (
        <div className={`machine__prize-message ${isPity ? 'pity-message' : ''}`}>
          {prizeMessage}
        </div>
      )}

      {/* ✅ زر السحب مع تحقق من mgcBalance */}
      <button
        className={`machine__spin-btn ${isSpinning ? 'spinning' : ''}`}
        onClick={handleSpin}
        disabled={isSpinning || mgcBalance < SPIN_COST}
      >
        {isSpinning ? (
          <>
            <FiRefreshCw className="spin-icon" />
            جاري السحب...
          </>
        ) : (
          <>
            <FiAward />
            سحب ({SPIN_COST} MGC)
          </>
        )}
      </button>

      {/* السجل الأخير */}
      {spinHistory.length > 0 && (
        <div className="machine__history">
          <div className="machine__history-title">آخر السحوبات</div>
          <div className="machine__history-list">
            {spinHistory.map((item, idx) => (
              <div key={idx} className="machine__history-item">
                <span className="history-reward">{item.reward}</span>
                <span className="history-time">{item.time.toLocaleTimeString()}</span>
                {item.isPity && <span className="history-pity">🎁</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="machine__footer">
        <div className="machine__level">
          المستوى: <strong>{userData?.level || 1}</strong>
        </div>
        <div className="machine__xp">
          XP: <strong>{userData?.xp || 0}</strong>
        </div>
        {userData?.title && (
          <div className="machine__title-badge">
            <FiStar /> {userData.title}
          </div>
        )}
      </div>
    </div>
  );
}
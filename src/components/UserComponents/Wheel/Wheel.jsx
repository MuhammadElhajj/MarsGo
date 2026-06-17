// src/components/UserComponents/Wheel/Wheel.jsx
import { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../../store/store';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import './Wheel.css';

// قطاعات الدولاب
const SEGMENTS = [
  { label: '0.5', value: 0.5, color: '#FF6B6B' },
  { label: '1.5', value: 1.5, color: '#4ECDC4' },
  { label: '3', value: 3, color: '#FFE66D' },
  { label: '7', value: 7, color: '#A8E6CF' },
  { label: '15', value: 15, color: '#FF8A5C' },
  { label: '50', value: 50, color: '#6C5B7B' },
  { label: '0.5', value: 0.5, color: '#F8B500' },
  { label: '500', value: 500, color: '#E63946' },
];

export default function Wheel({ onSpinComplete }) {
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [result, setResult] = useState(null);
  const angleRef = useRef(0);
  const isFirstRender = useRef(true);

  // استخراج البيانات من store (المستخدم موجود مسبقاً)
  const { user, balance, spinWheel } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      balance: state.balance,
      spinWheel: state.spinWheel,
    }))
  );

  const SPIN_COST = 0.25;

  // رسم العجلة
  const drawWheel = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const segmentAngle = (2 * Math.PI) / SEGMENTS.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    SEGMENTS.forEach((seg, i) => {
      const startAngle = i * segmentAngle + angle;
      const endAngle = startAngle + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      const midAngle = startAngle + segmentAngle / 2;
      const textRadius = radius * 0.65;
      const x = centerX + Math.cos(midAngle) * textRadius;
      const y = centerY + Math.sin(midAngle) * textRadius;

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(`${seg.label} MGC`, x, y);
      ctx.shadowBlur = 0;
    });

    // الدائرة المركزية
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('اضغط', centerX, centerY - 6);
    ctx.font = 'bold 12px Cairo, sans-serif';
    ctx.fillText('للتدوير', centerX, centerY + 14);
  }, []);

  // تحديث الزاوية
  const updateAngle = useCallback((newAngle) => {
    angleRef.current = newAngle;
    setCurrentAngle(newAngle);
    drawWheel(newAngle);
  }, [drawWheel]);

  // دالة الدوران – تم إزالة التحقق من تسجيل الدخول
  const spin = useCallback(async () => {
    if (isSpinning) return;

    // التحقق من الرصيد فقط
    if (balance < SPIN_COST) {
      toast.error(`رصيدك غير كافٍ! تحتاج ${SPIN_COST} MGC`);
      return;
    }

    setIsSpinning(true);
    setResult(null);

    // استدعاء دالة الدولاب من الـ store
    const result = await spinWheel();

    if (!result.success) {
      setIsSpinning(false);
      return;
    }

    const prize = result.prize;

    // حساب الزاوية للوصول إلى القطاع الفائز
    const targetIndex = SEGMENTS.findIndex(seg => seg.value === prize);
    if (targetIndex === -1) {
      setIsSpinning(false);
      toast.error('حدث خطأ، حاول مجدداً');
      return;
    }

    const segmentAngle = (2 * Math.PI) / SEGMENTS.length;
    const targetAngle = targetIndex * segmentAngle + segmentAngle / 2;
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const totalRotation = extraSpins * 2 * Math.PI + (2 * Math.PI - targetAngle);
    const newAngle = angleRef.current + totalRotation;

    updateAngle(newAngle);

    setTimeout(() => {
      setResult(prize);
      setIsSpinning(false);

      if (onSpinComplete) {
        onSpinComplete(prize);
      }
    }, 4000 + Math.random() * 1000);
  }, [isSpinning, balance, spinWheel, updateAngle, onSpinComplete, SPIN_COST]);

  // إعداد Canvas أول مرة
  useEffect(() => {
    if (isFirstRender.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const size = Math.min(400, window.innerWidth - 40);
        canvas.width = size;
        canvas.height = size;
        drawWheel(0);
        isFirstRender.current = false;
      }
    }
  }, [drawWheel]);

  // إعادة الرسم عند تغير الحجم
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const size = Math.min(400, window.innerWidth - 40);
        canvas.width = size;
        canvas.height = size;
        drawWheel(angleRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel]);

  return (
    <div className="wheel-container">
      <div className="wheel-wrapper">
        <canvas ref={canvasRef} className="wheel-canvas" />
        <div className="wheel-pointer">▼</div>
        <button 
          className="wheel-spin-btn" 
          onClick={spin} 
          disabled={isSpinning}
        >
          {isSpinning ? 'يدور...' : '🔄 دوران'}
        </button>
      </div>

      {result !== null && !isSpinning && (
        <div className={`wheel-result ${result > 0 ? 'win' : 'lose'}`}>
          {result > 0 ? `🎉 ربحت ${result} MGC!` : '😅 حظ أوفر!'}
        </div>
      )}

      <div className="wheel-info">
        <p>💫 سعر الدخول: <strong>{SPIN_COST} MGC</strong></p>
        <p>🏆 الجائزة الكبرى: <strong>500 MGC</strong></p>
        <p>📊 رصيدك الحالي: <strong>{balance.toFixed(2)} MGC</strong></p>
      </div>
    </div>
  );
}
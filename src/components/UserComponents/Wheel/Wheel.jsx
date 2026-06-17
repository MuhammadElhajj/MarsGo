// src/components/UserComponents/Wheel/Wheel.jsx
import { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../../store/store';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import './Wheel.css';

// قطاعات الدولاب
const SEGMENTS = [
  { label: '0.5', value: 0.5, color: '#4F46E5' },
  { label: '1.5', value: 1.5, color: '#0891B2' },
  { label: '3', value: 3, color: '#059669' },
  { label: '7', value: 7, color: '#D97706' },
  { label: '15', value: 15, color: '#DC2626' },
  { label: '50', value: 50, color: '#7C3AED' },
  { label: '0.5', value: 0.5, color: '#4F46E5' },
  { label: '500', value: 500, color: '#B91C1C' },
];

export default function Wheel({ onSpinComplete }) {
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [result, setResult] = useState(null);
  const angleRef = useRef(0);
  const animationRef = useRef(null);
  const duration = 4000;

  const { balance, spinWheel } = useAppStore(
    useShallow((state) => ({
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
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const midAngle = startAngle + segmentAngle / 2;
      const textRadius = radius * 0.68;
      const x = centerX + Math.cos(midAngle) * textRadius;
      const y = centerY + Math.sin(midAngle) * textRadius;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Cairo", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText(seg.label, x, y);
      ctx.shadowBlur = 0;
    });

    // الحلقة الخارجية
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // الدائرة المركزية
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 35);
    gradient.addColorStop(0, '#1E293B');
    gradient.addColorStop(1, '#0F172A');
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 11px "Cairo", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('دوران', centerX, centerY - 4);
    ctx.font = '10px "Cairo", "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('الآن', centerX, centerY + 14);
  }, []);

  // تحديث الزاوية ورسمها
  const updateAngle = useCallback((newAngle) => {
    angleRef.current = newAngle;
    setCurrentAngle(newAngle);
    drawWheel(newAngle);
  }, [drawWheel]);

  // دالة الدوران
  const spin = useCallback(async () => {
    if (isSpinning) return;

    if (balance < SPIN_COST) {
      toast.error(`رصيد غير كافٍ! تحتاج ${SPIN_COST} MGC`);
      return;
    }

    const resultData = await spinWheel();
    if (!resultData.success) {
      setIsSpinning(false);
      return;
    }

    const prize = resultData.prize;
    const targetIndex = resultData.index;

    if (targetIndex === -1 || targetIndex === undefined) {
      toast.error('حدث خطأ، حاول مجدداً');
      return;
    }

    const segmentAngle = (2 * Math.PI) / SEGMENTS.length;
    const targetAngle = targetIndex * segmentAngle + segmentAngle / 2;
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const totalRotation = extraSpins * 2 * Math.PI + (2 * Math.PI - targetAngle);
    const endAngle = angleRef.current + totalRotation;

    setIsSpinning(true);
    setResult(null);
    const startAngle = angleRef.current;
    const startTime = performance.now();

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngleValue = startAngle + (endAngle - startAngle) * easeOut;

      updateAngle(currentAngleValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        updateAngle(endAngle);
        setIsSpinning(false);
        setResult(prize);
        if (onSpinComplete) {
          onSpinComplete(prize);
        }
        if (prize > 0) {
          toast.success(`ربحت ${prize} MGC!`, { duration: 4000 });
        } else {
          toast('حظ أوفر في المرة القادمة', { duration: 3000 });
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isSpinning, balance, spinWheel, updateAngle, onSpinComplete, SPIN_COST]);

  // إعداد Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const size = Math.min(400, window.innerWidth - 40);
      canvas.width = size;
      canvas.height = size;
      drawWheel(0);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
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
          {isSpinning ? 'يدور...' : 'دوران'}
        </button>
      </div>

      {result !== null && !isSpinning && (
        <div className={`wheel-result ${result > 0 ? 'win' : 'lose'}`}>
          {result > 0 ? (
            <span className="result-text">ربحت <strong>{result} MGC</strong></span>
          ) : (
            <span className="result-text">حظ أوفر</span>
          )}
        </div>
      )}

      <div className="wheel-info">
        <div className="wheel-info__item">
          <span className="wheel-info__label">سعر الدخول</span>
          <span className="wheel-info__value">{SPIN_COST} MGC</span>
        </div>
        <div className="wheel-info__item">
          <span className="wheel-info__label">الجائزة الكبرى</span>
          <span className="wheel-info__value">500 MGC</span>
        </div>
        <div className="wheel-info__item">
          <span className="wheel-info__label">رصيدك الحالي</span>
          <span className="wheel-info__value">{balance.toFixed(2)} MGC</span>
        </div>
      </div>
    </div>
  );
}
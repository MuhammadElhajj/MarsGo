import { useState, useEffect } from 'react';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
import { FiAward, FiUsers, FiClock, FiDollarSign, FiCheckCircle, FiUserPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import './SupervisorCandidacyPage.css';

// ===== بيانات وهمية =====
const MOCK_CANDIDATES = [
  { id: 1, name: 'أحمد محمد', avatar: 'https://i.pravatar.cc/150?img=1', joinedAt: 'منذ 3 ساعات' },
  { id: 2, name: 'سارة علي', avatar: 'https://i.pravatar.cc/150?img=2', joinedAt: 'منذ 5 ساعات' },
  { id: 3, name: 'خالد سعد', avatar: 'https://i.pravatar.cc/150?img=3', joinedAt: 'منذ يوم' },
  { id: 4, name: 'نورة يوسف', avatar: 'https://i.pravatar.cc/150?img=4', joinedAt: 'منذ يومين' },
  { id: 5, name: 'فهد العتيبي', avatar: 'https://i.pravatar.cc/150?img=5', joinedAt: 'منذ 3 أيام' },
  { id: 6, name: 'منى إبراهيم', avatar: 'https://i.pravatar.cc/150?img=6', joinedAt: 'منذ 4 أيام' },
];

const MOCK_DRAW = {
  id: 'round-001',
  status: 'open', // 'open' | 'closed' | 'completed'
  startDate: '2025-04-01',
  endDate: '2025-04-10',
  totalEntries: MOCK_CANDIDATES.length,
  fee: 100,
};

export default function SupervisorCandidacyPage() {
  const [draw, setDraw] = useState(MOCK_DRAW);
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [isApplying, setIsApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // محاكاة عد تنازلي (فقط للشكل)
  const [remaining, setRemaining] = useState('3 أيام و 5 ساعات');

  const handleApply = () => {
    if (alreadyApplied) {
      toast('لقد تقدمت بالفعل لهذه القرعة', { icon: '⚠️' });
      return;
    }
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setAlreadyApplied(true);
      setDraw(prev => ({ ...prev, totalEntries: prev.totalEntries + 1 }));
      toast.success('✅ تم التقديم بنجاح! تم خصم 100 MGC من رصيدك');
    }, 1500);
  };

  return (
    <div className="supervisor-candidacy-page" dir="rtl">
     

      {/* البطاقة الرئيسية */}
      <div className="candidacy-card">
        <div className="candidacy-stats">
          <div className="stat-item">
            <FiDollarSign className="stat-icon" />
            <span className="stat-value">{draw.fee} MGC</span>
            <span className="stat-label">رسوم الاشتراك</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <FiUsers className="stat-icon" />
            <span className="stat-value">{draw.totalEntries}</span>
            <span className="stat-label">متقدم</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <FiClock className="stat-icon" />
            <span className="stat-value">{remaining}</span>
            <span className="stat-label">متبقي على السحب</span>
          </div>
        </div>

        <div className="candidacy-status">
          <span className="status-badge open">مفتوحة</span>
          <span className="status-text">القرعة مفتوحة الآن، سارع بالتقديم!</span>
        </div>

        <Button
          onClick={handleApply}
          disabled={isApplying || alreadyApplied}
          variant="primary"
          className="apply-button"
        >
          {isApplying ? 'جاري التقديم...' : alreadyApplied ? '✅ تم التقديم' : 'تقديم طلب الترشح'}
        </Button>
      </div>

      {/* المزايا */}
      <div className="benefits-section">
        <h3> مزايا المشرف</h3>
        <div className="benefits-grid">
          <div className="benefit-item">
            <FiCheckCircle className="benefit-icon" />
            <span>لوحة تحكم احترافية محدودة الصلاحيات</span>
          </div>
          <div className="benefit-item">
            <FiCheckCircle className="benefit-icon" />
            <span>صلاحية إدارة المحتوى المخالف (حذف/كتم)</span>
          </div>
          <div className="benefit-item">
            <FiCheckCircle className="benefit-icon" />
            <span>لقب "مشرف مارسغو" بجانب اسمك</span>
          </div>
          <div className="benefit-item">
            <FiCheckCircle className="benefit-icon" />
            <span>تكون جزءاً من فريق العمل 🏢</span>
          </div>
        </div>
      </div>

      {/* المتقدمون الحاليون */}
      <div className="candidates-section">
        <h3>
          <FiUsers className="section-icon" />
          المتقدمون الحاليون ({candidates.length})
        </h3>
        <div className="candidates-grid">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="candidate-card">
              <Avatar src={candidate.avatar} name={candidate.name} size="md" />
              <span className="candidate-name">{candidate.name}</span>
              <span className="candidate-time">{candidate.joinedAt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
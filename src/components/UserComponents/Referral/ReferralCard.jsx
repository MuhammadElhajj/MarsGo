// src/components/UserComponents/Referral/ReferralCard.jsx
import { useNavigate } from 'react-router-dom';
import Avatar from '../../GeneralComponents/Avatar/Avatar';
import Button from '../../GeneralComponents/Button/Button';
import { FiUser, FiCheckCircle, FiClock } from 'react-icons/fi';
import './ReferralCard.css';

export default function ReferralCard({ referral, user }) {
  const navigate = useNavigate();
  const { rewardStatus, referredId } = referral;
  const { name, avatar } = user || {};

  const isClaimed = rewardStatus === 'claimed';
  const statusIcon = isClaimed ? <FiCheckCircle className="status-icon claimed" /> : <FiClock className="status-icon pending" />;
  const statusText = isClaimed ? 'مودعة ✅' : 'بانتظار الإيداع ⏳';

  const handleViewProfile = () => {
    if (referredId) {
      navigate(`/profile/${referredId}`);
    }
  };

  return (
    <div className="referral-card">
      <div className="referral-card__avatar">
        <Avatar src={avatar} name={name || 'مستخدم'} size="md" />
      </div>
      <div className="referral-card__info">
        <h4 className="referral-card__name">{name || 'مستخدم'}</h4>
        <div className="referral-card__status">
          {statusIcon}
          <span className={`status-text ${isClaimed ? 'claimed' : 'pending'}`}>{statusText}</span>
        </div>
      </div>
      <div className="referral-card__action">
        <Button onClick={handleViewProfile} variant="secondary" size="sm">
          <FiUser /> عرض الملف
        </Button>
      </div>
    </div>
  );
}
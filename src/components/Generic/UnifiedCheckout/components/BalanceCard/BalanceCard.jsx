import { FiDollarSign } from 'react-icons/fi';

export const BalanceCard = ({ balance, isSufficient }) => (
  <div className={`balance-card ${isSufficient ? 'balance-sufficient' : 'balance-insufficient'}`}>
    <div className="balance-label">
      <FiDollarSign size={20} /> رصيدك الحالي
    </div>
    <div className="balance-amount">{balance.toFixed(2)} $</div>
  </div>
);
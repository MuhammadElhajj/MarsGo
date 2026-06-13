import { useAppStore } from "../../../store/store";
import useFormattedPrice from "../../../hooks/useFormattedPrice";
import useUserSpending from "../../../hooks/useUserSpending";
import "./SpendingProgress.css";

export default function SpendingProgress() {
  const { totalSpent, currentTier, nextTier, progressPercent, loading } = useUserSpending();
  const { formatPrice } = useFormattedPrice();
  const currency = useAppStore((state) => state.currency);

  if (loading) return <div className="spending-progress loading">جاري تحميل مستوى الإنفاق...</div>;

  const remaining = nextTier ? nextTier.min - totalSpent : 0;

  return (
    <div className="spending-progress">
      <div className="spending-progress__header">
        <div className="spending-progress__level">
          {currentTier && (
            <>
              <span>المستوى {currentTier.level}</span>
            </>
          )}
        </div>
        <div className="spending-progress__total">
          انفاقي: <strong>{formatPrice(totalSpent)}</strong>
        </div>
      </div>
      <div className="spending-progress__bar-container">
        <div
          className="spending-progress__bar"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      {/* <div className="spending-progress__info">
        {nextTier ? (
          <div className="spending-progress__next">
            تحتاج إلى <strong>{formatPrice(remaining)}</strong>  للوصول إلى المستوى {nextTier.level}
          </div>
        ) : (
          <div className="spending-progress__max">لقد وصلت إلى أعلى مستوى ولاء!</div>
        )}
      </div> */}
    </div>
  );
}
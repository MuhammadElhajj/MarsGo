// src/components/UserComponents/RecentlyViewed/RecentlyViewed.jsx
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import './RecentlyViewed.css';

export default function RecentlyViewed() {
  const navigate = useNavigate();
  // استخدام الألعاب من الـ store كبيانات (أو يمكنك استخدام بيانات وهمية)
  const games = useAppStore((state) => state.games) || [];
  
  // اختيار أول 4 ألعاب للعرض (يمكن استبدالها ببيانات "آخر ما شاهدت" لاحقاً)
  const recentItems = games.slice(0, 4);
  
  // إذا لم توجد ألعاب، نعرض بيانات وهمية
  const placeholderItems = [
    { id: 'pubg', name: 'PUBG MOBILE', imageUrl: '', category: 'Top Up' },
    { id: 'genshin', name: 'Genshin Impact', imageUrl: '', category: 'Game Coins' },
    { id: 'hsr', name: 'Star Rail (HSR)', imageUrl: '', category: 'Game Items' },
    { id: 'mlbb', name: 'Mobile Legends', imageUrl: '', category: 'Top Up' },
  ];
  
  const displayItems = recentItems.length > 0 ? recentItems : placeholderItems;
  
  const handleItemClick = (item) => {
    // إذا كان لديك مسار للعبة، استخدمه
    navigate(`/gaming/game/${item.id}`);
  };

  return (
    <div className="recently-viewed">
      <div className="recently-viewed__header">
        <h3>آخر ما شاهدت</h3>
        <span className="recently-viewed__badge">قريباً</span>
      </div>
      <div className="recently-viewed__list">
        {displayItems.map((item) => (
          <div key={item.id} className="recently-viewed__item" onClick={() => handleItemClick(item)}>
            <div className="recently-viewed__item-icon">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} />
              ) : (
                <span className="recently-viewed__item-emoji">🎮</span>
              )}
            </div>
            <div className="recently-viewed__item-info">
              <span className="recently-viewed__item-name">{item.name}</span>
              <span className="recently-viewed__item-category">{item.category || 'شحن'}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="recently-viewed__footer">
        <button className="recently-viewed__more-btn" onClick={() => navigate('/gaming')}>
          عرض الكل →
        </button>
      </div>
    </div>
  );
}
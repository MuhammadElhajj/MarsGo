// src/pages/User/SearchPage/SearchPage.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
import Button from '../../../components/GeneralComponents/Button/Button';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import { 
  FiSearch, FiGrid, FiUsers, FiUser, FiShoppingBag, 
  FiPackage, FiFileText, FiX, FiClock, FiCheckCircle,
  FiAlertCircle, FiBox, FiTag, FiTrash2
} from 'react-icons/fi';
import './SearchPage.css';

// أسماء الحالات للطلبات
const statusLabels = {
  pending_verification: 'قيد التدقيق',
  awaiting_customer_resubmit: 'بانتظار تعديلك',
  verified_pending_execution: 'تم التدقيق',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};

// أسماء أنواع الطلبات
const orderTypeLabels = {
  transfer: 'تحويل شام كاش',
  gaming: 'شحن ألعاب',
  apps: 'شحن تطبيقات',
  crypto: 'عملات رقمية',
  exchange: 'صرافة',
};

// أنواع الفلترة
const TABS = [
  { id: 'all', label: 'الكل', icon: <FiGrid /> },
  { id: 'games', label: 'الألعاب', icon: <FiBox /> },
  { id: 'apps', label: 'التطبيقات', icon: <FiPackage /> },
  { id: 'products', label: 'المنتجات', icon: <FiShoppingBag /> },
  { id: 'users', label: 'المستخدمين', icon: <FiUsers /> },
  { id: 'friends', label: 'الأصدقاء', icon: <FiUser /> },
  { id: 'orders', label: 'طلباتي', icon: <FiFileText /> },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  // ===== سجل البحث =====
  const [searchHistory, setSearchHistory] = useState([]);
  const HISTORY_KEY = 'searchHistory';
  const MAX_HISTORY = 5;

  // تحميل السجل من localStorage
  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed.slice(0, MAX_HISTORY));
        }
      } catch (e) {
        // تجاهل
      }
    }
  }, []);

  // دالة لإضافة مصطلح إلى السجل
  const addToHistory = useCallback((term) => {
    if (!term.trim()) return;
    const trimmed = term.trim();
    setSearchHistory(prev => {
      // إزالة التكرارات (نحافظ على الأحدث)
      const filtered = prev.filter(item => item !== trimmed);
      const newHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // دالة لحذف عنصر من السجل
  const removeFromHistory = useCallback((index) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter((_, i) => i !== index);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // دالة لمسح السجل بالكامل
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  // بيانات من الـ Store
  const games = useAppStore((state) => state.games) || [];
  const apps = useAppStore((state) => state.apps) || [];
  const products = useAppStore((state) => state.products) || [];
  const services = useAppStore((state) => state.services) || [];
  const friendsList = useAppStore((state) => state.friendsList) || [];
  const { searchUsersByPrefix } = useAppStore();

  // جلب طلبات المستخدم
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData?.uid) return;
      setOrdersLoading(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserOrders(orders);
      } catch (err) {
        console.error('خطأ في جلب الطلبات:', err);
        // محاولة بدون orderBy
        try {
          const q2 = query(collection(db, 'orders'), where('userId', '==', userData.uid), limit(50));
          const snapshot2 = await getDocs(q2);
          let orders2 = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          orders2.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
          setUserOrders(orders2);
        } catch (err2) {
          console.error(err2);
        }
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [userData]);

  // دالة البحث الرئيسية
  const performSearch = async (query, tab) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    // ✅ إضافة إلى سجل البحث
    addToHistory(query);

    setLoading(true);
    const lowerQuery = query.toLowerCase().trim();
    const allResults = [];

    try {
      // === 1. الألعاب ===
      if (tab === 'all' || tab === 'games') {
        const filteredGames = games.filter(game =>
          game.name?.toLowerCase().includes(lowerQuery) ||
          game.note?.toLowerCase().includes(lowerQuery)
        );
        filteredGames.forEach(game => {
          allResults.push({
            id: `game-${game.id}`,
            type: 'game',
            title: game.name,
            subtitle: game.note || 'لعبة',
            link: `/gaming/game/${game.id}`,
            icon: '🎮',
            imageUrl: game.imageUrl,
          });
        });
      }

      // === 2. التطبيقات ===
      if (tab === 'all' || tab === 'apps') {
        const filteredApps = apps.filter(app =>
          app.name?.toLowerCase().includes(lowerQuery) ||
          app.note?.toLowerCase().includes(lowerQuery)
        );
        filteredApps.forEach(app => {
          allResults.push({
            id: `app-${app.id}`,
            type: 'app',
            title: app.name,
            subtitle: app.note || 'تطبيق',
            link: `/apps/app/${app.id}`,
            icon: '📱',
            imageUrl: app.imageUrl,
          });
        });
      }

      // === 3. المنتجات (باقات) ===
      if (tab === 'all' || tab === 'products') {
        const filteredProducts = products.filter(p =>
          p.name?.toLowerCase().includes(lowerQuery) ||
          p.note?.toLowerCase().includes(lowerQuery)
        );
        filteredProducts.forEach(p => {
          const categoryName = p.categoryId === 'games' ? 'لعبة' : p.categoryId === 'apps' ? 'تطبيق' : 'خدمة';
          const link = p.categoryId === 'games' ? `/gaming/checkout` : p.categoryId === 'apps' ? `/apps/checkout` : '#';
          allResults.push({
            id: `product-${p.id}`,
            type: 'product',
            title: p.name,
            subtitle: `${categoryName} - ${p.price || 0} ${p.currency || 'USD'}`,
            link: link,
            icon: '📦',
            imageUrl: p.imageUrl,
            state: { item: { id: p.categoryId, type: p.categoryId === 'games' ? 'game' : 'app' }, package: p, serviceType: p.categoryId === 'games' ? 'gaming' : 'apps' }
          });
        });
      }

      // === 4. المستخدمين ===
      if (tab === 'all' || tab === 'users') {
        // البحث عن طريق المعرف الفريد (MGC_xxxx)
        const prefix = lowerQuery.replace('mgc_', '');
        if (prefix.length >= 2) {
          try {
            const users = await searchUsersByPrefix(prefix);
            users.forEach(user => {
              if (user.name?.toLowerCase().includes(lowerQuery) || user.uniqueId?.toLowerCase().includes(lowerQuery)) {
                allResults.push({
                  id: `user-${user.id}`,
                  type: 'user',
                  title: user.name || 'مستخدم',
                  subtitle: user.uniqueId || '',
                  link: `/profile/${user.id}`,
                  icon: '👤',
                  imageUrl: user.avatar,
                });
              }
            });
          } catch (err) {
            console.warn('خطأ في البحث عن المستخدمين:', err);
          }
        }
      }

      // === 5. الأصدقاء ===
      if (tab === 'all' || tab === 'friends') {
        const filteredFriends = friendsList.filter(friend =>
          friend.name?.toLowerCase().includes(lowerQuery)
        );
        filteredFriends.forEach(friend => {
          allResults.push({
            id: `friend-${friend.id}`,
            type: 'friend',
            title: friend.name || 'مستخدم',
            subtitle: friend.uniqueId || 'صديق',
            link: `/profile/${friend.id}`,
            icon: '🤝',
            imageUrl: friend.avatar,
          });
        });
      }

      // === 6. طلباتي ===
      if (tab === 'all' || tab === 'orders') {
        if (userData?.uid) {
          const filteredOrders = userOrders.filter(order =>
            order.id.toLowerCase().includes(lowerQuery) ||
            orderTypeLabels[order.type]?.toLowerCase().includes(lowerQuery) ||
            order.customerName?.toLowerCase().includes(lowerQuery) ||
            order.recipientName?.toLowerCase().includes(lowerQuery)
          );
          filteredOrders.forEach(order => {
            const status = statusLabels[order.status] || order.status;
            const type = orderTypeLabels[order.type] || order.type;
            allResults.push({
              id: `order-${order.id}`,
              type: 'order',
              title: `طلب #${order.id.slice(-6)}`,
              subtitle: `${type} - ${status}`,
              link: '/my-orders',
              icon: order.status === 'completed' ? '✅' : order.status === 'rejected' ? '❌' : '⏳',
              status: order.status,
              orderData: order,
            });
          });
        }
      }

      // ترتيب النتائج حسب النوع (للتنظيم)
      const orderMap = { game: 1, app: 2, product: 3, user: 4, friend: 5, order: 6 };
      allResults.sort((a, b) => (orderMap[a.type] || 0) - (orderMap[b.type] || 0));

      setResults(allResults);
    } catch (err) {
      console.error('خطأ في البحث:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // البحث عند تغيير النص أو التبويب
  useEffect(() => {
    const delay = setTimeout(() => {
      performSearch(searchQuery, activeTab);
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery, activeTab]);

  // النقر على عنصر من السجل
  const handleHistoryClick = (term) => {
    setSearchQuery(term);
    performSearch(term, activeTab);
  };

  // عرض العنصر حسب نوعه
  const renderResultItem = (item) => {
    switch (item.type) {
      case 'game':
      case 'app':
        return (
          <div className="search-page__result-item" onClick={() => navigate(item.link)} role="button" tabIndex={0}>
            <div className="search-page__result-icon">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="search-page__result-image" />
              ) : (
                <span className="search-page__result-emoji">{item.icon}</span>
              )}
            </div>
            <div className="search-page__result-info">
              <h4 className="search-page__result-title">{item.title}</h4>
              <p className="search-page__result-subtitle">{item.subtitle}</p>
              <span className="search-page__result-badge">{item.type === 'game' ? '🎮 لعبة' : '📱 تطبيق'}</span>
            </div>
          </div>
        );

      case 'product':
        return (
          <div 
            className="search-page__result-item" 
            onClick={() => navigate(item.link, { state: item.state })} 
            role="button" 
            tabIndex={0}
          >
            <div className="search-page__result-icon">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="search-page__result-image" />
              ) : (
                <span className="search-page__result-emoji">{item.icon}</span>
              )}
            </div>
            <div className="search-page__result-info">
              <h4 className="search-page__result-title">{item.title}</h4>
              <p className="search-page__result-subtitle">{item.subtitle}</p>
              <span className="search-page__result-badge search-page__result-badge--product">📦 منتج</span>
            </div>
          </div>
        );

      case 'user':
      case 'friend':
        return (
          <div className="search-page__result-item" onClick={() => navigate(item.link)} role="button" tabIndex={0}>
            <div className="search-page__result-icon">
              <Avatar src={item.imageUrl} name={item.title} size="md" />
            </div>
            <div className="search-page__result-info">
              <h4 className="search-page__result-title">{item.title}</h4>
              <p className="search-page__result-subtitle">{item.subtitle || (item.type === 'friend' ? 'صديق' : 'مستخدم')}</p>
              <span className={`search-page__result-badge ${item.type === 'friend' ? 'search-page__result-badge--friend' : 'search-page__result-badge--user'}`}>
                {item.type === 'friend' ? '🤝 صديق' : '👤 مستخدم'}
              </span>
            </div>
          </div>
        );

      case 'order':
        const statusClass = item.status === 'completed' ? 'completed' : item.status === 'rejected' ? 'rejected' : 'pending';
        return (
          <div className="search-page__result-item" onClick={() => navigate(item.link)} role="button" tabIndex={0}>
            <div className="search-page__result-icon search-page__result-icon--order">
              <span className="search-page__result-emoji">{item.icon}</span>
            </div>
            <div className="search-page__result-info">
              <h4 className="search-page__result-title">{item.title}</h4>
              <p className="search-page__result-subtitle">{item.subtitle}</p>
              <span className={`search-page__result-badge search-page__result-badge--${statusClass}`}>
                {statusLabels[item.status] || item.status}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="search-page" dir="rtl">
    

      {/* ===== شريط البحث ===== */}
      <div className="search-page__search-wrapper">
        <div className="search-page__search-box">
          <FiSearch className="search-page__search-icon" />
          <input
            type="text"
            className="search-page__search-input"
            placeholder="ابحث عن لعبة، تطبيق، مستخدم، منتج، طلب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button className="search-page__search-clear" onClick={() => setSearchQuery('')}>
              <FiX />
            </button>
          )}
        </div>
      </div>

     

      {/* ===== أزرار الفلترة ===== */}
      <div className="search-page__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`search-page__tab ${activeTab === tab.id ? 'search-page__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="search-page__tab-icon">{tab.icon}</span>
            <span className="search-page__tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

 {/* ===== سجل البحث ===== */}
      {searchHistory.length > 0 && (
        <div className="search-page__history">
          <div className="search-page__history-header">
            <span className="search-page__history-title">
              <FiClock /> آخر عمليات البحث
            </span>
            <button className="search-page__history-clear" onClick={clearHistory}>
              <FiTrash2 /> مسح الكل
            </button>
          </div>
          <div className="search-page__history-list">
            {searchHistory.map((term, index) => (
              <div key={index} className="search-page__history-item">
                <span 
                  className="search-page__history-term"
                  onClick={() => handleHistoryClick(term)}
                >
                  {term}
                </span>
                <button 
                  className="search-page__history-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(index);
                  }}
                  aria-label="حذف"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ===== النتائج ===== */}
      <div className="search-page__results">
        {searchQuery.length < 2 ? (
          <div className="search-page__empty">
            <FiSearch className="search-page__empty-icon" />
            <p>ابدأ بالبحث عن أي شيء</p>
            <span className="search-page__empty-hint">أدخل كلمتين على الأقل للبحث</span>
          </div>
        ) : loading ? (
          <div className="search-page__loading">
            <div className="search-page__loading-spinner"></div>
            <p>جاري البحث...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="search-page__empty">
            <FiSearch className="search-page__empty-icon" />
            <p>لا توجد نتائج لـ "{searchQuery}"</p>
            <span className="search-page__empty-hint">حاول تغيير كلمات البحث أو التبويب</span>
          </div>
        ) : (
          <>
            <div className="search-page__results-header">
              <span className="search-page__results-count">
                {results.length} نتيجة
                {activeTab !== 'all' && ` في ${TABS.find(t => t.id === activeTab)?.label}`}
              </span>
            </div>
            <div className="search-page__results-grid">
              {results.map((item) => (
                <div key={item.id} className="search-page__result-wrapper">
                  {renderResultItem(item)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
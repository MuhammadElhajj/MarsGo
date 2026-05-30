import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
// import { FiSearch } from 'react-icons/fi'; // ✅ استيراد الأيقونة
// import { FaSearch } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import './Search.css';

export default function Search({ placeholder = "ابحث عن طلب، خدمة..." }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const { userData } = useAuth();

  // إغلاق النتائج عند الضغط خارج المربع
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // البحث في الطلبات
  useEffect(() => {
    if (!userData?.uid) {
      setResults([]);
      return;
    }

    if (!searchTerm.trim() || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const searchOrders = async () => {
      setLoading(true);
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const filtered = userOrders.filter(order => {
          const searchLower = searchTerm.toLowerCase();
          if (order.id.toLowerCase().includes(searchLower)) return true;
          if (order.recipientName && order.recipientName.toLowerCase().includes(searchLower)) return true;
          if (order.customerName && order.customerName.toLowerCase().includes(searchLower)) return true;
          if (order.type && order.type.toLowerCase().includes(searchLower)) return true;
          if (order.status && order.status.toLowerCase().includes(searchLower)) return true;
          if (order.amount && order.amount.toString().includes(searchLower)) return true;
          return false;
        });
        
        setResults(filtered.slice(0, 10));
      } catch (error) {
        console.error('خطأ في البحث:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      searchOrders();
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchTerm, userData?.uid]);

  const getTypeLabel = (type) => {
    const types = {
      transfer: 'تحويل شام كاش',
      gaming: 'شحن ألعاب',
      crypto: 'عملات رقمية',
      exchange: 'صرافة'
    };
    return types[type] || type;
  };

  const getStatusLabel = (status) => {
    const statuses = {
      pending_verification: 'قيد التدقيق',
      awaiting_customer_resubmit: 'بانتظار تعديلك',
      verified_pending_execution: 'تم التدقيق',
      rejected: 'مرفوض',
      completed: 'مكتمل'
    };
    return statuses[status] || status;
  };

  if (!userData?.uid) {
    return null;
  }

  return (
    <div className="search-container" ref={searchRef}>
      <div className="search-input-wrapper">
        {/* ✅ استبدال الأيقونة النصية بـ FiSearch */}
        {/* <FaSearch className="search-icon" size={16} /> */}
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowResults(true)}
        />
        {searchTerm && (
          <button className="search-clear" onClick={() => setSearchTerm('')}>
            ✕
          </button>
        )}
      </div>

      {showResults && (searchTerm.length >= 2 || results.length > 0) && (
        <div className="search-results">
          {loading ? (
            <div className="search-loading">جاري البحث...</div>
          ) : results.length > 0 ? (
            <>
              <div className="search-results-header">
                <span>نتائج البحث ({results.length})</span>
                <button onClick={() => setShowResults(false)}>إغلاق</button>
              </div>
              <ul className="search-results-list">
                {results.map((order) => (
                  <li key={order.id} className="search-result-item">
                    <Link to="/transfer" onClick={() => setShowResults(false)}>
                      <div className="search-result-info">
                        <span className="search-result-id">#{order.id.slice(-8)}</span>
                        <span className={`search-result-status status-${order.status}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="search-result-details">
                        <span className="search-result-type">{getTypeLabel(order.type)}</span>
                        {order.recipientName && (
                          <span className="search-result-name">{order.recipientName}</span>
                        )}
                        {order.amount && (
                          <span className="search-result-amount">{order.amount} $</span>
                        )}
                      </div>
                      <div className="search-result-date">
                        {order.createdAt?.toDate?.().toLocaleDateString('ar-SY') || '—'}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : searchTerm.length >= 2 ? (
            <div className="search-no-results">
              <span>🔍</span>
              <p>لا توجد نتائج لـ "{searchTerm}"</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
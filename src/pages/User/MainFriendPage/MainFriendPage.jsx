// src/pages/User/MainFriendPage/MainFriendPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
import { 
  FiUsers, FiUserPlus, FiUserMinus, FiSearch, FiCheck, FiX, 
  FiUser, FiClock, FiUserCheck, FiTrendingUp 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './MainFriendPage.css';

export default function MainFriendPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const {
    friendsList,
    fetchFriendsList,
    removeFriend,
    friendRequests,
    fetchFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
    searchByUniqueId,
    fetchSuggestedFriends,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // جلب البيانات الأولية
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setSuggestionsLoading(true);
      await fetchFriendsList();
      await fetchFriendRequests();
      
      try {
        const suggestedUsers = await fetchSuggestedFriends();
        setSuggestions(suggestedUsers || []);
      } catch (err) {
        console.warn('فشل جلب الاقتراحات:', err);
        setSuggestions([]);
      }
      setSuggestionsLoading(false);
      setLoading(false);
    };
    loadData();
  }, [fetchFriendsList, fetchFriendRequests, fetchSuggestedFriends]);

  // ✅ دالة التنقل إلى البروفايل العام
  const goToProfile = (userId) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  // ✅ منع انتشار الحدث عند النقر على الأزرار
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error('الرجاء إدخال اسم أو معرف');
      return;
    }
    setSearchLoading(true);
    const result = await searchByUniqueId(searchTerm.trim());
    if (result) {
      setSearchResult(result);
    } else {
      setSearchResult(null);
      toast.error('لم يتم العثور على مستخدم');
    }
    setSearchLoading(false);
  };

  const handleAddFriend = async (userId) => {
    const success = await sendFriendRequest(userId);
    if (success) {
      toast.success('تم إرسال طلب الصداقة');
      await fetchFriendsList();
      await fetchFriendRequests();
      const updatedSuggestions = await fetchSuggestedFriends();
      setSuggestions(updatedSuggestions || []);
    }
  };

  const handleRemove = async (friendId, e) => {
    e.stopPropagation();
    if (window.confirm('هل تريد إزالة هذا الصديق؟')) {
      const success = await removeFriend(friendId);
      if (success) {
        toast.success('تم إزالة الصديق');
        await fetchFriendsList();
        const updatedSuggestions = await fetchSuggestedFriends();
        setSuggestions(updatedSuggestions || []);
      }
    }
  };

  const handleAccept = async (requestId, e) => {
    e.stopPropagation();
    const success = await acceptFriendRequest(requestId);
    if (success) {
      toast.success('تم قبول الصداقة');
      await fetchFriendsList();
      await fetchFriendRequests();
      const updatedSuggestions = await fetchSuggestedFriends();
      setSuggestions(updatedSuggestions || []);
    }
  };

  const handleReject = async (requestId, e) => {
    e.stopPropagation();
    const success = await rejectFriendRequest(requestId);
    if (success) {
      toast.success('تم رفض الطلب');
      await fetchFriendRequests();
      const updatedSuggestions = await fetchSuggestedFriends();
      setSuggestions(updatedSuggestions || []);
    }
  };

  // ✅ عرض الأصدقاء – كل بطاقة قابلة للنقر
  const renderFriends = () => {
    if (friendsList.length === 0) {
      return <div className="main-friend-empty">لا يوجد أصدقاء حتى الآن</div>;
    }
    return friendsList.map((friend) => (
      <div
        key={friend.id}
        className="main-friend-item"
        onClick={() => goToProfile(friend.id)}
        role="button"
        tabIndex={0}
      >
        <Avatar src={friend.avatar} name={friend.name} size="md" />
        <div className="main-friend-info">
          <span className="main-friend-name">{friend.name}</span>
          <span className="main-friend-id">{friend.uniqueId}</span>
        </div>
        <div className="main-friend-actions" onClick={stopPropagation}>
          <Button
            onClick={(e) => handleRemove(friend.id, e)}
            variant="danger"
            size="sm"
          >
            <FiUserMinus style={{ color: '#ef4444' }} /> إزالة
          </Button>
        </div>
      </div>
    ));
  };

  // ✅ عرض طلبات الصداقة – كل بطاقة قابلة للنقر
  const renderRequests = () => {
    if (friendRequests.length === 0) {
      return <div className="main-friend-empty">لا توجد طلبات صداقة</div>;
    }
    return friendRequests.map((req) => (
      <div
        key={req.id}
        className="main-friend-request-item"
        onClick={() => goToProfile(req.from)}
        role="button"
        tabIndex={0}
      >
        <Avatar src={req.fromAvatar} name={req.fromName || 'مستخدم'} size="md" />
        <div className="main-friend-request-info">
          <span className="main-friend-request-name">{req.fromName || 'مستخدم'}</span>
          <span className="main-friend-request-time">
            <FiClock style={{ color: '#8b5cf6', marginLeft: '0.3rem', fontSize: '0.7rem' }} />
            {req.createdAt?.toDate?.().toLocaleDateString() || ''}
          </span>
        </div>
        <div className="main-friend-request-actions" onClick={stopPropagation}>
          <Button
            onClick={(e) => handleAccept(req.id, e)}
            variant="primary"
            size="sm"
          >
            <FiCheck style={{ color: '#10b981' }} /> قبول
          </Button>
          <Button
            onClick={(e) => handleReject(req.id, e)}
            variant="danger"
            size="sm"
          >
            <FiX style={{ color: '#ef4444' }} /> رفض
          </Button>
        </div>
      </div>
    ));
  };

  // ✅ عرض نتيجة البحث – قابلة للنقر
  const renderSearch = () => (
    <div className="main-friend-search-section">
      <form onSubmit={handleSearch} className="main-friend-search-form">
        <div className="main-friend-search-wrapper">
          <FiSearch className="main-friend-search-icon" style={{ color: '#8b5cf6' }} />
          <input
            type="text"
            placeholder="ابحث بالاسم أو المعرف الفريد"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="main-friend-search-input"
          />
        </div>
        <Button type="submit" disabled={searchLoading}>
          <FiSearch /> بحث
        </Button>
      </form>
      {searchResult && (
        <div
          className="main-friend-search-result"
          onClick={() => goToProfile(searchResult.id)}
          role="button"
          tabIndex={0}
        >
          <Avatar src={searchResult.avatar} name={searchResult.name} size="md" />
          <div className="main-friend-result-info">
            <span className="main-friend-result-name">{searchResult.name}</span>
            <span className="main-friend-result-id">{searchResult.uniqueId}</span>
          </div>
          <div className="main-friend-actions" onClick={stopPropagation}>
            <Button
              onClick={() => handleAddFriend(searchResult.id)}
              variant="primary"
              size="sm"
            >
              <FiUserPlus style={{ color: '#10b981' }} /> إضافة
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // ✅ عرض اقتراحات الأصدقاء – كل بطاقة قابلة للنقر
  const renderSuggestions = () => {
    if (suggestionsLoading) {
      return <div className="main-friend-suggestions-loading">جاري تحميل الاقتراحات...</div>;
    }
    if (suggestions.length === 0) {
      return (
        <div className="main-friend-suggestions-empty">
          <p>لا توجد اقتراحات أصدقاء حالياً</p>
        </div>
      );
    }
    return (
      <div className="main-friend-suggestions">
        <h4 className="main-friend-suggestions-title">
          <FiTrendingUp style={{ color: '#8b5cf6', marginLeft: '0.5rem' }} />
          اقتراحات أصدقاء
        </h4>
        {suggestions.map((user) => (
          <div
            key={user.id}
            className="main-friend-suggestion-item"
            onClick={() => goToProfile(user.id)}
            role="button"
            tabIndex={0}
          >
            <Avatar src={user.avatar} name={user.name} size="md" />
            <div className="main-friend-suggestion-info">
              <span className="main-friend-suggestion-name">{user.name}</span>
              <span className="main-friend-suggestion-id">{user.uniqueId}</span>
            </div>
            <div className="main-friend-actions" onClick={stopPropagation}>
              <Button
                onClick={() => handleAddFriend(user.id)}
                variant="primary"
                size="sm"
              >
                <FiUserPlus style={{ color: '#10b981' }} /> إضافة
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="main-friend-loading">
        <div className="main-friend-loading-spinner"></div>
        <p>جاري تحميل الأصدقاء...</p>
      </div>
    );
  }

  return (
    <div className="main-friend-page" dir="rtl">
      <div className="main-friend-header">
     
        <h1 className="main-friend-title">
          <FiUsers className="main-friend-title-icon" style={{ color: '#3b82f6' }} />
          الأصدقاء
        </h1>
        <div className="main-friend-stats">
          <span className="main-friend-stat-badge">
            <FiUser style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }} />
            {friendsList.length}
          </span>
          {friendRequests.length > 0 && (
            <span className="main-friend-stat-badge main-friend-stat-badge--requests">
              <FiClock style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }} />
              {friendRequests.length}
            </span>
          )}
        </div>
      </div>

      <div className="main-friend-tabs">
        <button
          className={`main-friend-tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <FiUsers style={{ color: activeTab === 'friends' ? '#fff' : '#3b82f6' }} />
          أصدقائي ({friendsList.length})
        </button>
        <button
          className={`main-friend-tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <FiClock style={{ color: activeTab === 'requests' ? '#fff' : '#f59e0b' }} />
          طلبات ({friendRequests.length})
        </button>
        <button
          className={`main-friend-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <FiSearch style={{ color: activeTab === 'search' ? '#fff' : '#8b5cf6' }} />
          بحث
        </button>
      </div>

      <div className="main-friend-content">
        {activeTab === 'friends' && (
          <>
            {renderFriends()}
            {renderSuggestions()}
          </>
        )}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'search' && renderSearch()}
      </div>
    </div>
  );
}
// src/pages/User/SearchUserPage/SearchUserPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
import { FiSearch, FiUser, FiCopy, FiX } from 'react-icons/fi';
import './SearchUserPage.css';

export default function SearchUserPage() {
  const [searchTerm, setSearchTerm] = useState('MGC_');
  const [searchResult, setSearchResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const { searchByUniqueId, copyUniqueId, searchUsersByPrefix } = useAppStore();
  const debounceRef = useRef(null);

  // البحث الفوري عن الاقتراحات
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const prefix = searchTerm.replace('MGC_', '').trim();
    if (prefix.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        const results = await searchUsersByPrefix(prefix);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, searchUsersByPrefix]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed === 'MGC_') {
      setError('الرجاء إدخال المعرف الفريد كاملاً (بعد MGC_)');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResult(null);
    setShowSuggestions(false);

    try {
      const result = await searchByUniqueId(trimmed);
      if (result) {
        setSearchResult(result);
      } else {
        setError('لم يتم العثور على مستخدم بهذا المعرف');
      }
    } catch (err) {
      setError('حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleClearInput = () => {
    setSearchTerm('MGC_');
    setSearchResult(null);
    setError('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (user) => {
    setSearchTerm(user.uniqueId);
    setSearchResult(user);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleCopyId = (id) => {
    copyUniqueId(id);
  };

  return (
    <div className="search-user-page" dir="rtl">
      <div className="search-user-page__header">
        <GoBackButton text="رجوع" />
        <h1 className="search-user-page__title">🔍 البحث عن مستخدم</h1>
      </div>

      <form onSubmit={handleSearch} className="search-user-page__form">
        <div className="search-user-page__input-wrapper">
          <div className="search-user-page__prefix">MGC_</div>
          <input
            type="text"
            className="search-user-page__input"
            placeholder="أدخل الأرقام بعد MGC_"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            autoFocus
          />
          {searchTerm && searchTerm !== 'MGC_' && (
            <button type="button" className="search-user-page__clear-btn" onClick={handleClearInput}>
              <FiX />
            </button>
          )}
          <button type="submit" className="search-user-page__submit-btn" disabled={loading}>
            <FiSearch /> {loading ? 'جاري البحث...' : 'بحث'}
          </button>
        </div>

        {/* قائمة الاقتراحات */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="search-user-page__suggestions">
            {suggestions.map((user) => (
              <div
                key={user.id}
                className="search-user-page__suggestion-item"
                onClick={() => handleSelectSuggestion(user)}
              >
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  size="sm"
                  className="search-user-page__suggestion-avatar"
                />
                <div className="search-user-page__suggestion-info">
                  <span className="search-user-page__suggestion-name">{user.name}</span>
                  <span className="search-user-page__suggestion-id">{user.uniqueId}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="search-user-page__hint">
          أدخل الأرقام فقط بعد <strong>MGC_</strong> (مثال: 00000001)
        </p>
      </form>

      {error && (
        <div className="search-user-page__error">
          <span>⚠️</span> {error}
        </div>
      )}

      {searchResult && (
        <div className="search-user-page__result">
          <div className="search-user-page__result-card">
            <div className="search-user-page__avatar-wrapper">
              <Avatar
                src={searchResult.avatar}
                name={searchResult.name}
                email={searchResult.email}
                size="xl"
              />
            </div>
            <div className="search-user-page__user-info">
              <h2 className="search-user-page__user-name">{searchResult.name}</h2>
              <div className="search-user-page__user-id">
                <span className="search-user-page__id-label">🆔 المعرف:</span>
                <span className="search-user-page__id-value">{searchResult.uniqueId}</span>
                <button
                  className="search-user-page__copy-btn"
                  onClick={() => handleCopyId(searchResult.uniqueId)}
                  title="نسخ المعرف"
                >
                  <FiCopy />
                </button>
              </div>
              <div className="search-user-page__user-stats">
                <span>👥 الأصدقاء: {searchResult.friends?.length || 0}</span>
                <span>❤️ الشعبية: {searchResult.popularity || 0}</span>
                <span>⚡ القوة: {searchResult.power || 0}</span>
                <span>🏅 المستوى: {searchResult.level || 1}</span>
              </div>
              <div className="search-user-page__user-actions">
                <Button
                  onClick={() => handleViewProfile(searchResult.id)}
                  className="search-user-page__profile-btn"
                >
                  <FiUser /> عرض الملف الشخصي
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
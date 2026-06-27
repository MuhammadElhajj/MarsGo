// src/components/AdminCoponent/ExternalStoreImport/components/ProductFilters/ProductFilters.jsx
import React from 'react';
import Button from '../../../../GeneralComponents/Button/Button';
import { FiSearch, FiRefreshCw, FiArrowUp, FiArrowDown } from 'react-icons/fi';

export default function ProductFilters({
  searchTerm,
  setSearchTerm,
  filterExternalCategory,
  setFilterExternalCategory,
  externalCategories,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  showOnlyPopular,
  setShowOnlyPopular,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  resetFilters,
}) {
  return (
    <div className="card filters-card">
      <div className="filters-header">
        <h4>فلترة المنتجات الخارجية</h4>
        <Button onClick={resetFilters} variant="outline" size="sm">
          <FiRefreshCw /> إعادة ضبط
        </Button>
      </div>
      <div className="filters-grid">
        <div className="filter-item search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <select value={filterExternalCategory} onChange={(e) => setFilterExternalCategory(e.target.value)}>
            <option value="">كل التصنيفات الخارجية</option>
            {externalCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-item price-range">
          <input
            type="number"
            placeholder="الحد الأدنى"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span>-</span>
          <input
            type="number"
            placeholder="الحد الأعلى"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showOnlyPopular}
              onChange={(e) => setShowOnlyPopular(e.target.checked)}
            />
            المميزة فقط
          </label>
        </div>
        <div className="filter-item sort-controls">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">الاسم</option>
            <option value="price">السعر</option>
            <option value="id">المعرف</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />}
          </button>
        </div>
      </div>
    </div>
  );
}
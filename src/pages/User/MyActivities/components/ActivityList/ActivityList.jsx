// src/pages/User/MyActivitiesPage/components/ActivityList/ActivityList.jsx
import React from 'react';
import ActivityItem from './ActivityItem';
import { FiActivity } from 'react-icons/fi';

export default function ActivityList({
  items,
  type, // 'deposits' | 'orders' | 'mgc'
  hasMore,
  loadMore,
  loadingMore,
}) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <FiActivity className="empty-icon" />
        <p>
          {type === 'deposits' && 'لا توجد إيداعات حتى الآن'}
          {type === 'orders' && 'لا توجد طلبات حتى الآن'}
          {type === 'mgc' && 'لا توجد نشاطات MGC حتى الآن'}
        </p>
      </div>
    );
  }

  return (
    <div className="my-activities-page__list">
      {items.map((item) => (
        <ActivityItem key={item.id} item={item} type={type} />
      ))}
      {type !== 'mgc' && hasMore && (
        <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'جاري التحميل...' : 'تحميل المزيد'}
        </button>
      )}
    </div>
  );
}
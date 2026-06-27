// src/pages/Admin/AdminDashboard/utils/formatters.js
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 $';
  return amount.toFixed(2) + ' $';
};

export const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
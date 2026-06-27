// src/pages/Admin/AdminDashboard/utils/constants.js
export const COLORS = {
  primary: '#4f46e5',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  pink: '#ec4899',
  cyan: '#06b6d4',
};

export const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  COLORS.pink,
];

export const ORDER_STATUS_LABELS = {
  pending_verification: 'قيد التدقيق',
  awaiting_customer_resubmit: 'بانتظار التعديل',
  verified_pending_execution: 'تم التدقيق',
  completed: 'مكتمل',
  rejected: 'مرفوض',
};

export const ORDER_TYPE_LABELS = {
  transfer: 'تحويل شام كاش',
  gaming: 'شحن ألعاب',
  apps: 'شحن تطبيقات',
  crypto: 'عملات رقمية',
  exchange: 'صرافة',
};
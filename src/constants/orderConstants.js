// src/constants/orderConstants.js

/**
 * ============================================
 * ثوابت الطلبات - مركزية لتسهيل الصيانة
 * ============================================
 */

// ===== حالات الطلبات =====
export const ORDER_STATUS_LABELS = {
  pending_verification: 'قيد التدقيق',
  awaiting_customer_resubmit: 'بانتظار تعديل الزبون',
  verified_pending_execution: 'تم التدقيق - بانتظار التنفيذ',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};

// ===== أنواع الطلبات =====
export const ORDER_TYPE_LABELS = {
  transfer: 'تحويل شام كاش',
  gaming: 'شحن ألعاب',
  apps: 'شحن تطبيقات',
  crypto: 'عملات رقمية',
  exchange: 'صرافة',
};

// ===== ألوان شارات الحالة (للمظهر) =====
export const ORDER_STATUS_COLORS = {
  pending_verification: '#f59e0b',      // أصفر
  awaiting_customer_resubmit: '#3b82f6', // أزرق
  verified_pending_execution: '#8b5cf6', // بنفسجي
  rejected: '#ef4444',                   // أحمر
  completed: '#10b981',                  // أخضر
};

// ===== كلاسات CSS للحالة (للمظهر) =====
export const ORDER_STATUS_BADGE_CLASSES = {
  pending_verification: 'status-pending_verification',
  awaiting_customer_resubmit: 'status-awaiting_customer_resubmit',
  verified_pending_execution: 'status-verified_pending_execution',
  rejected: 'status-rejected',
  completed: 'status-completed',
};
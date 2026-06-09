// src/services/apiStoreService.js
const API_BASE = 'https://mhd-game.com/api';
const API_TOKEN = import.meta.env.VITE_STORE_API_TOKEN;

/**
 * جلب جميع المنتجات من المتجر الخارجي
 */
export async function fetchStoreProducts() {
  if (!API_TOKEN) throw new Error('Store API token missing');
  const res = await fetch(`${API_BASE}/client/api/products`, {
    headers: { 'api-token': API_TOKEN }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * إنشاء طلب شراء في المتجر الخارجي (يتم استدعاؤها من UnifiedCheckout)
 */
export async function createStoreOrder({ productId, quantity, playerId, anyKey = '', orderUuid }) {
  if (!API_TOKEN) throw new Error('Store API token missing');
  if (!productId || !quantity || !playerId) throw new Error('Missing required parameters');

  let url = `${API_BASE}/client/api/newOrder/${productId}/params?qty=${quantity}&playerId=${encodeURIComponent(playerId)}&order_uuid=${encodeURIComponent(orderUuid)}`;
  if (anyKey) url += `&anyKey=${encodeURIComponent(anyKey)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 ثانية مهلة

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'api-token': API_TOKEN },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error(data.message || 'Store order failed');
    return data.data; // { order_id, status, price, data }
  } catch (err) {
    clearTimeout(timeoutId);
    throw new Error(`فشل الاتصال بالمتجر: ${err.message}`);
  }
}

/**
 * التحقق من حالة طلب خارجي (يمكن استخدامها في خلفية النظام)
 */
export async function checkStoreOrderStatus(orderUuid) {
  if (!API_TOKEN) throw new Error('Store API token missing');
  const url = `${API_BASE}/client/api/check?orders=[${encodeURIComponent(orderUuid)}]&uuid=1`;
  const res = await fetch(url, { headers: { 'api-token': API_TOKEN } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'OK') throw new Error(data.message);
  const orderInfo = data.data?.find(o => o.order_id === orderUuid);
  return orderInfo || { status: 'unknown' };
}

/**
 * جلب رصيد المتجر
 */
export async function fetchStoreBalance() {
  if (!API_TOKEN) throw new Error('Store API token missing');
  const res = await fetch(`${API_BASE}/client/api/profile`, {
    headers: { 'api-token': API_TOKEN }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'OK') throw new Error(data.message);
  return data.balance || 0;
}
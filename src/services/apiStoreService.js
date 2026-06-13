// src/services/apiStoreService.js
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const storeProxy = httpsCallable(functions, 'externalStoreProxy');

/**
 * جلب جميع المنتجات من المتجر الخارجي (عبر Cloud Function)
 */
export async function fetchStoreProducts() {
  try {
    const result = await storeProxy({ action: 'fetchProducts' });
    if (!result.data.success) {
      throw new Error(result.data.message || 'Failed to fetch products');
    }
    const data = result.data.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('fetchStoreProducts error:', error);
    throw new Error(`فشل جلب المنتجات: ${error.message}`);
  }
}

/**
 * إنشاء طلب شراء في المتجر الخارجي
 */
export async function createStoreOrder({ productId, quantity, playerId, anyKey = '', orderUuid }) {
  if (!productId || !quantity || !playerId) {
    throw new Error('Missing required parameters');
  }

  try {
    const result = await storeProxy({
      action: 'createOrder',
      params: { productId, quantity, playerId, anyKey, orderUuid }
    });

    if (!result.data.success) {
      throw new Error(result.data.message || 'Store order failed');
    }
    return result.data.data; // { order_id, status, price, data }
  } catch (error) {
    console.error('createStoreOrder error:', error);
    throw new Error(`فشل الاتصال بالمتجر: ${error.message}`);
  }
}

/**
 * التحقق من حالة طلب خارجي
 */
export async function checkStoreOrderStatus(orderUuid) {
  try {
    const result = await storeProxy({
      action: 'checkOrder',
      params: { orderUuid }
    });
    if (!result.data.success) {
      throw new Error(result.data.message || 'Failed to check order');
    }
    const orderInfo = result.data.data?.data?.find(o => o.order_id === orderUuid);
    return orderInfo || { status: 'unknown' };
  } catch (error) {
    console.error('checkStoreOrderStatus error:', error);
    throw new Error(`فشل التحقق من الطلب: ${error.message}`);
  }
}

/**
 * جلب رصيد المتجر
 */
export async function fetchStoreBalance() {
  try {
    const result = await storeProxy({ action: 'fetchBalance' });
    if (!result.data.success) {
      throw new Error(result.data.message || 'Failed to fetch balance');
    }
    return result.data.balance || 0;
  } catch (error) {
    console.error('fetchStoreBalance error:', error);
    throw new Error(`فشل جلب الرصيد: ${error.message}`);
  }
}
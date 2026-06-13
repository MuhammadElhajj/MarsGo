// functions/externalStoreProxy.js
const { onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const axios = require('axios');

const STORE_API_TOKEN = defineSecret('STORE_API_TOKEN');
const API_BASE = 'https://mhd-game.com/api';

exports.externalStoreProxy = onCall({ secrets: [STORE_API_TOKEN] }, async (request) => {
  // التحقق من المصادقة
  if (!request.auth) {
    throw new Error('يجب تسجيل الدخول');
  }

  const tokenValue = STORE_API_TOKEN.value();
  const { action, params } = request.data;

  try {
    switch (action) {
      case 'fetchProducts': {
        const response = await axios.get(`${API_BASE}/client/api/products`, {
          headers: { 'api-token': tokenValue },
          timeout: 15000
        });
        return { success: true, data: response.data };
      }
      case 'createOrder': {
        const { productId, quantity, playerId, anyKey, orderUuid } = params;
        let url = `${API_BASE}/client/api/newOrder/${productId}/params?qty=${quantity}&playerId=${encodeURIComponent(playerId)}&order_uuid=${encodeURIComponent(orderUuid)}`;
        if (anyKey) url += `&anyKey=${encodeURIComponent(anyKey)}`;
        const response = await axios.get(url, {
          headers: { 'api-token': tokenValue },
          timeout: 15000
        });
        if (response.data.status !== 'OK') throw new Error(response.data.message || 'Store order failed');
        return { success: true, data: response.data.data };
      }
      case 'checkOrder': {
        const { orderUuid } = params;
        const url = `${API_BASE}/client/api/check?orders=[${encodeURIComponent(orderUuid)}]&uuid=1`;
        const response = await axios.get(url, {
          headers: { 'api-token': tokenValue },
          timeout: 10000
        });
        return { success: true, data: response.data };
      }
      case 'fetchBalance': {
        const response = await axios.get(`${API_BASE}/client/api/profile`, {
          headers: { 'api-token': tokenValue },
          timeout: 10000
        });
        return { success: true, balance: response.data.balance || 0 };
      }
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error(`Store proxy error (${action}):`, error.message);
    throw new Error(`فشل الاتصال بالمتجر الخارجي: ${error.message}`);
  }
});
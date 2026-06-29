// functions/externalStoreProxy.js
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const axios = require('axios');

const STORE_API_TOKEN = defineSecret('STORE_API_TOKEN');
const API_BASE = 'https://mhd-game.com/api';

exports.externalStoreProxy = onCall({ secrets: [STORE_API_TOKEN] }, async (request) => {
  // التحقق من المصادقة
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const tokenValue = STORE_API_TOKEN.value();
  const { action, params } = request.data;

  // التحقق من نوع الإجراء
  if (!action || typeof action !== 'string') {
    throw new HttpsError('invalid-argument', 'نوع الإجراء مطلوب');
  }

  try {
    switch (action) {
      case 'fetchProducts': {
        const response = await axios.get(`${API_BASE}/client/api/products`, {
          headers: { 'api-token': tokenValue },
          timeout: 15000
        });
        // ✅ تنظيف البيانات قبل الإرجاع - فقط الحقول اللازمة
        const products = (response.data.products || response.data || []).map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          description: p.description,
          category: p.category,
          stock: p.stock,
        }));
        return { success: true, data: { products } };
      }
      case 'createOrder': {
        const { productId, quantity, playerId, anyKey, orderUuid } = params || {};
        
        if (!productId || !quantity || !playerId) {
          throw new HttpsError('invalid-argument', 'بيانات الطلب غير مكتملة');
        }

        // ✅ encodeURIComponent لجميع المعاملات
        let url = `${API_BASE}/client/api/newOrder/${encodeURIComponent(productId)}/params?qty=${encodeURIComponent(quantity)}&playerId=${encodeURIComponent(playerId)}&order_uuid=${encodeURIComponent(orderUuid || '')}`;
        
        if (anyKey) {
          url += `&anyKey=${encodeURIComponent(anyKey)}`;
        }

        const response = await axios.get(url, {
          headers: { 'api-token': tokenValue },
          timeout: 15000
        });
        
        if (response.data.status !== 'OK') {
          throw new HttpsError('internal', response.data.message || 'Store order failed');
        }
        
        return { success: true, data: response.data.data };
      }
      case 'checkOrder': {
        const { orderUuid } = params || {};
        
        if (!orderUuid) {
          throw new HttpsError('invalid-argument', 'معرف الطلب مطلوب');
        }

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
        // ✅ إرجاع الرصيد فقط - لا بيانات أخرى
        return { success: true, balance: response.data.balance || 0 };
      }
      default:
        throw new HttpsError('invalid-argument', 'Invalid action');
    }
  } catch (error) {
    console.error(`Store proxy error (${action}):`, error.message);
    throw new HttpsError('internal', `فشل الاتصال بالمتجر الخارجي: ${error.message}`);
  }
});
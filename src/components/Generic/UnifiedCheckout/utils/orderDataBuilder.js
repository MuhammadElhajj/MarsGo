// src/components/Generic/UnifiedCheckout/utils/orderDataBuilder.js
export function buildOrderData({ serviceType, userData, formData, item, pkg, rate, currency, requiredAmountUSD }) {
  let orderData = {
    userId: userData.uid,
    customerName: userData.name || '',
    type: serviceType,
    status: 'completed',
    paidByBalance: true,
    createdAt: new Date(), // serverTimestamp سيُضاف في الـ addDoc
  };

  switch (serviceType) {
    case 'gaming':
    case 'apps':
      orderData = {
        ...orderData,
        itemId: item.id,
        itemName: item.name,
        packageId: pkg.id,
        packageName: pkg.name,
        priceUSD: requiredAmountUSD,
        finalPriceUSD: requiredAmountUSD,
        exchangeRateAtPurchase: rate || null,
        currencyUsed: currency,
        playerId: formData.playerId,
      };
      break;
    case 'transfer':
      orderData = {
        ...orderData,
        recipientName: formData.recipientName,
        shamCashPhone: formData.shamCashPhone,
        amount: parseFloat(formData.amount),
      };
      break;
    case 'crypto':
      orderData = {
        ...orderData,
        tradeType: formData.tradeType,
        amount: parseFloat(formData.amount),
        price: parseFloat(formData.price),
        paymentMethod: formData.paymentMethod,
      };
      break;
    case 'exchange':
      orderData = {
        ...orderData,
        exchangeType: formData.exchangeType,
        amount: parseFloat(formData.amount),
        rate: parseFloat(formData.rateExchange),
      };
      break;
  }
  return orderData;
}
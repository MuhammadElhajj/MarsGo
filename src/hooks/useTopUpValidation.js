import { useMemo } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useExchangeRate } from '../context/ExchangeRateContext';

export function useTopUpValidation(settings, amount, selectedMethod, currency, rate) {
  const minDepositUSD = settings?.minDeposit || 3;
  const minDepositSYP = rate ? Math.ceil(minDepositUSD * rate) : null;

  const getMinDepositDisplay = () => {
    if (currency === 'USD') return `${minDepositUSD} $`;
    return minDepositSYP ? `${minDepositSYP.toLocaleString()} ل.س` : `${minDepositUSD} $ (سعر الصرف غير متاح)`;
  };

  const isAmountValid = () => {
    if (!amount) return false;
    const num = parseFloat(amount);
    return !isNaN(num) && num >= minDepositUSD;
  };

  const amountIsInvalid = amount !== '' && !isAmountValid();

  const isPaymentInfoComplete = () => {
    const method = settings?.[selectedMethod];
    if (!method) return false;
    if (selectedMethod === 'usdt') return method.address?.trim() !== '';
    return method.accountNumber?.trim() !== '';
  };

  const isMaintenance = !isPaymentInfoComplete();

  return {
    minDepositUSD,
    getMinDepositDisplay,
    isAmountValid,
    amountIsInvalid,
    isMaintenance,
    isPaymentInfoComplete,
  };
}
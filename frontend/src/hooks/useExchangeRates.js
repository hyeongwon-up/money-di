import { useCallback, useEffect, useRef, useState } from 'react';
import axios from '../api';
const cacheKey = 'money-di-exchange-rates-v1';
function cachedRates() {
  try {
    const data = JSON.parse(localStorage.getItem(cacheKey));
    return Array.isArray(data) ? data.filter(q => ['USD', 'USDT'].includes(q.currency) && Number(q.rate) > 0 && q.fetchedAt).map(q => ({ ...q, stale: true })) : [];
  } catch { return []; }
}
export function useExchangeRates() {
  const [rates, setRates] = useState(cachedRates);
  const [rateLoading, setLoading] = useState(false);
  const [rateError, setError] = useState(false);
  const pending = useRef(false);
  const refreshRates = useCallback(async () => {
    if (pending.current) return;
    pending.current = true; setLoading(true);
    try {
      const { data } = await axios.get('/api/exchange-rates', { timeout: 60000 });
      if (!Array.isArray(data)) throw new Error('Invalid rates');
      setRates(previous => {
        const merged = ['USD', 'USDT'].map(currency => {
          const quote = data.find(q => q.currency === currency && q.available && Number(q.rate) > 0);
          return quote || { ...previous.find(q => q.currency === currency), currency, stale: true };
        });
        try { localStorage.setItem(cacheKey, JSON.stringify(merged)); } catch { /* Cache is optional. */ }
        return merged;
      });
      setError(data.some(q => !q.available || q.stale));
    } catch {
      setError(true); setRates(previous => previous.map(q => ({ ...q, stale: true })));
    } finally { pending.current = false; setLoading(false); }
  }, []);
  useEffect(() => {
    refreshRates();
    const timer = setInterval(() => { if (!document.hidden) refreshRates(); }, 60000);
    const visible = () => { if (!document.hidden) refreshRates(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [refreshRates]);
  return { rates, rateLoading, rateError, refreshRates };
}

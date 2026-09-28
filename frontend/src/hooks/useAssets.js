import { useState, useEffect, useCallback, useRef } from 'react';
import { useExchangeRates } from './useExchangeRates';
import { valueAsset } from '../utils/currency';
import { assetApi } from '../api/assetApi';

export const useAssets = () => {
  const pending = useRef(false);
  const exchange = useExchangeRates();
  const [assets, setAssets] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchData = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setFetching(true);
    setFetchError(false);
    try {
      const [assetRes, historyRes] = await Promise.all([
        assetApi.getAssets(),
        assetApi.getHistory()
      ]);
      if (!Array.isArray(assetRes.data) || !Array.isArray(historyRes.data)) throw new Error('Invalid asset response');
      setAssets(assetRes.data.map(asset => ({ ...asset, category: asset.category === 'LOAN' ? 'DEBT' : asset.category })));
      setIsServerOnline(true);
      setHistory(historyRes.data.sort((a, b) => new Date(a.recordedDate) - new Date(b.recordedDate)));
    } catch (error) {
      console.error('Failed to fetch data', error);
      setFetchError(true);
      setIsServerOnline(false);
    } finally {
      pending.current = false;
      setFetching(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      await assetApi.checkHealth();
      setIsServerOnline(true);
    } catch (error) {
      setIsServerOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchData, checkHealth]);

  useEffect(() => {
    if (!fetchError) return;
    const timer = setTimeout(() => { if (!document.hidden) fetchData(); }, 15000);
    const visible = () => { if (!document.hidden) fetchData(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', visible); };
  }, [fetchError, fetching, fetchData]);

  return {
    fetching,
    fetchError,
    ...exchange,
    assets: assets.map(asset => valueAsset(asset, exchange.rates)),
    setAssets,
    history,
    setHistory,
    loading,
    setLoading,
    isServerOnline,
    fetchData,
    refreshAssets: fetchData
  };
};

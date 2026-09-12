import { useState, useEffect, useCallback } from 'react';
import { assetApi } from '../api/assetApi';

export const useAssets = () => {
  const [assets, setAssets] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchData = useCallback(async () => {
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

  return {
    fetching,
    fetchError,
    assets,
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

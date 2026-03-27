import { useState, useEffect, useCallback } from 'react';
import { assetApi } from '../api/assetApi';

export const useAssets = () => {
  const [assets, setAssets] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [assetRes, historyRes] = await Promise.all([
        assetApi.getAssets(),
        assetApi.getHistory()
      ]);
      setAssets(assetRes.data);
      setHistory(historyRes.data.sort((a, b) => new Date(a.recordedDate) - new Date(b.recordedDate)));
    } catch (error) {
      console.error('Failed to fetch data', error);
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

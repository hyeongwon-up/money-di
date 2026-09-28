import axios from './index';

export const assetApi = {
  getAssets: () => axios.get('/api/assets', { timeout: 60000 }),
  getItemHistory: () => axios.get('/api/assets/item-history', { timeout: 60000 }),
  getHistory: () => axios.get('/api/assets/history', { timeout: 60000 }),
  saveAsset: (form) => axios.post('/api/assets', form),
  updateAsset: (id, form) => axios.put(`/api/assets/${id}`, form),
  deleteAsset: (id) => axios.delete(`/api/assets/${id}`),
  updateHistory: (id, historyItem) => axios.put(`/api/assets/history/${id}`, historyItem),
  checkHealth: () => axios.get('/api/health', { timeout: 5000 })
};

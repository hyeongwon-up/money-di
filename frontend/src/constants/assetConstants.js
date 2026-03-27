export const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

export const INITIAL_CATEGORIES = {
  SAVINGS: { label: '예금', emoji: '💰', color: '#3b82f6' },
  INSTALLMENT: { label: '적금', emoji: '🏦', color: '#10b981' },
  STOCK: { label: '주식', emoji: '📈', color: '#f59e0b' },
  CRYPTO: { label: '암호화폐', emoji: '🪙', color: '#ef4444' },
  REAL_ESTATE: { label: '부동산', emoji: '🏠', color: '#8b5cf6' },
  DEBT: { label: '대출/부채', emoji: '💸', color: '#ef4444', isLiability: true },
  OTHER: { label: '기타', emoji: '⚙️', color: '#64748b' }
};

export const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '0153';

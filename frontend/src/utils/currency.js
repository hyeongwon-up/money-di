export const CURRENCIES = { KRW: '원화 (KRW)', USD: '미국 달러 (USD)', USDT: '테더 (USDT)' };
export const validAssetAmount = value => {
  const amount = String(value.amount);
  return amount !== '' && Number.isFinite(Number(amount)) && (value.currency === 'KRW' || !value.currency
    ? Number.isSafeInteger(Number(amount)) && Math.abs(Number(amount)) <= Number.MAX_SAFE_INTEGER
    : /^\d+(\.\d{1,8})?$/.test(amount) && Number(amount) <= 1e12);
};
export const assetPayload = value => ({ ...value, currency: value.currency || 'KRW', amount: value.currency && value.currency !== 'KRW' ? null : Number(value.amount), foreignAmount: value.currency && value.currency !== 'KRW' ? String(value.amount) : null });
// Multiply decimal strings exactly, matching the server's HALF_UP rounding to whole won.
export function convertToWon(quantity, rate) {
  const parts = [quantity, rate].map(value => {
    const match = String(value).match(/^(\d+)(?:\.(\d+))?$/);
    if (!match) return null;
    return { number: BigInt(match[1] + (match[2] || '')), scale: (match[2] || '').length };
  });
  if (parts.some(part => !part)) return NaN;
  const denominator = 10n ** BigInt(parts[0].scale + parts[1].scale);
  const product = parts[0].number * parts[1].number;
  return Number((product * 2n + denominator) / (denominator * 2n));
}
export function valueAsset(asset, rates) {
  let rate = rates.find(item => item.currency === asset.currency && item.available);
  if (asset.exchangeRate?.available && (!rate || Date.parse(asset.exchangeRate.fetchedAt) > Date.parse(rate.fetchedAt))) rate = { ...asset.exchangeRate, stale: asset.exchangeRate.stale || !!rate?.stale };
  if (!rate || asset.foreignAmount == null) return asset;
  const amount = convertToWon(asset.foreignAmount, rate.rate);
  if (!Number.isSafeInteger(amount)) return asset;
  return { ...asset, amount: ['DEBT', 'LOAN'].includes(asset.category) ? -amount : amount, exchangeRate: rate };
}
export const rateTime = rate => rate?.asOf ? (rate.currency === 'USD' ? rate.asOf : new Date(rate.asOf).toLocaleString('ko-KR')) : '기준 시각 확인 불가';

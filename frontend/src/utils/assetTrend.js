export function koreaToday(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now);
}
export function cutoffDate(today, days) {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
export const changePercent = (before, after) => before > 0 ? (after - before) / before * 100 : null;
export function buildTrend(history, assets, itemHistory, days, today = koreaToday()) {
  // The highest ID is the final recorded value when a day has multiple records.
  const byDate = new Map();
  for (const h of [...history].sort((a, b) => Number(a.id) - Number(b.id))) {
    if (h.recordedDate <= today && Number.isFinite(Number(h.totalAmount))) byDate.set(h.recordedDate, h);
  }
  const all = [...byDate.values()].sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));
  const cutoff = days ? cutoffDate(today, days) : null;
  const baseline = cutoff ? all.filter(h => h.recordedDate <= cutoff).at(-1) || all.find(h => h.recordedDate > cutoff) : all[0];
  const current = assets.reduce((sum, asset) => sum + Number(asset.amount), 0);
  const before = baseline ? Number(baseline.totalAmount) : null;
  const records = baseline ? all.filter(h => h.recordedDate >= baseline.recordedDate) : [];
  const points = records.map(h => ({ ...h, label: h.recordedDate, value: Number(h.totalAmount), time: Date.parse(`${h.recordedDate}T00:00:00+09:00`) }));
  points.push({ label: `${today} 현재`, value: current, current: true, time: Date.parse(`${today}T23:59:59+09:00`) });
  const snapshots = new Map();
  if (baseline) for (const h of [...itemHistory].sort((a, b) => a.recordedDate.localeCompare(b.recordedDate) || Number(a.id) - Number(b.id))) {
    if (h.recordedDate <= baseline.recordedDate && Number.isFinite(Number(h.amount))) snapshots.set(String(h.assetId), h);
  }
  const changes = assets.map(asset => {
    const snapshot = snapshots.get(String(asset.id));
    const from = snapshot ? Number(snapshot.amount) : null;
    const to = Number(asset.amount);
    return { ...asset, before: from, after: to, baselineDate: snapshot?.recordedDate, delta: from === null ? null : to - from, percent: from === null ? null : changePercent(from, to) };
  }).sort((a, b) => (b.delta === null ? -1 : Math.abs(b.delta)) - (a.delta === null ? -1 : Math.abs(a.delta)));
  const compared = changes.filter(a => a.delta !== null);
  const delta = before === null ? null : current - before;
  const high = points.reduce((a, b) => a.value >= b.value ? a : b);
  const low = points.reduce((a, b) => a.value <= b.value ? a : b);
  return { baseline, current, before, delta, percent: before === null ? null : changePercent(before, current), points, changes, high, low,
    coverage: compared.length, residual: delta === null ? null : delta - compared.reduce((sum, a) => sum + a.delta, 0),
    shorter: !!(baseline && cutoff && baseline.recordedDate > cutoff),
    older: !!(baseline && cutoff && baseline.recordedDate < cutoff) };
}

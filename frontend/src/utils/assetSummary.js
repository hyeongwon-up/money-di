export function getCategoryTotals(assets, categories) {
  const totals = Object.fromEntries(Object.keys(categories).map(key => [key, { amount: 0, count: 0 }]));
  for (const asset of assets) {
    const key = asset.category === 'LOAN' ? 'DEBT' : asset.category;
    if (!totals[key]) continue;
    totals[key].amount += Number(asset.amount);
    totals[key].count += 1;
  }
  return Object.entries(categories).map(([key, category]) => ({ key, ...category, ...totals[key] }));
}

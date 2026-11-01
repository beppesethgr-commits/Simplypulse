// Aggregazioni per la dashboard, calcolate sui documenti normalizzati.
const round = (n) => Math.round(n * 100) / 100;

function group(items, keyFn, valFn) {
  const m = new Map();
  for (const x of items) m.set(keyFn(x), (m.get(keyFn(x)) || 0) + valFn(x));
  return m;
}
const toSeries = (m, { sortBy = 'value', limit } = {}) => {
  let a = [...m];
  a = sortBy === 'key' ? a.sort((x, y) => x[0].localeCompare(y[0])) : a.sort((x, y) => y[1] - x[1]);
  if (limit) a = a.slice(0, limit);
  return { labels: a.map((x) => x[0]), values: a.map((x) => round(x[1])) };
};

function dashboard(docs) {
  const rows = docs.flatMap((d) => d.rows);
  const revenue = docs.reduce((s, d) => s + d.total, 0);
  const rowNet = rows.reduce((s, r) => s + r.amount, 0);
  const rowCost = rows.reduce((s, r) => s + r.cost, 0);
  return {
    kpi: {
      revenue: round(revenue),
      documents: docs.length,
      avgDocument: docs.length ? round(revenue / docs.length) : 0,
      items: round(rows.reduce((s, r) => s + r.qty, 0)),
      margin: rowCost > 0 && rowNet > 0 ? round(((rowNet - rowCost) / rowNet) * 100) : null,
    },
    monthly: toSeries(group(docs, (d) => d.date.slice(0, 7), (d) => d.total), { sortBy: 'key' }),
    topProducts: toSeries(group(rows, (r) => r.product, (r) => r.amount), { limit: 8 }),
    byDepartment: toSeries(group(rows, (r) => r.department, (r) => r.amount)),
    byPayment: toSeries(group(docs.flatMap((d) => d.payments), (p) => p.type, (p) => p.amount)),
    recent: [...docs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15)
      .map((d) => ({ number: d.number, date: d.date, pos: d.pos, type: d.type, total: d.total })),
  };
}
module.exports = { dashboard };

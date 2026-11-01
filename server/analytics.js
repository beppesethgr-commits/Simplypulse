// Aggregazioni per la dashboard, calcolate sui documenti normalizzati.
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const round = (n) => Math.round(n * 100) / 100;

function groupSum(docs, keyFn) {
  const m = new Map();
  for (const d of docs) m.set(keyFn(d), (m.get(keyFn(d)) || 0) + d.amount);
  return m;
}

function dashboard(docs) {
  const revenue = sum(docs, (d) => d.amount);
  const cost = sum(docs, (d) => d.cost);
  const customers = new Set(docs.map((d) => d.customer));
  const monthly = [...groupSum(docs, (d) => d.date.slice(0, 7))].sort((a, b) => a[0].localeCompare(b[0]));
  const topCustomers = [...groupSum(docs, (d) => d.customer)].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const byCategory = [...groupSum(docs, (d) => d.category)].sort((a, b) => b[1] - a[1]);
  return {
    kpi: {
      revenue: round(revenue),
      documents: docs.length,
      customers: customers.size,
      avgDocument: docs.length ? round(revenue / docs.length) : 0,
      margin: cost ? round(((revenue - cost) / revenue) * 100) : null,
    },
    monthly: { labels: monthly.map((x) => x[0]), values: monthly.map((x) => round(x[1])) },
    topCustomers: { labels: topCustomers.map((x) => x[0]), values: topCustomers.map((x) => round(x[1])) },
    byCategory: { labels: byCategory.map((x) => x[0]), values: byCategory.map((x) => round(x[1])) },
    recent: [...docs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15),
  };
}
module.exports = { dashboard };

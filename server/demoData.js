// Dati fittizi deterministici (stessa forma dei documenti normalizzati di Midware).
function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const products = [['Caffè 250g', 'Alimentari', 4.2], ['Pasta 500g', 'Alimentari', 1.4], ['Latte 1L', 'Latticini', 1.6], ['Mozzarella', 'Latticini', 2.3],
  ['Detersivo', 'Casa', 5.9], ['Carta igienica', 'Casa', 4.5], ['Acqua 6x', 'Bevande', 2.8], ['Vino rosso', 'Bevande', 7.9], ['Shampoo', 'Igiene', 3.7], ['Dentifricio', 'Igiene', 2.1]];
const pos = ['CASSA 1', 'CASSA 2', 'CASSA 3'];
const pay = ['CONTANTI', 'CARTA', 'BUONI PASTO'];

function demoDocuments(from, to) {
  const r = rng(42); const out = []; const start = Date.now() - 400 * 864e5;
  for (let i = 0; i < 1500; i++) {
    const date = new Date(start + r() * 400 * 864e5).toISOString().slice(0, 10);
    const rows = Array.from({ length: 1 + Math.floor(r() * 5) }, () => {
      const [product, department, price] = products[Math.floor(r() * r() * products.length)];
      const qty = 1 + Math.floor(r() * 3);
      return { product, department, qty, amount: Math.round(price * qty * 100) / 100, cost: Math.round(price * qty * (0.55 + r() * 0.2) * 100) / 100 };
    });
    const net = Math.round(rows.reduce((s, x) => s + x.amount, 0) * 100) / 100;
    const total = Math.round(net * 1.1 * 100) / 100;
    out.push({ number: String(299000000000 + i), type: 'VEN', date, pos: pos[Math.floor(r() * pos.length)], total, net, rows,
      payments: [{ type: pay[Math.floor(r() * r() * pay.length)], amount: total }] });
  }
  return out.filter((d) => d.date >= from && d.date <= to);
}
module.exports = { demoDocuments };

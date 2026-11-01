// Dati fittizi deterministici per provare l'app senza Midware.
function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const customers = ['Rossi Srl', 'Bianchi SpA', 'Verdi & C.', 'Alfa Impianti', 'Beta Forniture', 'Gamma Service', 'Delta Costruzioni', 'Omega Tech'];
const categories = ['Hardware', 'Software', 'Assistenza', 'Ricambi', 'Consulenza'];

function demoDocuments(from, to) {
  const r = rng(42);
  const out = [];
  const start = new Date(Date.now() - 400 * 864e5);
  for (let i = 0; i < 900; i++) {
    const date = new Date(start.getTime() + r() * 400 * 864e5).toISOString().slice(0, 10);
    const amount = Math.round((200 + r() * r() * 9000) * 100) / 100;
    out.push({
      number: `FT-${String(1000 + i)}`,
      date,
      customer: customers[Math.floor(r() * r() * customers.length)],
      category: categories[Math.floor(r() * categories.length)],
      amount,
      cost: Math.round(amount * (0.5 + r() * 0.3) * 100) / 100,
    });
  }
  return out.filter((d) => d.date >= from && d.date <= to);
}
module.exports = { demoDocuments };

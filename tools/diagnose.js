// Diagnostica del collegamento al WService Midware.
// Uso:  npm run diagnose     (con .env configurato)
// Scrive diagnose-report.txt: contiene solo statistiche e nomi di campo,
// NESSUN dato personale, importo di singoli documenti, utente o password.
const fs = require('fs');
const path = require('path');
const cfg = require('../server/config');
const { getRawDocuments } = require('../server/midwareClient');

const out = [];
const log = (...a) => { const l = a.join(' '); out.push(l); console.log(l); };
const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

(async () => {
  log('== Diagnostica SimplyPulse / Midware ==');
  log('Data:', new Date().toISOString());
  log('Node:', process.version, '| TLS autofirmato accettato:', cfg.midware.insecureTls);
  log('Host WService:', cfg.midware.baseUrl.replace(/^(https?:\/\/)[^@]*@/, '$1'));
  log('Tipi documento considerati vendite:', cfg.midware.docTypes.join(','));

  const t0 = Date.now();
  let docs;
  try { docs = await getRawDocuments(); }
  catch (e) { log('ERRORE:', e.message); fs.writeFileSync(path.join(__dirname, '..', 'diagnose-report.txt'), out.join('\n')); process.exit(1); }
  log(`Login + lettura documenti OK in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  log('Documenti ricevuti:', docs.length, '| dimensione JSON approx:', (JSON.stringify(docs).length / 1048576).toFixed(1), 'MB');

  const byType = {};
  for (const d of docs) byType[d.documenttype] = (byType[d.documenttype] || 0) + 1;
  log('Per tipo documento:', JSON.stringify(byType));

  const dates = docs.map((d) => String(d.documentdate || d.movementdate || '').slice(0, 10)).filter(Boolean).sort();
  log('Intervallo date:', dates[0], '->', dates[dates.length - 1]);
  log('Documenti annullati (canceleddocument valorizzato):', docs.filter((d) => d.canceleddocument).length);

  // Struttura: per ogni campo quante volte è presente e di che tipo
  const fields = {}; const rowFields = {}; const payFields = {};
  const scan = (obj, acc) => { for (const [k, v] of Object.entries(obj)) { (acc[k] ||= { n: 0, t: new Set() }).n++; acc[k].t.add(typeOf(v)); } };
  for (const d of docs) {
    scan(d, fields);
    for (const r of d.documentrows || []) scan(r, rowFields);
    for (const p of d.payments || []) scan(p, payFields);
  }
  const dump = (name, acc, total) => {
    log(`\n-- Campi ${name} (presenza/tipo) --`);
    for (const [k, v] of Object.entries(acc).sort()) log(`${k.padEnd(32)} ${String(v.n).padStart(8)}/${total}  ${[...v.t].join('|')}`);
  };
  dump('documento', fields, docs.length);
  const nRows = docs.reduce((s, d) => s + (d.documentrows || []).length, 0);
  dump('riga', rowFields, nRows);
  dump('pagamento', payFields, docs.reduce((s, d) => s + (d.payments || []).length, 0));

  // Controlli sui campi usati dall'app
  log('\n-- Controlli campi usati dall\'app --');
  const sales = docs.filter((d) => cfg.midware.docTypes.includes(d.documenttype));
  const rows = sales.flatMap((d) => d.documentrows || []);
  const pct = (n, t) => (t ? ((n / t) * 100).toFixed(0) + '%' : 'n/d');
  log('Documenti di vendita:', sales.length);
  log('  con documenttotal > 0:', pct(sales.filter((d) => Number(d.documenttotal) > 0).length, sales.length));
  log('  con almeno un pagamento:', pct(sales.filter((d) => (d.payments || []).length).length, sales.length));
  log('Righe di vendita:', rows.length);
  log('  rowtype:', JSON.stringify(rows.reduce((a, r) => ((a[r.rowtype ?? 'null'] = (a[r.rowtype ?? 'null'] || 0) + 1), a), {})));
  log('  con nettotalprice > 0:', pct(rows.filter((r) => Number(r.nettotalprice) > 0).length, rows.length));
  log('  con nettotalcost > 0 (serve per il margine):', pct(rows.filter((r) => Number(r.nettotalcost) > 0).length, rows.length));
  log('  con departmentname:', pct(rows.filter((r) => r.departmentname).length, rows.length));
  const sum = (a, f) => a.reduce((s, x) => s + (Number(f(x)) || 0), 0);
  log('Somma documenttotal vendite:', sum(sales, (d) => d.documenttotal).toFixed(2));
  log('Somma pagamenti vendite:', sum(sales.flatMap((d) => d.payments || []), (p) => p.totalpayment).toFixed(2));
  log('Somma taxabletotal vendite:', sum(sales, (d) => d.taxabletotal).toFixed(2));
  log('Somma nettotalprice righe:', sum(rows, (r) => r.nettotalprice).toFixed(2));

  fs.writeFileSync(path.join(__dirname, '..', 'diagnose-report.txt'), out.join('\n'));
  log('\nReport salvato in diagnose-report.txt (incollane il contenuto nella chat).');
})();

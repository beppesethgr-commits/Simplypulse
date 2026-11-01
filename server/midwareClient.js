// Client per il WService Midware (SimplyDevelop) - API REST/JSON, porta 3055.
// Flusso: POST /api/login -> SessionCode (scade dopo 30 min di inattività)
//         GET  /api/documents/{SessionCode} -> documenti con righe, reparti, pagamenti
const https = require('https');
const cfg = require('./config');

const agent = new https.Agent({ rejectUnauthorized: !cfg.midware.insecureTls });

function request(method, path, body) {
  if (!cfg.midware.baseUrl) return Promise.reject(new Error('MIDWARE_BASE_URL non configurato'));
  const url = new URL(cfg.midware.baseUrl + path);
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method, agent, timeout: 60000,
      headers: { Accept: 'application/json', ...(payload && { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }) },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch { /* non JSON */ }
        if (res.statusCode >= 400 || !json) {
          return reject(new Error(`Midware ha risposto ${res.statusCode}${json ? '' : ' (risposta non JSON)'}`));
        }
        resolve(json);
      });
    });
    req.on('timeout', () => req.destroy(new Error('Timeout nella chiamata a Midware')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let session = null; // { code, at }
async function login() {
  const r = await request('POST', '/api/login', { User: cfg.midware.user, Password: cfg.midware.password });
  if (!r.SuccessStatus || !r.SessionCode) throw new Error('Login Midware rifiutato: controlla MIDWARE_USER e MIDWARE_PASSWORD');
  session = { code: r.SessionCode, at: Date.now() };
  return session.code;
}
async function sessionCode() {
  // rinnovo prudenziale prima dei 30 minuti
  return session && Date.now() - session.at < 25 * 60000 ? session.code : login();
}

async function getRawDocuments() {
  const call = async () => request('GET', `/api/documents/${encodeURIComponent(await sessionCode())}`);
  let r = await call();
  if (!r.SuccessStatus) { session = null; r = await call(); } // sessione scaduta: riprova una volta
  if (!r.SuccessStatus) throw new Error('Midware: lettura documenti non riuscita');
  return r.documents || [];
}

const num = (x) => Number(x) || 0;
function normalize(d) {
  const rows = (d.documentrows || [])
    .filter((r) => r.rowtype === 'P' || !r.rowtype) // solo righe prodotto/reparto
    .map((r) => ({
      product: r.rowdescription || r.productcode || 'N/D',
      department: r.departmentname || 'Senza reparto',
      qty: num(r.qtymovement),
      amount: num(r.nettotalprice) || num(r.totalprice),
      cost: num(r.nettotalcost) || num(r.totalcost),
    }));
  return {
    number: d.documenttransactionnumber || String(d.documentnumber ?? d.idmovement),
    type: d.documenttype,
    date: String(d.documentdate || d.movementdate || '').slice(0, 10),
    pos: d.posname || d.originname || 'N/D',
    total: num(d.documenttotal),
    net: num(d.taxabletotal),
    rows,
    payments: (d.payments || []).map((p) => ({ type: p.paymenttype || 'Altro', amount: num(p.totalpayment) })),
  };
}

let cache = { at: 0, docs: null };
async function fetchDocuments(from, to) {
  if (!cache.docs || Date.now() - cache.at > cfg.midware.cacheSeconds * 1000) {
    const raw = await getRawDocuments();
    cache = { at: Date.now(), docs: raw.filter((d) => cfg.midware.docTypes.includes(d.documenttype) && !d.canceleddocument).map(normalize) };
  }
  return cache.docs.filter((d) => d.date >= from && d.date <= to);
}
module.exports = { fetchDocuments };

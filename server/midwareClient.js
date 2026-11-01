const cfg = require('./config');
const mapping = require('./midware.mapping');

function authHeaders() {
  const m = cfg.midware;
  switch (m.auth) {
    case 'bearer': return { Authorization: `Bearer ${m.token}` };
    case 'apikey': return { [m.apiKeyHeader]: m.token };
    case 'basic':
      return { Authorization: 'Basic ' + Buffer.from(`${m.user}:${m.password}`).toString('base64') };
    default: return {};
  }
}

const fill = (v, vars) =>
  typeof v === 'string' ? v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : v;
const fillObj = (o, vars) =>
  o && Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fill(v, vars)]));
const dig = (obj, p) => (p ? p.split('.').reduce((a, k) => a?.[k], obj) : obj);

// Recupera i documenti dal web service e li normalizza nel formato interno.
async function fetchDocuments(from, to) {
  if (!cfg.midware.baseUrl) throw new Error('MIDWARE_BASE_URL non configurato');
  const d = mapping.documents;
  const vars = { from, to };
  const url = new URL(cfg.midware.baseUrl + d.path);
  for (const [k, v] of Object.entries(fillObj(d.params, vars) || {})) url.searchParams.set(k, v);

  const res = await fetch(url, {
    method: d.method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...authHeaders() },
    body: d.method !== 'GET' && d.body ? JSON.stringify(fillObj(d.body, vars)) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Midware ha risposto ${res.status} ${res.statusText}`);
  const json = await res.json();
  const rows = dig(json, d.rowsPath);
  if (!Array.isArray(rows)) throw new Error('Risposta Midware inattesa: controlla rowsPath in midware.mapping.js');

  const f = d.fields;
  return rows.map((r) => ({
    number: r[f.number],
    date: String(r[f.date] ?? '').slice(0, 10),
    customer: r[f.customer] || 'N/D',
    category: r[f.category] || 'Altro',
    amount: Number(r[f.amount]) || 0,
    cost: Number(r[f.cost]) || 0,
  }));
}

module.exports = { fetchDocuments };

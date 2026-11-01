const path = require('path');
const express = require('express');
const session = require('express-session');
const cfg = require('./config');
const users = require('./users');
const { fetchDocuments } = require('./midwareClient');
const { demoDocuments } = require('./demoData');
const { dashboard } = require('./analytics');

users.ensureAdmin();
const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(session({
  name: 'sp.sid',
  secret: cfg.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', maxAge: 8 * 3600 * 1000, secure: 'auto' },
}));
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' });
  next();
});

// Anti brute-force semplice: 8 tentativi / 15 minuti per IP
const attempts = new Map();
function limited(ip) {
  const now = Date.now();
  const a = (attempts.get(ip) || []).filter((t) => now - t < 900000);
  attempts.set(ip, a);
  return a.length >= 8;
}

app.post('/api/login', (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: 'Troppi tentativi, riprova più tardi' });
  const { username, password } = req.body || {};
  const user = typeof username === 'string' && typeof password === 'string' && users.verify(username, password);
  if (!user) {
    attempts.get(req.ip).push(Date.now());
    return res.status(401).json({ error: 'Credenziali non valide' });
  }
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Errore sessione' });
    req.session.user = user.username;
    res.json({ username: user.username });
  });
});
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
const requireAuth = (req, res, next) =>
  req.session.user ? next() : res.status(401).json({ error: 'Non autenticato' });
app.get('/api/me', requireAuth, (req, res) => res.json({ username: req.session.user, mode: cfg.dataMode }));

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
app.get('/api/dashboard', requireAuth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const yearAgo = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
  const from = isDate(req.query.from) ? req.query.from : yearAgo;
  const to = isDate(req.query.to) ? req.query.to : today;
  try {
    const docs = cfg.dataMode === 'live' ? await fetchDocuments(from, to) : demoDocuments(from, to);
    res.json({ mode: cfg.dataMode, from, to, ...dashboard(docs) });
  } catch (err) {
    console.error('[midware]', err.message);
    res.status(502).json({ error: `Errore dal web service: ${err.message}` });
  }
});

// Pagine: la dashboard richiede login
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', req.session.user ? 'dashboard.html' : 'login.html')));
app.use(express.static(path.join(__dirname, '..', 'public'), { index: false, extensions: ['html'] }));

app.listen(cfg.port, () => console.log(`SimplyPulse su http://localhost:${cfg.port} (modalità ${cfg.dataMode})`));

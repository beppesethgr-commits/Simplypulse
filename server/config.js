// Carica .env (senza dipendenze) e centralizza la configurazione.
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const e = process.env;
module.exports = {
  port: Number(e.PORT) || 3000,
  sessionSecret: e.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  adminUser: e.ADMIN_USER || 'admin',
  adminPassword: e.ADMIN_PASSWORD || 'admin',
  dataMode: (e.DATA_MODE || 'demo').toLowerCase(),
  midware: {
    baseUrl: (e.MIDWARE_BASE_URL || '').replace(/\/$/, ''),
    user: e.MIDWARE_USER || '',
    password: e.MIDWARE_PASSWORD || '',
    // Il WService usa spesso un certificato autofirmato: metti true per accettarlo
    insecureTls: /^(1|true|yes)$/i.test(e.MIDWARE_INSECURE_TLS || ''),
    // Tipi di documento considerati vendite (vedi Tabella 1 della documentazione)
    docTypes: (e.MIDWARE_DOC_TYPES || 'VEN,DCC,DUC').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean),
    cacheSeconds: Number(e.MIDWARE_CACHE_SECONDS) || 60,
  },
  usersFile: path.join(__dirname, '..', 'data', 'users.json'),
};

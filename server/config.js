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
    auth: (e.MIDWARE_AUTH || 'none').toLowerCase(),
    token: e.MIDWARE_TOKEN || '',
    apiKeyHeader: e.MIDWARE_API_KEY_HEADER || 'X-API-Key',
    user: e.MIDWARE_USER || '',
    password: e.MIDWARE_PASSWORD || '',
  },
  usersFile: path.join(__dirname, '..', 'data', 'users.json'),
};

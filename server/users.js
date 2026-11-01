const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const cfg = require('./config');

function load() {
  try { return JSON.parse(fs.readFileSync(cfg.usersFile, 'utf8')); } catch { return []; }
}
function save(users) {
  fs.mkdirSync(path.dirname(cfg.usersFile), { recursive: true });
  fs.writeFileSync(cfg.usersFile, JSON.stringify(users, null, 2), { mode: 0o600 });
}
function addUser(username, password) {
  const users = load().filter((u) => u.username !== username);
  users.push({ username, hash: bcrypt.hashSync(password, 12) });
  save(users);
}
function ensureAdmin() {
  if (!fs.existsSync(cfg.usersFile)) addUser(cfg.adminUser, cfg.adminPassword);
}
function verify(username, password) {
  const u = load().find((x) => x.username === username);
  // confronto sempre eseguito per non rivelare se l'utente esiste
  const ok = bcrypt.compareSync(password, u ? u.hash : '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi');
  return u && ok ? { username: u.username } : null;
}
module.exports = { addUser, ensureAdmin, verify };

const { addUser } = require('./users');
const [, , user, pass] = process.argv;
if (!user || !pass) { console.error('Uso: npm run adduser -- <utente> <password>'); process.exit(1); }
addUser(user, pass);
console.log(`Utente "${user}" salvato.`);

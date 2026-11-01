# SimplyPulse

Dashboard web (grafici + login) per i dati del gestionale **SimplyDevelop**, letti tramite il web service **Midware**.

## Avvio
```bash
npm install
cp .env.example .env     # imposta SESSION_SECRET, ADMIN_USER/ADMIN_PASSWORD
npm start                # http://localhost:3000
npm run adduser -- mario password   # aggiunge/aggiorna un utente
```
Con `DATA_MODE=demo` (default) usa dati fittizi. Per i dati reali: `DATA_MODE=live`.

## Collegamento a Midware
1. In `.env`: `MIDWARE_BASE_URL`, tipo di autenticazione (`bearer`, `apikey`, `basic`) e credenziali.
2. In `server/midware.mapping.js`: endpoint, parametri di data, `rowsPath` e nome dei campi (numero, data, cliente, categoria, importo, costo).
Le chiamate a Midware partono solo dal server: credenziali e token non arrivano mai al browser.

Nota: il mapping è provvisorio perché la documentazione Midware non era consultabile; va allineato alle API reali (se il servizio è SOAP, si adatta `server/midwareClient.js`).

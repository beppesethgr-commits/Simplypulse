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

## Collegamento a Midware (WService SimplyDevelop)
Basato sulla documentazione "Midware API" (REST/JSON, porta TCP 3055):
- `POST /api/login` con `User` e `Password` restituisce un `SessionCode` (valido 30 minuti; il client lo rinnova da solo);
- `GET /api/documents/{SessionCode}` restituisce i documenti con righe, reparti e pagamenti.

In `.env` imposta `MIDWARE_BASE_URL`, `MIDWARE_USER`, `MIDWARE_PASSWORD` (utente creato in WService, sezione Midware) e `DATA_MODE=live`.
Se il certificato è autofirmato, `MIDWARE_INSECURE_TLS=true`. Le chiamate partono solo dal server: le credenziali non arrivano al browser.

Il server deve poter raggiungere il WService in rete (stessa LAN o VPN).
I filtri per data non sono documentati: i documenti vengono letti e filtrati dal server (con cache di 60 s).

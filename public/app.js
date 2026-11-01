const $ = (id) => document.getElementById(id);
const eur = (n) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
const PAL = ['#4f8cff', '#35c9a5', '#f5a524', '#b57bff', '#ff6b6b', '#5cc8ff', '#9bd04b', '#ff8fcf'];
const charts = {};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function draw(id, cfg) {
  charts[id]?.destroy();
  charts[id] = new Chart($(id), { ...cfg, options: { responsive: true, maintainAspectRatio: false, ...cfg.options } });
}
async function load() {
  $('err').textContent = '';
  const q = new URLSearchParams();
  if ($('from').value) q.set('from', $('from').value);
  if ($('to').value) q.set('to', $('to').value);
  const r = await fetch('/api/dashboard?' + q);
  if (r.status === 401) return (location.href = '/');
  const d = await r.json();
  if (!r.ok) return ($('err').textContent = d.error || 'Errore');
  $('from').value = d.from; $('to').value = d.to;
  $('mode').textContent = d.mode === 'live' ? 'Midware live' : 'Dati demo';
  const k = d.kpi;
  $('kpis').innerHTML = [
    ['Incasso', eur(k.revenue)], ['Documenti', k.documents], ['Scontrino medio', eur(k.avgDocument)],
    ['Articoli venduti', k.items.toLocaleString('it-IT')], ['Margine', k.margin == null ? '—' : k.margin + ' %'],
  ].map(([l, v]) => `<div class="card kpi"><small>${l}</small><b>${v}</b></div>`).join('');
  draw('c1', { type: 'line', data: { labels: d.monthly.labels, datasets: [{ label: 'Incasso', data: d.monthly.values, borderColor: PAL[0], backgroundColor: PAL[0] + '33', fill: true, tension: .3 }] }, options: { plugins: { legend: { display: false } } } });
  draw('c2', { type: 'bar', data: { labels: d.topProducts.labels, datasets: [{ data: d.topProducts.values, backgroundColor: PAL[1] }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } } } });
  const donut = (id, s) => draw(id, { type: 'doughnut', data: { labels: s.labels, datasets: [{ data: s.values, backgroundColor: PAL, borderWidth: 0 }] }, options: { plugins: { legend: { position: 'bottom' } } } });
  donut('c3', d.byDepartment); donut('c4', d.byPayment);
  $('rows').innerHTML = d.recent.map((x) => `<tr><td>${esc(x.number)}</td><td>${esc(x.date)}</td><td>${esc(x.type)}</td><td>${esc(x.pos)}</td><td class="n">${eur(x.total)}</td></tr>`).join('');
}
$('go').onclick = load;
$('out').onclick = async () => { await fetch('/api/logout', { method: 'POST' }); location.href = '/'; };
fetch('/api/me').then((r) => r.json()).then((m) => ($('user').textContent = m.username)).catch(() => {});
load();

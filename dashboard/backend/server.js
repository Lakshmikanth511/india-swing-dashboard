'use strict';
// Load .env from dashboard folder or repo root
const path0 = require('path');
require('dotenv').config({ path: path0.join(__dirname, '../.env') });
require('dotenv').config({ path: path0.join(__dirname, '../../.env') }); // repo root fallback

const express   = require('express');
const cors      = require('cors');
const compress  = require('compression');
const path      = require('path');
const fs        = require('fs');
const cron      = require('node-cron');

const { initDb } = require('./db');
const setupDb    = require('./setup-db');

const app  = express();
const PORT = parseInt(process.env.PORT) || 3000;
const REFRESH_MS = parseInt(process.env.REFRESH_INTERVAL_MS) || 30000;

// ── Middleware (NO helmet – it blocks SSE headers) ────────────────────────────
app.use(compress());
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});
app.use(express.json({ limit: '1mb' }));

const publicDir = path.join(__dirname, '../frontend/public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
app.use(express.static(publicDir));

// ── SSE – must be registered early, before any route that might conflict ──────
const SSE_CLIENTS = new Set();

app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection':    'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });
  // Send an immediate connected event so the client knows it's alive
  res.write('event: connected\ndata: {"ok":true}\n\n');

  const hb = setInterval(() => {
    try { res.write(':hb\n\n'); } catch { clearInterval(hb); SSE_CLIENTS.delete(res); }
  }, 15000);

  SSE_CLIENTS.add(res);
  req.on('close', () => { clearInterval(hb); SSE_CLIENTS.delete(res); });
  req.on('error', () => { clearInterval(hb); SSE_CLIENTS.delete(res); });
});

function broadcast(event, data) {
  if (SSE_CLIENTS.size === 0) return;
  const p = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of SSE_CLIENTS) {
    try { c.write(p); } catch { SSE_CLIENTS.delete(c); }
  }
}

// ── Main async startup ────────────────────────────────────────────────────────
async function main() {
  console.log('[startup] Initialising DB…');
  await initDb();
  await setupDb();
  console.log('[startup] DB ready ✅');

  // Load DB-dependent modules after initDb
  const routes = require('./routes');
  const { fetchIndexPrices, getLatestIndexPrices } = require('./market-data');
  const { refreshNews }    = require('./news-service');
  const { syncWatchlistToDb, syncMetricsToDb } = require('./scanner-service');
  const { generateRecommendations } = require('./recommendations');

  app.use('/api', routes);
  app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

  // ── Background refresh ────────────────────────────────────────────────────
  let refreshing = false;
  async function refreshCycle() {
    if (refreshing) return;
    refreshing = true;
    try {
      const indices = await fetchIndexPrices();
      const ist = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      if (indices && indices.length > 0) {
        broadcast('indices', { data: indices, updated_at: ist, source: 'yahoo_delayed' });
      }
      broadcast('tick', { updated_at: ist, clients: SSE_CLIENTS.size });
    } catch (e) { console.warn('[refresh]', e.message); }
    finally { refreshing = false; }
  }

  setInterval(refreshCycle, REFRESH_MS);

  cron.schedule('*/5 * * * *', async () => {
    try { const r = await refreshNews(); broadcast('news', { saved: r.saved, updated_at: new Date().toISOString() }); }
    catch (e) { console.warn('[news-cron]', e.message); }
  });

  cron.schedule('*/10 * * * *', () => {
    try {
      const t = syncWatchlistToDb(), f = syncMetricsToDb();
      generateRecommendations();
      broadcast('screener', { t, f });
    } catch (e) { console.warn('[sync-cron]', e.message); }
  });

  // ── Listen ────────────────────────────────────────────────────────────────
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n🚀  http://localhost:${PORT}`);

    try { syncWatchlistToDb(); syncMetricsToDb(); generateRecommendations(); console.log('[startup] Scanner synced ✅'); }
    catch (e) { console.warn('[startup-scan]', e.message); }

    try {
      const idx = await fetchIndexPrices();
      console.log(`[startup] Indices fetched: ${idx.length} ✅`);
      // Broadcast immediately so any early SSE client gets data
      broadcast('indices', { data: idx, updated_at: new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}), source: 'yahoo_delayed' });
    } catch (e) { console.warn('[startup-idx]', e.message); }

    try { const r = await refreshNews(); console.log(`[startup] News: ${r.saved} new items ✅`); }
    catch (e) { console.warn('[startup-news]', e.message); }
  });
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

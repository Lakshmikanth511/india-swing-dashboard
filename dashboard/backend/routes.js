'use strict';
/**
 * Express router – all /api/* endpoints for the dashboard frontend.
 */
const express = require('express');
const router  = express.Router();
const { getLatestIndexPrices, refreshStockPrices, getLatestStockPrices } = require('./market-data');
const { getScreenerData, getFullWatchlistData, syncWatchlistToDb, syncMetricsToDb } = require('./scanner-service');
const { getLatestNews, refreshNews } = require('./news-service');
const { getRecommendations, generateRecommendations } = require('./recommendations');
const { getConfig, updateConfig, sizePosition, getPortfolioSummary, getTrades, addTrade, closeTrade } = require('./portfolio');
const { getDb } = require('./db');

// ── Market data ─────────────────────────────────────────────────────────────
router.get('/indices', (req, res) => {
  try {
    const data = getLatestIndexPrices();
    res.json({ ok: true, data, source: 'yahoo_delayed', note: 'Prices are delayed. Not live.' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/indices/refresh', async (req, res) => {
  try {
    const { fetchIndexPrices } = require('./market-data');
    const data = await fetchIndexPrices();
    res.json({ ok: true, data, refreshed: data.length });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/stocks/prices', (req, res) => {
  try {
    const symbols = (req.query.symbols || '').split(',').filter(Boolean);
    const data = getLatestStockPrices(symbols);
    res.json({ ok: true, data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/stocks/prices/refresh', async (req, res) => {
  try {
    const { symbols } = req.body;
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ ok: false, error: 'symbols array required' });
    }
    const data = await refreshStockPrices(symbols.slice(0, 50));
    res.json({ ok: true, refreshed: Object.keys(data).length });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Screener ─────────────────────────────────────────────────────────────────
router.get('/screener', (req, res) => {
  try {
    const { cap, sector, rsi_min, rsi_max, setup, limit, offset, sort, order } = req.query;
    const data = getScreenerData({
      cap, sector,
      rsi_min: parseFloat(rsi_min) || 0,
      rsi_max: parseFloat(rsi_max) || 100,
      setup,
      limit: Math.min(parseInt(limit) || 50, 200),
      offset: parseInt(offset) || 0,
      sort: sort || 'rsi_14',
      order: order || 'DESC',
    });
    res.json({ ok: true, data, count: data.length });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/screener/watchlist', (req, res) => {
  try {
    const data = getFullWatchlistData();
    res.json({ ok: true, data, count: data.length });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/screener/sync', (req, res) => {
  try {
    const tech = syncWatchlistToDb();
    const fund = syncMetricsToDb();
    res.json({ ok: true, technical_synced: tech, fundamentals_synced: fund });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Stock detail ──────────────────────────────────────────────────────────────
router.get('/stock/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const db = getDb();
    const tech = db.prepare(`
      SELECT * FROM technical_data WHERE symbol = ? ORDER BY close_date DESC LIMIT 1
    `).get(symbol);
    const fund = db.prepare(`
      SELECT * FROM fundamentals WHERE symbol = ? ORDER BY fetched_at DESC LIMIT 1
    `).get(symbol);
    const price = db.prepare(`
      SELECT * FROM price_snapshots WHERE symbol = ? ORDER BY fetched_at DESC LIMIT 1
    `).get(symbol);
    const rec = db.prepare(`
      SELECT * FROM recommendations WHERE symbol = ? AND is_active = 1
    `).get(symbol);
    const news = db.prepare(`
      SELECT * FROM news_items WHERE symbols LIKE ? ORDER BY pub_date DESC LIMIT 10
    `).all(`%${symbol}%`);
    res.json({ ok: true, symbol, tech, fund, price, rec, news });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Recommendations ──────────────────────────────────────────────────────────
router.get('/recommendations', (req, res) => {
  try {
    const { action, cap, limit, offset, minScore } = req.query;
    const data = getRecommendations({
      action, cap,
      limit: Math.min(parseInt(limit) || 50, 200),
      offset: parseInt(offset) || 0,
      minScore: parseInt(minScore) || 0,
    });
    res.json({ ok: true, data, count: data.length });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/recommendations/generate', (req, res) => {
  try {
    const count = generateRecommendations();
    res.json({ ok: true, generated: count });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── News ─────────────────────────────────────────────────────────────────────
router.get('/news', (req, res) => {
  try {
    const { symbol, sentiment, limit } = req.query;
    const data = getLatestNews({ symbol, sentiment, limit: Math.min(parseInt(limit) || 50, 200) });
    res.json({ ok: true, data, count: data.length });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/news/refresh', async (req, res) => {
  try {
    const result = await refreshNews();
    res.json({ ok: true, ...result });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Portfolio ─────────────────────────────────────────────────────────────────
router.get('/portfolio', (req, res) => {
  try {
    const summary = getPortfolioSummary();
    const config  = getConfig();
    const trades  = getTrades();
    res.json({ ok: true, summary, config, trades });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.put('/portfolio/capital', (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, error: 'Valid capital amount required' });
    }
    updateConfig('working_capital', amount);
    res.json({ ok: true, working_capital: amount });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/portfolio/size', (req, res) => {
  try {
    const { entry, stopLoss } = req.body;
    if (!entry || !stopLoss) return res.status(400).json({ ok: false, error: 'entry and stopLoss required' });
    const result = sizePosition(parseFloat(entry), parseFloat(stopLoss));
    if (!result) return res.json({ ok: false, error: 'Cannot size: stop too far or zero qty' });
    res.json({ ok: true, ...result });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/portfolio/trades', (req, res) => {
  try {
    const trade = req.body;
    const info = addTrade(trade);
    res.json({ ok: true, id: info.lastInsertRowid });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.put('/portfolio/trades/:id/close', (req, res) => {
  try {
    const { exitPrice, reason } = req.body;
    const result = closeTrade(parseInt(req.params.id), parseFloat(exitPrice), reason);
    if (!result) return res.status(404).json({ ok: false, error: 'Trade not found' });
    res.json({ ok: true, ...result });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Watchlist ─────────────────────────────────────────────────────────────────
router.get('/watchlist', (req, res) => {
  try {
    const db = getDb();
    const data = db.prepare('SELECT * FROM watchlist ORDER BY added_at DESC').all();
    res.json({ ok: true, data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/watchlist', (req, res) => {
  try {
    const { symbol, name, notes } = req.body;
    if (!symbol) return res.status(400).json({ ok: false, error: 'symbol required' });
    const db = getDb();
    db.prepare(`
      INSERT OR IGNORE INTO watchlist (symbol, name, notes) VALUES (?, ?, ?)
    `).run(symbol.toUpperCase(), name || symbol, notes || '');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.delete('/watchlist/:symbol', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM watchlist WHERE symbol = ?').run(req.params.symbol.toUpperCase());
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Alerts ────────────────────────────────────────────────────────────────────
router.get('/alerts', (req, res) => {
  try {
    const db = getDb();
    const data = db.prepare('SELECT * FROM alerts WHERE is_active = 1 ORDER BY created_at DESC').all();
    res.json({ ok: true, data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/alerts', (req, res) => {
  try {
    const { symbol, alert_type, threshold } = req.body;
    if (!symbol || !alert_type || threshold == null) {
      return res.status(400).json({ ok: false, error: 'symbol, alert_type, threshold required' });
    }
    const db = getDb();
    const info = db.prepare(`
      INSERT INTO alerts (symbol, alert_type, threshold) VALUES (?, ?, ?)
    `).run(symbol.toUpperCase(), alert_type, parseFloat(threshold));
    res.json({ ok: true, id: info.lastInsertRowid });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Status / health ──────────────────────────────────────────────────────────
router.get('/status', (req, res) => {
  const db = getDb();
  const techCount  = db.prepare('SELECT COUNT(DISTINCT symbol) AS c FROM technical_data').get()?.c || 0;
  const fundCount  = db.prepare('SELECT COUNT(DISTINCT symbol) AS c FROM fundamentals').get()?.c || 0;
  const newsCount  = db.prepare('SELECT COUNT(*) AS c FROM news_items').get()?.c || 0;
  const recCount   = db.prepare('SELECT COUNT(*) AS c FROM recommendations WHERE is_active=1').get()?.c || 0;
  const lastIndex  = db.prepare('SELECT MAX(fetched_at) AS t FROM index_snapshots').get()?.t;
  res.json({
    ok: true,
    ist: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    techCount, fundCount, newsCount, recCount, lastIndex,
    skillsRoot: process.env.SKILLS_ROOT || '~/.kiro/skills',
    tradingRoot: process.env.TRADING_ROOT,
  });
});

module.exports = router;

'use strict';
/**
 * Portfolio and capital management.
 * Position sizing uses the same formula as india-budget skill:
 *   Qty = MaxRupeeRisk / (Entry - StopLoss)
 * Charges: Zerodha delivery CNC as of 2026-10.
 */
const { getDb } = require('./db');

function getConfig() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM portfolio_config').all();
  const cfg = {};
  for (const r of rows) cfg[r.key] = parseFloat(r.value) || r.value;
  return cfg;
}

function updateConfig(key, value) {
  const db = getDb();
  db.prepare(`
    INSERT INTO portfolio_config (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
  `).run(key, String(value));
}

function calcCharges(entry, stopLoss, qty) {
  // Zerodha CNC delivery charges (2026-10)
  const buy  = entry * qty;
  const sell = stopLoss * qty;
  const stt    = (buy + sell) * 0.001;        // 0.1% both sides
  const exc    = (buy + sell) * 0.0000297;    // NSE exchange
  const sebi   = (buy + sell) / 10_000_000;  // ₹10 per crore
  const stamp  = buy * 0.00015;               // 0.015% on buy
  const gst    = (exc + sebi) * 0.18;
  return +(stt + exc + sebi + stamp + gst).toFixed(2);
}

function sizePosition(entry, stopLoss, cfg = null) {
  if (!cfg) cfg = getConfig();
  const capital     = cfg.working_capital || 200000;
  const riskPct     = (cfg.risk_per_trade_pct || 1.0) / 100;
  const cashResPct  = (cfg.cash_reserve_pct || 15) / 100;
  const maxRisk     = capital * riskPct;
  const riskPerShare = entry - stopLoss;
  if (riskPerShare <= 0) return null;
  const maxQtyByRisk = Math.floor(maxRisk / riskPerShare);
  const deployable  = capital * (1 - cashResPct);
  const maxQtyByCash = Math.floor(deployable / entry);
  const qty = Math.min(maxQtyByRisk, maxQtyByCash, 1000); // cap 1000 shares
  if (qty <= 0) return null;
  const investment = +(entry * qty).toFixed(2);
  const charges    = calcCharges(entry, stopLoss, qty);
  const maxLoss    = +(riskPerShare * qty + charges).toFixed(2);
  return { qty, investment, charges, maxLoss, maxRisk: +maxRisk.toFixed(2) };
}

function getPortfolioSummary() {
  const db = getDb();
  const cfg = getConfig();
  const capital = cfg.working_capital || 200000;
  const cashResPct = (cfg.cash_reserve_pct || 15) / 100;
  const deployed = db.prepare(`
    SELECT SUM(entry_price * quantity) AS total FROM trades WHERE status = 'EXECUTED'
  `).get()?.total || 0;
  const cashReserve = capital * cashResPct;
  const available   = capital - deployed;
  const maxRisk     = capital * (cfg.max_portfolio_risk_pct || 2) / 100;
  return { capital, deployed, available, cashReserve, maxRisk };
}

function getTrades(status = null) {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM trades WHERE status = ? ORDER BY created_at DESC').all(status);
  }
  return db.prepare('SELECT * FROM trades ORDER BY created_at DESC').all();
}

function addTrade(trade) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO trades
      (symbol, name, status, entry_price, quantity, stop_loss, target1, target2, notes, created_at, updated_at)
    VALUES
      (@symbol,@name,@status,@entry_price,@quantity,@stop_loss,@target1,@target2,@notes,datetime('now'),datetime('now'))
  `).run({
    symbol: trade.symbol, name: trade.name || trade.symbol,
    status: trade.status || 'PLANNED',
    entry_price: trade.entry_price, quantity: trade.quantity,
    stop_loss: trade.stop_loss, target1: trade.target1,
    target2: trade.target2, notes: trade.notes || '',
  });
}

function closeTrade(id, exitPrice, reason) {
  const db = getDb();
  const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(id);
  if (!trade) return null;
  const grossPnl = (exitPrice - trade.entry_price) * trade.quantity;
  const charges  = calcCharges(trade.entry_price, exitPrice, trade.quantity);
  const netPnl   = +(grossPnl - charges).toFixed(2);
  db.prepare(`
    UPDATE trades SET
      status='CLOSED', exit_price=?, exit_date=datetime('now'),
      gross_pnl=?, charges=?, net_pnl=?, exit_reason=?, updated_at=datetime('now')
    WHERE id=?
  `).run(exitPrice, +grossPnl.toFixed(2), charges, netPnl, reason, id);
  return { grossPnl: +grossPnl.toFixed(2), netPnl, charges };
}

module.exports = { getConfig, updateConfig, sizePosition, getPortfolioSummary, getTrades, addTrade, closeTrade };

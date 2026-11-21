'use strict';
/**
 * Database setup – creates all tables for the India Swing Dashboard.
 * Called from server.js on startup (async).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { initDb, getDb } = require('./db');

async function setup() {
  await initDb();
  const db = getDb();

  db.exec(`
  -- ─── MARKET DATA ───────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS index_snapshots (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol      TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    ltp         REAL,
    prev_close  REAL,
    open        REAL,
    high        REAL,
    low         REAL,
    day_change  REAL,
    day_change_pct REAL,
    volume      INTEGER,
    source      TEXT    DEFAULT 'yahoo',
    is_live     INTEGER DEFAULT 0,
    fetched_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── STOCKS / UNIVERSE ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS stocks (
    symbol      TEXT PRIMARY KEY,
    name        TEXT,
    exchange    TEXT DEFAULT 'NSE',
    series      TEXT DEFAULT 'EQ',
    sector      TEXT,
    industry    TEXT,
    market_cap_cr REAL,
    cap_category TEXT,  -- Large/Mid/Small
    band        TEXT,
    cas         INTEGER,
    is_fo       INTEGER DEFAULT 0,
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  -- ─── PRICE SNAPSHOTS ───────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS price_snapshots (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol      TEXT NOT NULL,
    price       REAL,
    prev_close  REAL,
    open        REAL,
    high        REAL,
    low         REAL,
    volume      INTEGER,
    day_change  REAL,
    day_change_pct REAL,
    source      TEXT DEFAULT 'yahoo',
    is_live     INTEGER DEFAULT 0,
    fetched_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_price_snapshots_symbol ON price_snapshots(symbol, fetched_at DESC);

  -- ─── TECHNICAL INDICATORS ──────────────────────────────────────
  CREATE TABLE IF NOT EXISTS technical_data (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol      TEXT NOT NULL,
    close_date  TEXT NOT NULL,
    price       REAL,
    rsi_14      REAL,
    ema_20      REAL,
    ema_50      REAL,
    ema_100     REAL,
    ema_200     REAL,
    volume      INTEGER,
    vol_avg_20  INTEGER,
    vol_multiple REAL,
    setups      TEXT,  -- JSON array
    near_upper_circuit INTEGER DEFAULT 0,
    band        TEXT,
    source      TEXT DEFAULT 'india-scanner',
    fetched_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(symbol, close_date)
  );
  CREATE INDEX IF NOT EXISTS idx_tech_symbol ON technical_data(symbol, close_date DESC);

  -- ─── FUNDAMENTALS ──────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS fundamentals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol      TEXT NOT NULL,
    pe_ratio    REAL,
    industry_pe REAL,
    pb_ratio    REAL,
    roe         REAL,
    roce        REAL,
    eps_ttm     REAL,
    book_value  REAL,
    debt_to_equity REAL,
    market_cap_cr REAL,
    div_yield   REAL,
    revenue_ttm_cr REAL,
    net_profit_ttm_cr REAL,
    revenue_growth_yoy REAL,
    eps_growth_yoy REAL,
    net_margin  REAL,
    ebitda_margin REAL,
    operating_margin REAL,
    source      TEXT DEFAULT 'groww',
    fetched_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_fund_symbol ON fundamentals(symbol, fetched_at DESC);

  -- ─── RECOMMENDATIONS ──────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS recommendations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol      TEXT NOT NULL,
    name        TEXT,
    cap_category TEXT,
    cmp         REAL,
    action      TEXT,  -- BUY / BUY_ON_CONFIRMATION / WATCHLIST / SELL / WAIT
    entry_low   REAL,
    entry_high  REAL,
    stop_loss   REAL,
    target1     REAL,
    target2     REAL,
    upside_pct  REAL,
    rr_t1       REAL,
    rr_t2       REAL,
    rsi         REAL,
    score       INTEGER,
    reason      TEXT,
    breakout_level REAL,
    setup       TEXT,
    is_active   INTEGER DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── RECOMMENDATION AUDIT TRAIL ───────────────────────────────
  CREATE TABLE IF NOT EXISTS recommendation_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    rec_id      INTEGER REFERENCES recommendations(id),
    symbol      TEXT NOT NULL,
    old_action  TEXT,
    new_action  TEXT,
    reason      TEXT,
    changed_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── NEWS ──────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS news_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guid        TEXT UNIQUE,
    headline    TEXT NOT NULL,
    summary     TEXT,
    source      TEXT,
    url         TEXT,
    symbols     TEXT,  -- JSON array
    tags        TEXT,  -- JSON array
    sentiment   TEXT DEFAULT 'neutral',
    pub_date    TEXT,
    fetched_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_news_pub ON news_items(pub_date DESC);

  -- ─── WATCHLIST ─────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS watchlist (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol      TEXT NOT NULL,
    name        TEXT,
    added_at    TEXT NOT NULL DEFAULT (datetime('now')),
    notes       TEXT,
    UNIQUE(symbol)
  );

  -- ─── PORTFOLIO ─────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS portfolio_config (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trades (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol      TEXT NOT NULL,
    name        TEXT,
    status      TEXT DEFAULT 'PLANNED', -- PLANNED | EXECUTED | CLOSED
    entry_price REAL,
    quantity    INTEGER,
    stop_loss   REAL,
    target1     REAL,
    target2     REAL,
    exit_price  REAL,
    exit_date   TEXT,
    gross_pnl   REAL,
    charges     REAL,
    net_pnl     REAL,
    exit_reason TEXT,
    notes       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── ALERTS ────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS alerts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol      TEXT NOT NULL,
    alert_type  TEXT NOT NULL,  -- PRICE_ABOVE / PRICE_BELOW / RSI_ABOVE / RSI_BELOW / BREAKOUT
    threshold   REAL NOT NULL,
    is_active   INTEGER DEFAULT 1,
    triggered   INTEGER DEFAULT 0,
    triggered_at TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── SEED PORTFOLIO CONFIG ─────────────────────────────────────
  INSERT OR IGNORE INTO portfolio_config (key, value) VALUES
    ('working_capital', '200000'),
    ('risk_per_trade_pct', '1.0'),
    ('max_portfolio_risk_pct', '2.0'),
    ('cash_reserve_pct', '15.0'),
    ('holding_period_sessions', '20');
`);

  console.log('✅ Database tables ready');
}

if (require.main === module) {
  setup().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = setup;

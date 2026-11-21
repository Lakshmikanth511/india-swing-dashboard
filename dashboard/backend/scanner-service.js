'use strict';
/**
 * Scanner service – wraps the india-scanner Kiro skill.
 * Runs scan.py daily and loads results into the database.
 * Also loads the existing watchlist.json and metrics.json from trader-in/.
 */
const { execSync, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./db');

const TRADING_ROOT = process.env.TRADING_ROOT || path.join(__dirname, '../../..');
const SKILLS_ROOT  = process.env.SKILLS_ROOT  || path.join(require('os').homedir(), '.kiro/skills');
const SCANNER_SKILL = path.join(SKILLS_ROOT, 'india-scanner/scan.py');
const TRADER_IN    = path.join(TRADING_ROOT, 'trader-in');

// NSE sector classification (best-effort based on NIFTY index memberships)
const SECTOR_MAP = {
  HDFCBANK:'Banking', AXISBANK:'Banking', ICICIBANK:'Banking', SBIN:'Banking',
  KOTAKBANK:'Banking', INDUSINDBK:'Banking', BANKBARODA:'Banking',
  PNB:'Banking', CANBK:'Banking', UNIONBANK:'Banking', FEDERALBNK:'Banking',
  IDFCFIRSTB:'Banking', CUB:'Banking',
  TCS:'IT', INFY:'IT', WIPRO:'IT', HCLTECH:'IT', TECHM:'IT',
  PERSISTENT:'IT', COFORGE:'IT', TATATECH:'IT', LTIM:'IT', MPHASIS:'IT',
  RELIANCE:'Energy/Diversified', ONGC:'Energy', BPCL:'Energy', IOC:'Energy',
  COALINDIA:'Energy', NTPC:'Energy', POWERGRID:'Power', ADANIPOWER:'Power',
  TATAPOWER:'Power', NHPC:'Power', IREDA:'Power', CESC:'Power',
  BAJFINANCE:'NBFC', BAJAJFINSV:'NBFC', CHOLAFIN:'NBFC', SHRIRAMFIN:'NBFC',
  LICHSGFIN:'NBFC', POONAWALLA:'NBFC', MFSL:'Insurance',
  LICI:'Insurance', HDFCLIFE:'Insurance', SBILIFE:'Insurance',
  MARUTI:'Auto', TATAMOTORS:'Auto', 'M&M':'Auto', EICHERMOT:'Auto',
  BAJAJ_AUTO:'Auto', HEROMOTOCO:'Auto', TVSMOTORS:'Auto',
  SUNPHARMA:'Pharma', DRREDDY:'Pharma', CIPLA:'Pharma', DIVISLAB:'Pharma',
  APOLLOHOSP:'Healthcare', MAXHEALTH:'Healthcare',
  BHARTIARTL:'Telecom', IDEA:'Telecom', TTML:'Telecom',
  HINDUNILVR:'FMCG', ITC:'FMCG', NESTLEIND:'FMCG', BRITANNIA:'FMCG',
  DABUR:'FMCG', MARICO:'FMCG', TATACONSUM:'FMCG',
  TATASTEEL:'Metals', JSWSTEEL:'Metals', HINDALCO:'Metals',
  VEDL:'Metals', NATIONALUM:'Metals', SAIL:'Metals',
  ULTRACEMCO:'Cement', SHREECEM:'Cement', AMBUJACEM:'Cement',
  BSE:'Capital Markets', MCX:'Capital Markets', ANGELONE:'Capital Markets',
  BSE_LTD:'Capital Markets', CDSL:'Capital Markets', CAMS:'Capital Markets',
  DLF:'Realty', GODREJPROP:'Realty', PRESTIGE:'Realty', OBEROIRLTY:'Realty',
  LT:'Capital Goods', BHEL:'Capital Goods', SIEMENS:'Capital Goods',
  ABB:'Capital Goods', HAL:'Defence', BEL:'Defence', GRSE:'Defence',
  INDIGO:'Aviation', NAUKRI:'Technology/Internet', ZOMATO:'Consumer Tech',
  TRENT:'Retail', AVENUE:'Retail', PAGEIND:'Textiles',
  DEEPAKNTR:'Chemicals', PIIND:'Chemicals', SRF:'Chemicals',
  NAVINFLUOR:'Chemicals', AARTIIND:'Chemicals',
  POWFINANCE:'Finance', REC:'Finance', IRFC:'Finance',
  INDHOTEL:'Hotels', LEMERIDIEN:'Hotels', ZEEENT:'Media',
  GROWW:'FinTech', MEESHO:'E-commerce',
  ATHERENERG:'EV/Auto',
};

function getSector(symbol) {
  return SECTOR_MAP[symbol] || SECTOR_MAP[symbol?.replace('-','_')] || 'Others';
}

// Market cap category from price (rough, scanner doesn't give MCap)
// Proper classification needs AMFI data; we store what we have
function getCapCategory(symbol, price) {
  // Large caps known from NIFTY 100
  const largeCaps = new Set(['RELIANCE','TCS','HDFCBANK','ICICIBANK','INFOSYS','INFY',
    'BHARTIARTL','SBIN','ITC','KOTAKBANK','AXISBANK','LT','HINDUNILVR','BAJFINANCE',
    'MARUTI','NTPC','ONGC','SUNPHARMA','POWERGRID','TATAMOTORS','M&M','BAJAJ_AUTO',
    'ULTRACEMCO','COALINDIA','INDUSINDBK','WIPRO','HCLTECH','APOLLOHOSP','ADANIPORTS',
    'TATACONSUM','DRREDDY','NESTLEIND','LICI','EICHERMOT','TATASTEEL','BPCL','CIPLA',
    'JSWSTEEL','HEROMOTOCO','GRASIM','TECHM','DIVISLAB','BRIT ANNIA','HINDALCO',
    'DABUR','SHREECEM','DLF','INDIGO','BAJAJFINSV','MAXHEALTH','BSE','PERSISTENT',
    'FEDERALBNK','CHOLAFIN','SHRIRAMFIN','TRENT','NAUKRI','ZOMATO','COFORGE']);
  if (largeCaps.has(symbol)) return 'Large Cap';
  if (price >= 500) return 'Mid Cap';
  return 'Small Cap';
}

function loadWatchlistFromFile() {
  const wlPath = path.join(TRADER_IN, 'watchlist.json');
  if (!fs.existsSync(wlPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(wlPath, 'utf8'));
    return data.hits || [];
  } catch { return []; }
}

function loadMetricsFromFile() {
  const mPath = path.join(TRADER_IN, 'metrics.json');
  if (!fs.existsSync(mPath)) return { companies: [] };
  try {
    return JSON.parse(fs.readFileSync(mPath, 'utf8'));
  } catch { return { companies: [] }; }
}

function loadUniverseFromFile() {
  const uPath = path.join(TRADER_IN, 'universe.txt');
  if (!fs.existsSync(uPath)) return [];
  try {
    const lines = fs.readFileSync(uPath, 'utf8').split('\n').filter(l => l && !l.startsWith('#'));
    return lines.map(l => {
      const [symbol, name, series, band, cas] = l.split('|');
      return { symbol: symbol?.trim(), name: name?.trim(), series: series?.trim(), band: band?.trim(), cas: cas?.trim() === 'yes' };
    }).filter(r => r.symbol);
  } catch { return []; }
}

function syncWatchlistToDb() {
  const db = getDb();
  const hits = loadWatchlistFromFile();
  if (hits.length === 0) return 0;

  const upsertTech = db.prepare(`
    INSERT INTO technical_data
      (symbol, close_date, price, rsi_14, volume, setups, near_upper_circuit, band, source, fetched_at)
    VALUES
      (@symbol,@close_date,@price,@rsi_14,@volume,@setups,@near_upper_circuit,@band,@source,@fetched_at)
    ON CONFLICT(symbol, close_date) DO UPDATE SET
      price=excluded.price, rsi_14=excluded.rsi_14, volume=excluded.volume,
      setups=excluded.setups, near_upper_circuit=excluded.near_upper_circuit, fetched_at=excluded.fetched_at
  `);

  const upsertStock = db.prepare(`
    INSERT INTO stocks (symbol, name, exchange, series, sector, band, cas, cap_category)
    VALUES (@symbol, @name, @exchange, @series, @sector, @band, @cas, @cap_category)
    ON CONFLICT(symbol) DO UPDATE SET
      name=excluded.name, series=excluded.series, band=excluded.band, cas=excluded.cas,
      sector=excluded.sector, cap_category=excluded.cap_category, updated_at=datetime('now')
  `);

  const now = new Date().toISOString();
  const sync = db.transaction(() => {
    for (const h of hits) {
      upsertStock.run({
        symbol: h.symbol, name: h.symbol, exchange: h.exchange || 'NSE',
        series: h.series || 'EQ', sector: getSector(h.symbol),
        band: h.band || null, cas: h.cas ? 1 : 0,
        cap_category: getCapCategory(h.symbol, h.price),
      });
      upsertTech.run({
        symbol: h.symbol,
        close_date: h.close_date || new Date().toISOString().split('T')[0],
        price: h.price || 0,
        rsi_14: h.rsi || null,
        volume: h.volume || 0,
        setups: JSON.stringify(h.setups || []),
        near_upper_circuit: h.near_upper_circuit ? 1 : 0,
        band: h.band || null,
        source: 'india-scanner',
        fetched_at: now,
      });
    }
  });
  sync();
  return hits.length;
}

function syncMetricsToDb() {
  const db = getDb();
  const data = loadMetricsFromFile();
  const companies = data.companies || [];
  if (companies.length === 0) return 0;

  const upsert = db.prepare(`
    INSERT INTO fundamentals
      (symbol, revenue_ttm_cr, net_profit_ttm_cr, revenue_growth_yoy, eps_growth_yoy,
       net_margin, ebitda_margin, operating_margin, eps_ttm, source, fetched_at)
    VALUES
      (@symbol,@revenue_ttm_cr,@net_profit_ttm_cr,@revenue_growth_yoy,@eps_growth_yoy,
       @net_margin,@ebitda_margin,@operating_margin,@eps_ttm,@source,@fetched_at)
  `);
  const now = new Date().toISOString();
  const sync = db.transaction(() => {
    for (const c of companies) {
      upsert.run({
        symbol: c.symbol || c.ticker,
        revenue_ttm_cr: c.revenue_ttm_cr || null,
        net_profit_ttm_cr: c.net_profit_ttm_cr || null,
        revenue_growth_yoy: c.revenue_growth_yoy || null,
        eps_growth_yoy: c.eps_growth_yoy || null,
        net_margin: c.net_margin || null,
        ebitda_margin: c.ebitda_margin || null,
        operating_margin: c.operating_margin || null,
        eps_ttm: c.eps_ttm || null,
        source: 'india-analyst',
        fetched_at: now,
      });
    }
  });
  sync();
  return companies.length;
}

function syncUniverseToDb() {
  const db = getDb();
  const rows = loadUniverseFromFile();
  if (rows.length === 0) return 0;
  const upsert = db.prepare(`
    INSERT INTO stocks (symbol, name, series, band, cas, exchange)
    VALUES (@symbol, @name, @series, @band, @cas, 'NSE')
    ON CONFLICT(symbol) DO UPDATE SET
      name=excluded.name, series=excluded.series, band=excluded.band, cas=excluded.cas, updated_at=datetime('now')
  `);
  const sync = db.transaction(() => {
    for (const r of rows) {
      upsert.run({ symbol: r.symbol, name: r.name || r.symbol, series: r.series, band: r.band, cas: r.cas ? 1 : 0 });
    }
  });
  sync();
  return rows.length;
}

function runDailyScan() {
  if (!fs.existsSync(SCANNER_SKILL)) {
    console.warn('[scanner] india-scanner skill not found at:', SCANNER_SKILL);
    return false;
  }
  try {
    const out = execFileSync('python3', [SCANNER_SKILL, 'daily', '--min-turnover', '5'], {
      cwd: TRADING_ROOT,
      timeout: 120000,
      encoding: 'utf8',
    });
    console.log('[scanner] Daily scan output:', out.substring(0, 300));
    syncWatchlistToDb();
    return true;
  } catch (e) {
    console.warn('[scanner] Scan failed (expected outside trading hours):', e.message?.substring(0, 100));
    // Still sync whatever watchlist exists
    syncWatchlistToDb();
    return false;
  }
}

function getScreenerData(filters = {}) {
  const db = getDb();
  const {
    cap = null, sector = null, rsi_min = 0, rsi_max = 100,
    setup = null, limit = 50, offset = 0, sort = 'rsi_14', order = 'DESC',
  } = filters;

  const safeSort = ['rsi_14','price','volume','symbol','day_change_pct'].includes(sort) ? sort : 'rsi_14';
  const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

  let where = 'WHERE 1=1';
  const params = [];

  if (cap) { where += ' AND s.cap_category = ?'; params.push(cap); }
  if (sector) { where += ' AND s.sector = ?'; params.push(sector); }
  if (rsi_min > 0) { where += ' AND t.rsi_14 >= ?'; params.push(rsi_min); }
  if (rsi_max < 100) { where += ' AND t.rsi_14 <= ?'; params.push(rsi_max); }
  if (setup) { where += ' AND t.setups LIKE ?'; params.push(`%${setup}%`); }

  const sql = `
    SELECT
      t.symbol,
      COALESCE(s.name, t.symbol) AS name,
      COALESCE(s.sector, 'Others') AS sector,
      COALESCE(s.cap_category, 'Unknown') AS cap_category,
      t.price, t.rsi_14, t.volume, t.setups, t.close_date,
      t.near_upper_circuit, t.band,
      p.day_change_pct,
      f.pe_ratio, f.industry_pe, f.roe, f.revenue_growth_yoy, f.eps_growth_yoy, f.net_margin,
      r.action, r.stop_loss, r.target1, r.target2, r.score
    FROM technical_data t
    INNER JOIN (
      SELECT symbol, MAX(close_date) AS md FROM technical_data GROUP BY symbol
    ) latest ON t.symbol = latest.symbol AND t.close_date = latest.md
    LEFT JOIN stocks s ON t.symbol = s.symbol
    LEFT JOIN (
      SELECT symbol, MAX(fetched_at) AS ma FROM price_snapshots GROUP BY symbol
    ) lp ON t.symbol = lp.symbol
    LEFT JOIN price_snapshots p ON p.symbol = lp.symbol AND p.fetched_at = lp.ma
    LEFT JOIN (
      SELECT symbol, MAX(fetched_at) AS mf FROM fundamentals GROUP BY symbol
    ) lf ON t.symbol = lf.symbol
    LEFT JOIN fundamentals f ON f.symbol = lf.symbol AND f.fetched_at = lf.mf
    LEFT JOIN recommendations r ON r.symbol = t.symbol AND r.is_active = 1
    ${where}
    ORDER BY t.${safeSort} ${safeOrder}
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);
  return db.prepare(sql).all(...params);
}

function getFullWatchlistData() {
  return loadWatchlistFromFile().map(h => ({
    ...h,
    sector: getSector(h.symbol),
    cap_category: getCapCategory(h.symbol, h.price),
  }));
}

module.exports = {
  syncWatchlistToDb,
  syncMetricsToDb,
  syncUniverseToDb,
  runDailyScan,
  getScreenerData,
  getFullWatchlistData,
  getSector,
  getCapCategory,
};

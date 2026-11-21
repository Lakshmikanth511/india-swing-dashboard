'use strict';
/**
 * Market data – Yahoo Finance (free, delayed, unofficial).
 * Never labelled as live. All prices carry source: 'yahoo_delayed'.
 */
const axios = require('axios');
const { getDb } = require('./db');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT = 10000;

const INDEX_MAP = {
  NIFTY:        { yahoo: '%5ENSEI',    name: 'NIFTY 50' },
  BANKNIFTY:    { yahoo: '%5ENSEBANK', name: 'NIFTY Bank' },
  NIFTYJR:      { yahoo: '%5ECNXMDCP',name: 'NIFTY Next 50' },
  MIDCAP100:    { yahoo: '%5ECNXMID',  name: 'NIFTY Midcap 100' },
  SMALLCAP100:  { yahoo: '%5ECNXSC',   name: 'NIFTY Smallcap 100' },
  SENSEX:       { yahoo: '%5EBSESN',   name: 'BSE SENSEX' },
  INDIAVIX:     { yahoo: '%5EINDIAVIX',name: 'India VIX' },
};

const STOCK_SUFFIX = '.NS';

async function fetchYahooQuote(yahooSymbol) {
  for (const base of ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']) {
    const url = `${base}/v8/finance/chart/${yahooSymbol}?range=1d&interval=1d&includePrePost=false`;
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': UA, 'Accept': 'application/json' },
        timeout: TIMEOUT,
      });
      const result = res.data?.chart?.result?.[0];
      if (!result) continue;
      const meta = result.meta;
      const price = meta.regularMarketPrice ?? meta.previousClose ?? 0;
      const prev  = meta.previousClose ?? price;
      return {
        price,
        prev_close:     prev,
        open:           meta.regularMarketOpen  ?? prev,
        high:           meta.regularMarketDayHigh ?? price,
        low:            meta.regularMarketDayLow  ?? price,
        volume:         meta.regularMarketVolume  ?? 0,
        day_change:     +(price - prev).toFixed(2),
        day_change_pct: +((price - prev) / (prev || 1) * 100).toFixed(2),
        source: 'yahoo_delayed',
      };
    } catch { /* try next base */ }
  }
  return null;
}

async function fetchIndexPrices() {
  const db = getDb();
  const results = [];
  for (const [sym, info] of Object.entries(INDEX_MAP)) {
    const data = await fetchYahooQuote(info.yahoo);
    const now = new Date().toISOString();
    if (!data || !data.price) {
      // Try to return cached data
      const cached = db.prepare(
        `SELECT * FROM index_snapshots WHERE symbol=? ORDER BY fetched_at DESC LIMIT 1`
      ).get(sym);
      if (cached) results.push(cached);
      await new Promise(r => setTimeout(r, 200));
      continue;
    }
    // Use positional params to avoid sql.js named-param issues
    db.prepare(
      `INSERT INTO index_snapshots (symbol,name,ltp,prev_close,open,high,low,day_change,day_change_pct,volume,source,is_live,fetched_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?)`
    ).run(sym, info.name, data.price, data.prev_close, data.open, data.high, data.low,
          data.day_change, data.day_change_pct, data.volume, data.source, now);
    results.push({ symbol: sym, name: info.name, ...data, ltp: data.price, fetched_at: now });
    await new Promise(r => setTimeout(r, 300));
  }
  return results;
}

function getLatestIndexPrices() {
  const db = getDb();
  // Get latest snapshot per symbol
  const rows = db.prepare(
    `SELECT s.* FROM index_snapshots s
     INNER JOIN (SELECT symbol, MAX(fetched_at) AS ma FROM index_snapshots GROUP BY symbol) l
     ON s.symbol=l.symbol AND s.fetched_at=l.ma ORDER BY s.symbol`
  ).all();
  return rows;
}

async function fetchYahooBatch(symbols) {
  if (!symbols || symbols.length === 0) return {};
  const results = {};
  for (let i = 0; i < symbols.length; i += 15) {
    const chunk = symbols.slice(i, i + 15);
    const qs = chunk.map(s => encodeURIComponent(s + STOCK_SUFFIX)).join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${qs}&range=1d&interval=1d`;
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': UA, 'Accept': 'application/json' },
        timeout: TIMEOUT,
      });
      for (const item of (res.data?.spark?.result ?? [])) {
        if (!item?.response?.[0]) continue;
        const meta = item.response[0].meta;
        const sym = item.symbol.replace(STOCK_SUFFIX, '').replace(/^%5E/, '^');
        const price = meta.regularMarketPrice ?? meta.previousClose ?? 0;
        const prev  = meta.previousClose ?? price;
        results[sym] = {
          symbol: sym, price, prev_close: prev,
          day_change: +(price - prev).toFixed(2),
          day_change_pct: +((price-prev)/(prev||1)*100).toFixed(2),
          volume: meta.regularMarketVolume ?? 0,
          source: 'yahoo_delayed',
        };
      }
    } catch { /* skip chunk */ }
    await new Promise(r => setTimeout(r, 300));
  }
  return results;
}

async function refreshStockPrices(symbols) {
  if (!symbols || symbols.length === 0) return {};
  const db = getDb();
  const prices = await fetchYahooBatch(symbols);
  const now = new Date().toISOString();
  const ins = db.prepare(
    `INSERT INTO price_snapshots (symbol,price,prev_close,day_change,day_change_pct,volume,source,is_live,fetched_at)
     VALUES (?,?,?,?,?,?,?,0,?)`
  );
  const save = db.transaction(() => {
    for (const p of Object.values(prices)) {
      ins.run(p.symbol, p.price, p.prev_close, p.day_change, p.day_change_pct, p.volume, p.source, now);
    }
  });
  save();
  return prices;
}

function getLatestStockPrices(symbols) {
  if (!symbols || symbols.length === 0) return [];
  const db = getDb();
  const ph = symbols.map(() => '?').join(',');
  return db.prepare(
    `SELECT p.* FROM price_snapshots p
     INNER JOIN (SELECT symbol, MAX(fetched_at) AS ma FROM price_snapshots GROUP BY symbol) l
     ON p.symbol=l.symbol AND p.fetched_at=l.ma WHERE p.symbol IN (${ph})`
  ).all(...symbols);
}

module.exports = {
  fetchIndexPrices, getLatestIndexPrices,
  refreshStockPrices, getLatestStockPrices,
  fetchYahooQuote, fetchYahooBatch,
  INDEX_MAP, STOCK_SUFFIX,
};

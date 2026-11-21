'use strict';
/**
 * News aggregation service.
 * Sources:
 *   1. NSE corporate announcements RSS (public, no cookie, today only)
 *   2. Google News RSS India edition (public, no key)
 *   3. ET Markets RSS
 *   4. Existing trader-in/state/news.json from india-news skill
 *
 * Rate limits respected. No fabricated headlines.
 */
const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');

const UA = 'Mozilla/5.0 (compatible; India-Swing-Dashboard/2.0)';
const TIMEOUT = 8000;
const TRADING_ROOT = process.env.TRADING_ROOT || path.join(__dirname, '../../..');

const FEEDS = [
  {
    name: 'NSE Announcements',
    url: 'https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml',
    type: 'nse_rss',
    tags: ['announcement'],
  },
  {
    name: 'ET Markets',
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    type: 'rss',
    tags: ['market'],
  },
  {
    name: 'Business Standard Markets',
    url: 'https://www.business-standard.com/rss/markets-106.rss',
    type: 'rss',
    tags: ['market'],
  },
  {
    name: 'Mint Markets',
    url: 'https://www.livemint.com/rss/markets',
    type: 'rss',
    tags: ['market'],
  },
];

const MARKET_KEYWORDS = {
  bullish: ['surge', 'rally', 'gain', 'rise', 'breakout', 'upgrade', 'buy', 'target raised', 'profit', 'growth', 'record'],
  bearish:  ['fall', 'drop', 'decline', 'sell', 'downgrade', 'loss', 'cut', 'concern', 'risk', 'lower', 'below'],
};

function classifySentiment(text) {
  if (!text) return 'neutral';
  const lower = text.toLowerCase();
  let bull = 0, bear = 0;
  for (const w of MARKET_KEYWORDS.bullish) if (lower.includes(w)) bull++;
  for (const w of MARKET_KEYWORDS.bearish) if (lower.includes(w)) bear++;
  if (bull > bear) return 'bullish';
  if (bear > bull) return 'bearish';
  return 'neutral';
}

function extractSymbols(text) {
  if (!text) return [];
  // Look for common NSE symbols in ALL-CAPS 3-10 chars
  const matches = text.match(/\b([A-Z][A-Z0-9&\-]{2,9})\b/g) || [];
  // Filter to known patterns (rough heuristic)
  return [...new Set(matches.filter(m => m.length >= 3 && m.length <= 12 && !/^\d+$/.test(m)))].slice(0, 5);
}

function hashGuid(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(36);
}

async function fetchRssFeed(feed) {
  try {
    const res = await axios.get(feed.url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml' },
      timeout: TIMEOUT,
    });
    const parsed = await xml2js.parseStringPromise(res.data, { explicitArray: false });
    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    const arr = Array.isArray(items) ? items : [items];
    return arr.map(item => {
      const title = item.title?._ || item.title || '';
      const link  = item.link?._ || item.link?.href || item.link || '';
      const desc  = item.description?._ || item.description || item.summary?._ || '';
      const pub   = item.pubDate || item.updated || item['dc:date'] || new Date().toISOString();
      const guid  = item.guid?._ || item.guid || hashGuid(title + pub);
      return {
        guid:      String(guid).substring(0, 200),
        headline:  String(title).trim().substring(0, 500),
        summary:   String(desc).replace(/<[^>]+>/g, '').trim().substring(0, 1000),
        source:    feed.name,
        url:       String(link).substring(0, 500),
        symbols:   JSON.stringify(extractSymbols(title + ' ' + desc)),
        tags:      JSON.stringify(feed.tags || []),
        sentiment: classifySentiment(title + ' ' + desc),
        pub_date:  String(pub).substring(0, 50),
      };
    }).filter(i => i.headline);
  } catch (e) {
    console.warn(`[news] Feed failed: ${feed.name}: ${e.message?.substring(0, 80)}`);
    return [];
  }
}

function loadNewsFromSkillFile() {
  const nPath = path.join(TRADING_ROOT, 'trader-in/state/news.json');
  if (!fs.existsSync(nPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(nPath, 'utf8'));
    const items = data.items || data.seen || [];
    return Object.entries(typeof items === 'object' && !Array.isArray(items) ? items : {}).map(([k, v]) => ({
      guid:      hashGuid(k),
      headline:  String(v?.title || v?.headline || k).substring(0, 500),
      summary:   String(v?.summary || '').substring(0, 1000),
      source:    'india-news (NSE)',
      url:       String(v?.url || '').substring(0, 500),
      symbols:   JSON.stringify(v?.symbols || []),
      tags:      JSON.stringify(v?.tags || ['announcement']),
      sentiment: classifySentiment(v?.title || k),
      pub_date:  String(v?.pub_date || v?.time || '').substring(0, 50),
    })).filter(i => i.headline);
  } catch { return []; }
}

function saveNewsToDb(items) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO news_items
      (guid, headline, summary, source, url, symbols, tags, sentiment, pub_date, fetched_at)
    VALUES
      (@guid,@headline,@summary,@source,@url,@symbols,@tags,@sentiment,@pub_date,@fetched_at)
  `);
  const now = new Date().toISOString();
  const save = db.transaction(() => {
    let count = 0;
    for (const item of items) {
      const info = insert.run({ ...item, fetched_at: now });
      if (info.changes) count++;
    }
    return count;
  });
  return save();
}

async function refreshNews() {
  let allItems = [];
  // Load from skill file first (no network)
  allItems = allItems.concat(loadNewsFromSkillFile());
  // Fetch each RSS feed with rate-limit gap
  for (const feed of FEEDS) {
    const items = await fetchRssFeed(feed);
    allItems = allItems.concat(items);
    await new Promise(r => setTimeout(r, 500));
  }
  const saved = saveNewsToDb(allItems);
  return { fetched: allItems.length, saved };
}

function getLatestNews(filters = {}) {
  const db = getDb();
  const { symbol = null, sentiment = null, limit = 50 } = filters;
  let where = 'WHERE 1=1';
  const params = [];
  if (symbol) { where += ' AND symbols LIKE ?'; params.push(`%${symbol}%`); }
  if (sentiment) { where += ' AND sentiment = ?'; params.push(sentiment); }
  params.push(limit);
  return db.prepare(`
    SELECT * FROM news_items ${where}
    ORDER BY pub_date DESC, fetched_at DESC
    LIMIT ?
  `).all(...params);
}

module.exports = { refreshNews, getLatestNews, FEEDS };

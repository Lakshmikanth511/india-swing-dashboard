'use strict';
/**
 * Recommendation engine – algorithmic signals only.
 * Scoring: Breakout(20) RSI(10) Volume(10) Fundamentals(15) Valuation(10)
 *          Sector(10) Analyst(5) Liquidity(5) RR(10) Upside(5) = 100
 * Uses positional SQL params to stay compatible with sql.js.
 */
const { getDb } = require('./db');

const GOVERNANCE_FLAGS = new Set(['INDUSINDBK']);

const LEADING_SECTORS = new Set(['Banking','IT','Capital Markets','Auto','Healthcare','NBFC','Insurance','Pharma']);

function scoreStock(tech, fund) {
  let score = 0;

  // 1. Breakout quality (20)
  const setups = JSON.parse(tech.setups || '[]');
  if (setups.includes('breakout_20d') && setups.includes('bull_flag')) score += 20;
  else if (setups.includes('breakout_20d'))  score += 16;
  else if (setups.includes('bull_flag'))     score += 12;
  else if (setups.includes('reclaim_ma20'))  score += 8;
  else if (setups.includes('oversold_bounce')) score += 6;
  else score += 3;

  // 2. RSI 14 (10)
  const rsi = tech.rsi_14 || 50;
  if      (rsi >= 55 && rsi <= 70) score += 10;
  else if (rsi >= 50 && rsi <  55) score += 6;
  else if (rsi >  70 && rsi <= 75) score += 4;
  else if (rsi >  75 && rsi <= 80) score += 2;
  else if (rsi >  80)              score += 0;
  else                             score += 1;  // <50 oversold

  // 3. Volume (10)
  const vol = tech.volume || 0;
  const price = tech.price || 1;
  const turnover = price * vol;
  if      (turnover > 1_000_000_000) score += 10;
  else if (turnover > 100_000_000)   score += 7;
  else if (turnover > 10_000_000)    score += 4;
  else                               score += 2;

  // 4. Fundamentals (15)
  if (fund) {
    const rg = fund.revenue_growth_yoy || 0;
    const eg = fund.eps_growth_yoy     || 0;
    const nm = fund.net_margin         || 0;
    let f = 0;
    f += rg > 20 ? 5 : rg > 10 ? 3 : rg > 0 ? 1 : 0;
    f += eg > 20 ? 5 : eg > 10 ? 3 : eg > 0 ? 1 : 0;
    f += nm > 20 ? 5 : nm > 10 ? 3 : nm > 0 ? 1 : 0;
    score += Math.min(f, 15);
  } else { score += 5; }

  // 5. Valuation (10)
  if (fund && fund.pe_ratio && fund.industry_pe && fund.industry_pe > 0) {
    const r = fund.pe_ratio / fund.industry_pe;
    score += r < 1.0 ? 10 : r < 1.3 ? 7 : r < 2.0 ? 4 : 1;
  } else { score += 5; }

  // 6. Sector (10)
  score += LEADING_SECTORS.has(tech.sector || '') ? 10 : 5;

  // 7. Analyst/sentiment (5) – static bonus for now
  score += 3;

  // 8. Liquidity (5)
  score += turnover > 500_000_000 ? 5 : turnover > 50_000_000 ? 3 : 1;

  // 9. R/R proxy (10)
  const hasBreakout = setups.includes('breakout_20d');
  const hasBullFlag = setups.includes('bull_flag');
  score += hasBreakout ? 10 : hasBullFlag ? 7 : 3;

  // 10. Upside (5)
  score += 3;

  return Math.min(score, 100);
}

function deriveAction(tech, score) {
  if (GOVERNANCE_FLAGS.has(tech.symbol)) return 'AVOID';
  if (tech.near_upper_circuit)           return 'WATCHLIST';
  const rsi = tech.rsi_14 || 50;
  if (rsi > 82)                          return 'WATCHLIST';
  const setups = JSON.parse(tech.setups || '[]');
  const hasBreakout = setups.includes('breakout_20d');
  const hasBullFlag = setups.includes('bull_flag');
  if (score >= 65 && hasBreakout && rsi >= 50 && rsi <= 75) return 'BUY';
  if (score >= 50 && (hasBreakout || hasBullFlag) && rsi <= 78) return 'BUY_ON_CONFIRMATION';
  if (score >= 35 && rsi >= 40 && rsi <= 80)  return 'WATCHLIST';
  return 'WATCHLIST';
}

function calcTargets(price, rsi) {
  const riskPct  = rsi > 72 ? 0.04 : 0.05;
  const stopLoss = +(price * (1 - riskPct)).toFixed(2);
  const target1  = +(price * 1.06).toFixed(2);
  const target2  = +(price * 1.12).toFixed(2);
  const risk     = price - stopLoss;
  const rr1 = risk > 0 ? +((target1 - price) / risk).toFixed(2) : 0;
  const rr2 = risk > 0 ? +((target2 - price) / risk).toFixed(2) : 0;
  return { stopLoss, target1, target2, rr1, rr2 };
}

function generateRecommendations() {
  const db = getDb();

  // Get latest technical row per symbol
  const techRows = db.prepare(
    `SELECT t.*, COALESCE(s.sector,'Others') AS sector, COALESCE(s.cap_category,'Unknown') AS cap_category, COALESCE(s.name, t.symbol) AS name
     FROM technical_data t
     INNER JOIN (SELECT symbol, MAX(close_date) AS md FROM technical_data GROUP BY symbol) l
     ON t.symbol=l.symbol AND t.close_date=l.md
     LEFT JOIN stocks s ON t.symbol=s.symbol
     WHERE t.rsi_14 >= 30 AND t.price >= 20`
  ).all();

  // Build fundamentals map
  const fundRows = db.prepare(
    `SELECT f.* FROM fundamentals f
     INNER JOIN (SELECT symbol, MAX(fetched_at) AS ma FROM fundamentals GROUP BY symbol) l
     ON f.symbol=l.symbol AND f.fetched_at=l.ma`
  ).all();
  const fundMap = {};
  for (const f of fundRows) fundMap[f.symbol] = f;

  // Deactivate old recs
  db.prepare(`UPDATE recommendations SET is_active=0`).run();

  const ins = db.prepare(
    `INSERT INTO recommendations
     (symbol,name,cap_category,cmp,action,entry_low,entry_high,stop_loss,target1,target2,
      upside_pct,rr_t1,rr_t2,rsi,score,reason,breakout_level,setup,is_active,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,datetime('now'),datetime('now'))`
  );

  const save = db.transaction(() => {
    for (const tech of techRows) {
      if (GOVERNANCE_FLAGS.has(tech.symbol)) continue;
      const fund   = fundMap[tech.symbol];
      const score  = scoreStock(tech, fund);
      const action = deriveAction(tech, score);
      if (action === 'AVOID') continue;
      const { stopLoss, target1, target2, rr1, rr2 } = calcTargets(tech.price, tech.rsi_14);
      const setups = JSON.parse(tech.setups || '[]');
      const reason = `${setups.join(', ')||'No setup'} | RSI:${(tech.rsi_14||0).toFixed(1)} | Score:${score}`;
      ins.run(
        tech.symbol, tech.name, tech.cap_category, tech.price, action,
        +(tech.price * 0.995).toFixed(2), +(tech.price * 1.005).toFixed(2),
        stopLoss, target1, target2,
        +(((target2 - tech.price) / tech.price) * 100).toFixed(1),
        rr1, rr2, tech.rsi_14, score, reason,
        tech.price, JSON.stringify(setups)
      );
    }
  });
  save();

  const count = db.prepare(`SELECT COUNT(*) AS c FROM recommendations WHERE is_active=1`).get()?.c || 0;
  return count;
}

function getRecommendations(filters = {}) {
  const db = getDb();
  const { action = null, cap = null, limit = 100, offset = 0, minScore = 0 } = filters;
  const conditions = ['r.is_active=1', `r.score >= ${parseInt(minScore)||0}`];
  const params = [];
  if (action) { conditions.push('r.action=?'); params.push(action); }
  if (cap)    { conditions.push('r.cap_category=?'); params.push(cap); }
  params.push(Math.min(parseInt(limit)||100, 500), parseInt(offset)||0);

  return db.prepare(
    `SELECT r.*, t.setups, t.volume
     FROM recommendations r
     LEFT JOIN (SELECT symbol, MAX(close_date) AS md FROM technical_data GROUP BY symbol) lt ON r.symbol=lt.symbol
     LEFT JOIN technical_data t ON t.symbol=lt.symbol AND t.close_date=lt.md
     WHERE ${conditions.join(' AND ')}
     ORDER BY r.score DESC LIMIT ? OFFSET ?`
  ).all(...params);
}

module.exports = { generateRecommendations, getRecommendations, GOVERNANCE_FLAGS };

'use strict';
/**
 * SQLite wrapper using sql.js (pure JS, no native build).
 * Saves to disk after every write transaction.
 * API mirrors better-sqlite3 for drop-in compatibility.
 */
const path = require('path');
const fs   = require('fs');

let _SQL = null;
let _db  = null;
let _dbPath = null;
let _dirty = false;
let _saveTimer = null;

function getDbPath() {
  return process.env.DB_PATH
    ? path.resolve(__dirname, '..', process.env.DB_PATH)
    : path.join(__dirname, '../database/dashboard.sqlite');
}

function scheduleSave() {
  _dirty = true;
  if (_saveTimer) return;
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    if (_dirty && _db) {
      try {
        const data = _db.export();
        fs.writeFileSync(_dbPath, Buffer.from(data));
        _dirty = false;
      } catch (e) { console.error('[db] Save error:', e.message); }
    }
  }, 500);
}

// Minimal statement wrapper
class Stmt {
  constructor(db, sql) {
    this._db  = db;
    this._sql = sql;
  }
  run(...args) {
    const params = flatArgs(args);
    try {
      this._db.run(this._sql, params);
      scheduleSave();
      // Fake lastInsertRowid
      const r = this._db.exec('SELECT last_insert_rowid() AS r');
      return { changes: 1, lastInsertRowid: r[0]?.values[0][0] ?? 0 };
    } catch(e) { throw e; }
  }
  get(...args) {
    const params = flatArgs(args);
    const r = this._db.exec(this._sql, params);
    if (!r[0]) return undefined;
    const cols = r[0].columns;
    const row  = r[0].values[0];
    if (!row) return undefined;
    return Object.fromEntries(cols.map((c,i)=>[c, row[i]]));
  }
  all(...args) {
    const params = flatArgs(args);
    const r = this._db.exec(this._sql, params);
    if (!r[0]) return [];
    const cols = r[0].columns;
    return r[0].values.map(row => Object.fromEntries(cols.map((c,i)=>[c, row[i]])));
  }
}

function flatArgs(args) {
  if (args.length === 1 && args[0] !== null && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    // Named params: convert to positional array by order of keys
    return args[0];
  }
  return args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
}

class DB {
  constructor(sqlJs, filePath) {
    this._sqlJs = sqlJs;
    _dbPath = filePath;
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      this._db = new sqlJs.Database(buf);
    } else {
      this._db = new sqlJs.Database();
    }
    _db = this._db;
  }
  pragma(str) {
    try { this._db.run(`PRAGMA ${str}`); } catch {}
    return this;
  }
  exec(sql) {
    this._db.run(sql);
    scheduleSave();
    return this;
  }
  prepare(sql) { return new Stmt(this._db, sql); }
  transaction(fn) {
    return (...args) => {
      this._db.run('BEGIN');
      try {
        const r = fn(...args);
        this._db.run('COMMIT');
        scheduleSave();
        return r;
      } catch (e) {
        try { this._db.run('ROLLBACK'); } catch {}
        throw e;
      }
    };
  }
  close() {
    if (_dirty && this._db) {
      const data = this._db.export();
      fs.writeFileSync(_dbPath, Buffer.from(data));
    }
    this._db.close();
  }
}

// sql.js uses named params differently — it needs $name or ?NNN
// We need to handle object params by converting to positional
// Override Stmt.run/get/all to handle object params properly
const _origRun = Stmt.prototype.run;
Stmt.prototype.run = function(...args) {
  const params = massageParams(this._sql, args);
  try {
    this._db.run(this._sql, params);
    scheduleSave();
    const r = this._db.exec('SELECT last_insert_rowid() AS r');
    return { changes: 1, lastInsertRowid: r[0]?.values[0][0] ?? 0 };
  } catch(e) { throw e; }
};
Stmt.prototype.get = function(...args) {
  const params = massageParams(this._sql, args);
  const r = this._db.exec(this._sql, params);
  if (!r[0]) return undefined;
  const row = r[0].values[0];
  if (!row) return undefined;
  return Object.fromEntries(r[0].columns.map((c,i)=>[c, row[i]]));
};
Stmt.prototype.all = function(...args) {
  const params = massageParams(this._sql, args);
  const r = this._db.exec(this._sql, params);
  if (!r[0]) return [];
  return r[0].values.map(row => Object.fromEntries(r[0].columns.map((c,i)=>[c, row[i]])));
};

function massageParams(sql, args) {
  if (args.length === 0) return [];
  if (args.length === 1 && args[0] !== null && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    // Convert named to positional by scanning SQL for @name patterns
    const obj = args[0];
    // sql.js accepts {$name: val} or {':name': val} or {'@name': val}
    const named = {};
    for (const [k,v] of Object.entries(obj)) {
      named['@'+k] = v;   // sql.js understands @name
      named[':'+k] = v;
      named['$'+k] = v;
    }
    return named;
  }
  return args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
}

let _initPromise = null;
function getDb() {
  if (_db) {
    // Return a wrapper
    return _dbWrapper();
  }
  throw new Error('DB not initialised. Call initDb() first.');
}

let _dbWrap = null;
function _dbWrapper() {
  if (_dbWrap) return _dbWrap;
  _dbWrap = {
    prepare: (sql) => new Stmt(_db, sql),
    exec: (sql) => { _db.run(sql); scheduleSave(); },
    pragma: (str) => { try{_db.run(`PRAGMA ${str}`);}catch{} },
    transaction: (fn) => (...args) => {
      _db.run('BEGIN');
      try { const r=fn(...args); _db.run('COMMIT'); scheduleSave(); return r; }
      catch(e) { try{_db.run('ROLLBACK');}catch{} throw e; }
    },
  };
  return _dbWrap;
}

async function initDb() {
  if (_db) return;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    const dbPath = getDbPath();
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    _dbPath = dbPath;
    if (fs.existsSync(dbPath)) {
      const buf = fs.readFileSync(dbPath);
      _db = new SQL.Database(buf);
    } else {
      _db = new SQL.Database();
    }
    _dbWrap = null; // reset wrapper
    // Pragmas
    try { _db.run('PRAGMA journal_mode = MEMORY'); } catch {}
    try { _db.run('PRAGMA foreign_keys = ON'); } catch {}
  })();
  return _initPromise;
}

module.exports = { getDb, initDb };

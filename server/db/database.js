const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db;
const dbPath = path.join(__dirname, '../../qrdinamico.db');

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();

  // Check if database file exists
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.run(schema);

  // Save database to file
  saveDatabase();

  console.log('Database initialized successfully');
}

// Save database to file
function saveDatabase() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    console.log(`[DB] Saved database to ${dbPath} (${buffer.length} bytes)`);
  } catch (err) {
    console.error('[DB] Failed to save database:', err);
  }
}

// User operations
const userDb = {
  findByGoogleId(googleId) {
    const stmt = db.prepare('SELECT * FROM users WHERE google_id = ?');
    stmt.bind([googleId]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  },

  create(googleId, email, name, picture) {
    const stmt = db.prepare('INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)');
    stmt.bind([googleId, email, name, picture]);
    stmt.step();
    stmt.free();
    saveDatabase();
    const result = db.exec('SELECT last_insert_rowid() as id');
    const lastId = result[0].values[0][0];
    return this.findById(lastId);
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([id]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  },

  findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    stmt.bind([email]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }
};

// QR Code operations
const qrDb = {
  create(shortId, url, userId = null, title = null) {
    const stmt = db.prepare('INSERT INTO qrcodes (short_id, url, user_id, title) VALUES (?, ?, ?, ?)');
    stmt.bind([shortId, url, userId, title]);
    stmt.step();
    stmt.free();
    saveDatabase();

    // Query the inserted record by short_id directly
    const selectStmt = db.prepare('SELECT * FROM qrcodes WHERE short_id = ?');
    selectStmt.bind([shortId]);
    const result = selectStmt.step() ? selectStmt.getAsObject() : null;
    selectStmt.free();
    return result;
  },

  // ... methods ...

  updateOwner(id, userId) {
    const stmt = db.prepare('UPDATE qrcodes SET user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.bind([userId, id]);
    stmt.step();
    stmt.free();
    saveDatabase();
    return this.findById(id);
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM qrcodes WHERE id = ?');
    stmt.bind([id]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  },

  findByShortId(shortId) {
    const stmt = db.prepare('SELECT * FROM qrcodes WHERE short_id = ?');
    stmt.bind([shortId]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  },

  findByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM qrcodes WHERE user_id = ? ORDER BY created_at DESC');
    stmt.bind([userId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  findAllAnonymous() {
    const stmt = db.prepare('SELECT * FROM qrcodes WHERE user_id IS NULL ORDER BY created_at DESC');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  findAll() {
    const stmt = db.prepare('SELECT * FROM qrcodes ORDER BY created_at DESC');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  update(id, url, title = null, shortId = null) {
    let stmt;
    if (shortId) {
      stmt = db.prepare('UPDATE qrcodes SET url = ?, title = ?, short_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.bind([url, title, shortId, id]);
    } else {
      stmt = db.prepare('UPDATE qrcodes SET url = ?, title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.bind([url, title, id]);
    }
    stmt.step();
    stmt.free();
    saveDatabase();
    return this.findById(id);
  },

  incrementVisits(id) {
    const stmt = db.prepare('UPDATE qrcodes SET visits_count = visits_count + 1 WHERE id = ?');
    stmt.bind([id]);
    stmt.step();
    stmt.free();
    saveDatabase();
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM qrcodes WHERE id = ?');
    stmt.bind([id]);
    stmt.step();
    stmt.free();
    saveDatabase();
    return { changes: 1 };
  },

  shortIdExists(shortId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM qrcodes WHERE short_id = ?');
    stmt.bind([shortId]);
    const hasResult = stmt.step();
    const count = hasResult ? stmt.getAsObject().count : 0;
    stmt.free();
    return count > 0;
  }
};

// Analytics operations
const analyticsDb = {
  logVisit(qrId, ipAddress, userAgent, referer) {
    const stmt = db.prepare('INSERT INTO analytics (qr_id, ip_address, user_agent, referer) VALUES (?, ?, ?, ?)');
    stmt.bind([qrId, ipAddress, userAgent, referer]);
    stmt.step();
    stmt.free();
    saveDatabase();
  },

  getStats(qrId) {
    const stmt = db.prepare('SELECT COUNT(*) as total_visits FROM analytics WHERE qr_id = ?');
    stmt.bind([qrId]);
    const result = stmt.step() ? stmt.getAsObject() : { total_visits: 0 };
    stmt.free();
    return result;
  },

  getRecentVisits(qrId, limit = 10) {
    const stmt = db.prepare('SELECT * FROM analytics WHERE qr_id = ? ORDER BY visited_at DESC LIMIT ?');
    stmt.bind([qrId, limit]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  getVisitsByDate(qrId, days = 7) {
    const stmt = db.prepare(`
      SELECT DATE(visited_at) as date, COUNT(*) as visits 
      FROM analytics 
      WHERE qr_id = ? AND visited_at >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(visited_at)
      ORDER BY date ASC
    `);
    stmt.bind([qrId, days]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  // Global analytics methods
  getTotalClicks() {
    const stmt = db.prepare('SELECT COUNT(*) as total FROM analytics');
    const result = stmt.step() ? stmt.getAsObject() : { total: 0 };
    stmt.free();
    return result.total;
  },

  getGlobalStats() {
    const totalClicks = this.getTotalClicks();

    // Clicks today
    const todayStmt = db.prepare(`SELECT COUNT(*) as count FROM analytics WHERE DATE(visited_at) = DATE('now')`);
    const todayClicks = todayStmt.step() ? todayStmt.getAsObject().count : 0;
    todayStmt.free();

    // Clicks this week
    const weekStmt = db.prepare(`SELECT COUNT(*) as count FROM analytics WHERE visited_at >= datetime('now', '-7 days')`);
    const weekClicks = weekStmt.step() ? weekStmt.getAsObject().count : 0;
    weekStmt.free();

    // Clicks this month
    const monthStmt = db.prepare(`SELECT COUNT(*) as count FROM analytics WHERE visited_at >= datetime('now', '-30 days')`);
    const monthClicks = monthStmt.step() ? monthStmt.getAsObject().count : 0;
    monthStmt.free();

    return {
      total: totalClicks,
      today: todayClicks,
      week: weekClicks,
      month: monthClicks
    };
  },

  getGlobalVisitsByDate(days = 30) {
    const stmt = db.prepare(`
      SELECT DATE(visited_at) as date, COUNT(*) as visits 
      FROM analytics 
      WHERE visited_at >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(visited_at)
      ORDER BY date ASC
    `);
    stmt.bind([days]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  getTopQrCodes(limit = 10) {
    const stmt = db.prepare(`
      SELECT qr_id, COUNT(*) as clicks 
      FROM analytics 
      GROUP BY qr_id 
      ORDER BY clicks DESC 
      LIMIT ?
    `);
    stmt.bind([limit]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  getRecentVisitsGlobal(limit = 20) {
    const stmt = db.prepare('SELECT * FROM analytics ORDER BY visited_at DESC LIMIT ?');
    stmt.bind([limit]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  getLatestVisitsMap() {
    // Returns a map of qr_id -> last_visited_at
    const stmt = db.prepare('SELECT qr_id, MAX(visited_at) as last_visit FROM analytics GROUP BY qr_id');
    const visitsMap = {};
    while (stmt.step()) {
      const row = stmt.getAsObject();
      visitsMap[row.qr_id] = row.last_visit;
    }
    stmt.free();
    return visitsMap;
  }
};

module.exports = {
  initDatabase,
  userDb,
  qrDb,
  analyticsDb
};

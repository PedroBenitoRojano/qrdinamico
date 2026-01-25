-- Users table for storing Google OAuth user data
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- QR Codes table for storing dynamic QR codes
CREATE TABLE IF NOT EXISTS qrcodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_id TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  title TEXT DEFAULT NULL,
  user_id INTEGER,
  visits_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Analytics table for tracking visits
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  qr_id INTEGER NOT NULL,
  visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  country TEXT DEFAULT NULL,
  city TEXT DEFAULT NULL,
  FOREIGN KEY (qr_id) REFERENCES qrcodes(id) ON DELETE CASCADE
);

-- Index for faster lookups by short_id
CREATE INDEX IF NOT EXISTS idx_qrcodes_short_id ON qrcodes(short_id);

-- Index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_qrcodes_user_id ON qrcodes(user_id);

-- Index for analytics by qr_id
CREATE INDEX IF NOT EXISTS idx_analytics_qr_id ON analytics(qr_id);

-- Index for analytics by date
CREATE INDEX IF NOT EXISTS idx_analytics_visited_at ON analytics(visited_at);

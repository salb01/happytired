CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  event_time TEXT,
  end_time TEXT,
  location_name TEXT NOT NULL,
  address TEXT,
  latitude REAL,
  longitude REAL,
  age_range TEXT NOT NULL CHECK(age_range IN ('newborn', '1-2', '3-5')),
  is_free INTEGER DEFAULT 0,
  price REAL,
  category TEXT,
  source_url TEXT,
  image_url TEXT,
  image_emoji TEXT,
  is_outdoor INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(title, event_date, location_name)
);

CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  age_preferences TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_age ON events(age_range);
CREATE INDEX IF NOT EXISTS idx_events_free ON events(is_free);

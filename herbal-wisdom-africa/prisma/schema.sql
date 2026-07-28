-- Herbal Wisdom Africa — SQLite/libsql schema.

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('MEMBER','ADMIN')),
  country TEXT,
  bio TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Remedy (
  id TEXT PRIMARY KEY,
  authorId TEXT NOT NULL REFERENCES User(id),
  herbName TEXT NOT NULL,
  herbLocalName TEXT,
  condition TEXT NOT NULL,
  region TEXT,
  preparation TEXT NOT NULL,
  dosage TEXT,
  outcome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED','HIDDEN')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Comment (
  id TEXT PRIMARY KEY,
  remedyId TEXT NOT NULL REFERENCES Remedy(id),
  authorId TEXT NOT NULL REFERENCES User(id),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED','HIDDEN')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Flag (
  id TEXT PRIMARY KEY,
  targetType TEXT NOT NULL CHECK (targetType IN ('REMEDY','COMMENT')),
  targetId TEXT NOT NULL,
  reporterId TEXT NOT NULL REFERENCES User(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLVED','DISMISSED')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_remedy_herb ON Remedy(herbName);
CREATE INDEX IF NOT EXISTS idx_remedy_condition ON Remedy(condition);
CREATE INDEX IF NOT EXISTS idx_remedy_status ON Remedy(status);
CREATE INDEX IF NOT EXISTS idx_comment_remedy ON Comment(remedyId);
CREATE INDEX IF NOT EXISTS idx_flag_status ON Flag(status);
CREATE INDEX IF NOT EXISTS idx_flag_target ON Flag(targetType, targetId);

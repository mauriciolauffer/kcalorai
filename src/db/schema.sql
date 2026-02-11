CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,
  age INTEGER,
  height_cm INTEGER,
  weight_kg REAL,
  gender TEXT,
  activity_level TEXT,
  goal TEXT,
  profile_completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  daily_calories INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  fat_g INTEGER NOT NULL,
  carbs_g INTEGER NOT NULL,
  effective_from TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE foods (
  id TEXT PRIMARY KEY,
  user_id TEXT, -- NULL = global food
  name TEXT NOT NULL,
  serving_grams REAL NOT NULL,
  calories INTEGER NOT NULL,
  protein_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE food_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  food_id TEXT, -- NULL for quick add
  date TEXT NOT NULL, -- YYYY-MM-DD
  meal TEXT NOT NULL, -- breakfast | lunch | dinner | snack
  servings REAL,
  calories INTEGER NOT NULL,
  protein_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (food_id) REFERENCES foods(id)
);

CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE INDEX idx_food_logs_user_date
  ON food_logs (user_id, date);

CREATE INDEX idx_food_logs_user_meal
  ON food_logs (user_id, meal);

CREATE INDEX idx_user_goals_effective
  ON user_goals (user_id, effective_from DESC);

CREATE INDEX idx_foods_search
  ON foods (name);

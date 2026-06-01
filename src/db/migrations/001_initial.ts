export const sql_001 = `
  CREATE TABLE IF NOT EXISTS assets (
    id       TEXT    PRIMARY KEY,
    name     TEXT    NOT NULL,
    cat      TEXT    NOT NULL,
    value    REAL    NOT NULL,
    currency TEXT    NOT NULL,
    note     TEXT    NOT NULL DEFAULT '',
    updated  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS net_worth_snapshots (
    id       TEXT    PRIMARY KEY,
    t        INTEGER NOT NULL,
    v        REAL    NOT NULL,
    trigger  TEXT,
    asset_id TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exchange_rates_cache (
    base_currency TEXT    PRIMARY KEY,
    rates_json    TEXT    NOT NULL,
    fetched_at    INTEGER NOT NULL
  );
`;

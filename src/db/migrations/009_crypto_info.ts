export const sql_009 = `
  DROP TABLE IF EXISTS crypto_info;
  CREATE TABLE crypto_info (
    id     INTEGER PRIMARY KEY,
    symbol TEXT NOT NULL DEFAULT '',
    name   TEXT NOT NULL DEFAULT '',
    price              REAL NOT NULL DEFAULT 0,
    percent_change_24h REAL NOT NULL DEFAULT 0
  );
`;

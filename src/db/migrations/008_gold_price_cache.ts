export const sql_008 = `
  CREATE TABLE IF NOT EXISTS gold_price_cache (
    currency   TEXT    PRIMARY KEY,
    data_json  TEXT    NOT NULL,
    fetched_at INTEGER NOT NULL
  );
`;

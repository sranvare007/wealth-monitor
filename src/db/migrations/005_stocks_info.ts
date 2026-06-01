export const sql_005 = `
  CREATE TABLE IF NOT EXISTS stocks_info (
    symbol    TEXT PRIMARY KEY,
    name      TEXT NOT NULL DEFAULT '',
    currency  TEXT NOT NULL DEFAULT '',
    exchange  TEXT NOT NULL DEFAULT '',
    mic_code  TEXT NOT NULL DEFAULT '',
    country   TEXT NOT NULL DEFAULT '',
    type      TEXT NOT NULL DEFAULT '',
    figi_code TEXT NOT NULL DEFAULT '',
    cfi_code  TEXT NOT NULL DEFAULT ''
  );
`;

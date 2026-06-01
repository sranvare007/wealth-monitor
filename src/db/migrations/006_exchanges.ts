export const sql_006 = `
  CREATE TABLE IF NOT EXISTS exchanges (
    code     TEXT PRIMARY KEY,
    title    TEXT NOT NULL DEFAULT '',
    name     TEXT NOT NULL DEFAULT '',
    country  TEXT NOT NULL DEFAULT '',
    timezone TEXT NOT NULL DEFAULT ''
  );
`;

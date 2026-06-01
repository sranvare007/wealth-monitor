export const sql_003 = `
  CREATE TABLE IF NOT EXISTS custom_categories (
    id       TEXT    PRIMARY KEY,
    label    TEXT    NOT NULL,
    icon     TEXT    NOT NULL,
    color    TEXT    NOT NULL,
    liability INTEGER NOT NULL DEFAULT 0,
    created  INTEGER NOT NULL
  );
`;

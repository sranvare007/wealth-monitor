// SQLite only allows one column per ALTER TABLE statement
export const sql_002_stmts = [
  `ALTER TABLE assets ADD COLUMN rc_enabled INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE assets ADD COLUMN rc_amount REAL`,
  `ALTER TABLE assets ADD COLUMN rc_frequency TEXT`,
  `ALTER TABLE assets ADD COLUMN rc_next_due INTEGER`,
  `ALTER TABLE assets ADD COLUMN rc_last_applied INTEGER`,
];

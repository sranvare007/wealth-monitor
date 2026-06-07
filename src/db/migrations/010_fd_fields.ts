// SQLite only allows one column per ALTER TABLE statement
export const sql_010_stmts = [
  `ALTER TABLE assets ADD COLUMN fd_interest_rate REAL`,
  `ALTER TABLE assets ADD COLUMN fd_duration_years INTEGER`,
  `ALTER TABLE assets ADD COLUMN fd_duration_months INTEGER`,
  `ALTER TABLE assets ADD COLUMN fd_duration_days INTEGER`,
  `ALTER TABLE assets ADD COLUMN fd_start_date INTEGER`,
];

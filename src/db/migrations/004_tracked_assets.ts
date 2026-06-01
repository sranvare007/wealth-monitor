// Adds track_json column to assets table to store live-tracked instrument data
// (stock symbol/qty/price, crypto symbol/chain/qty, gold purity/weight).
// Single-element array so database.ts can use the same runAsync pattern as migration 002.
export const sql_004_stmts = [
  `ALTER TABLE assets ADD COLUMN track_json TEXT`,
];

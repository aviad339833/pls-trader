import sqlite3 from "sqlite3";

export let db: sqlite3.Database;

export function initializeDatabase() {
  db = new sqlite3.Database("./tokens.db", (err) => {
    if (err) {
      console.error("Error opening database", err);
      return;
    }
    // Initialize tables for different intervals
    ["1m", "5m", "4h", "1d"].forEach((interval) => {
      db.run(
        `CREATE TABLE IF NOT EXISTS token_prices_${interval} (name TEXT, low REAL, high REAL, open REAL, close REAL, timestamp TEXT)`
      );
    });

    // Table for raw price data
    db.run(
      `CREATE TABLE IF NOT EXISTS raw_token_prices (name TEXT, price REAL, timestamp TEXT)`
    );
  });
}

import sqlite3 from "sqlite3";

// Open the SQLite database
let db: sqlite3.Database;

db = new sqlite3.Database("./token_prices.db", (err) => {
  if (err) {
    console.error("Error opening database", err);
    return;
  }
});

// Create the token_prices table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS token_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT,
    ratio TEXT,
    timestamp TEXT
  )
`);

// Function to read the last 3 items from token_prices table
export function readLast3Items(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT *
      FROM token_prices
      ORDER BY id DESC
      LIMIT 3
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject("Fetch Error: " + err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Test invoking the function to read last 3 items
// Uncomment this section if you want to test it standalone
// readLast3Items()
//   .then(items => {
//     console.log("Last 3 Items:", items);
//   })
//   .catch(err => {
//     console.error(err);
//   });

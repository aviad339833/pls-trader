import sqlite3 from "sqlite3";

// Open the SQLite database
const db = new sqlite3.Database("./token_prices.db", (err) => {
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

// Function to read the last item for a specific token from token_prices table
export function readLastItemForToken(tokenName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT *
      FROM token_prices
      WHERE token = ?
      ORDER BY id DESC
      LIMIT 1
    `;

    db.get(query, [tokenName], (err, row) => {
      if (err) {
        reject("Fetch Error: " + err);
      } else {
        resolve(row);
      }
    });
  });
}

// Test invoking the function to read the last item for "DAI" token
readLastItemForToken("DAI")
  .then((item) => {
    console.log("Last Item for DAI:", item);
  })
  .catch((err) => {
    console.error(err);
  });

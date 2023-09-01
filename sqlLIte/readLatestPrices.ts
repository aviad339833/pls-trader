import sqlite3 from "sqlite3";

// Open the SQLite database
let db: sqlite3.Database;

db = new sqlite3.Database("./tokens.db", (err) => {
  if (err) {
    console.error("Error opening database", err);
    return;
  }
});

// Function to read the latest prices of all tokens
export function readLatestPrices(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT name, price FROM (
        SELECT name, price, MAX(timestamp) as maxTime
        FROM token_prices
        GROUP BY name
      )
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

// Test invoking the function to read latest prices
// Uncomment this section if you want to test it standalone
// readLatestPrices()
//   .then(prices => {
//     console.log("Latest Prices:", prices);
//   })
//   .catch(err => {
//     console.error(err);
//   });

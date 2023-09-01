import fs from "fs";
import sqlite3 from "sqlite3";
import { getRatio } from "../utils/getRatio";
import { getAllBalances } from "../utils/getAllBalances";
import { addresses } from "../config/config";

// Open the SQLite database connection
const db = new sqlite3.Database("token_prices.db");
// Create the token_prices table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS token_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT,
    ratio TEXT,
    timestamp TEXT
  )
`);

const historicalRatios: Record<string, BigInt[]> = {};
let runCounter = 0;

async function updateRatios() {
  try {
    const ratios: Record<string, BigInt | undefined> = {};

    for (const [key, value] of Object.entries(addresses)) {
      if (key === "WPLS") {
        continue;
      }

      const ratio: any = await getRatio(value.PAIR_ADDRESS);

      if (!historicalRatios[key]) {
        historicalRatios[key] = [];
      }
      if (ratio !== undefined) {
        historicalRatios[key].push(ratio);
      }

      if (historicalRatios[key].length > 120) {
        historicalRatios[key].shift();
      }

      ratios[key] = ratio;
    }

    const timestamp = new Date().toISOString();
    for (const [token, ratio] of Object.entries(ratios)) {
      db.run(
        `INSERT INTO token_prices (token, ratio, timestamp) VALUES (?, ?, ?)`,
        [token, ratio?.toString(), timestamp],
        (error) => {
          if (error) {
            console.error("Error inserting data into the database:", error);
          } else {
            console.log("Inserted data into the database:");
            console.log("Token:", token);
            console.log("Ratio:", ratio?.toString());
            console.log("Timestamp:", timestamp);
          }
        }
      );
    }

    console.log("Data inserted into the database.");

    runCounter++;
    console.log(`This program has run ${runCounter} times so far.`);
  } catch (error) {
    console.error("Error updating ratios:", error);
  }
}

// Run updateRatios every 5 seconds
setInterval(updateRatios, 1000);

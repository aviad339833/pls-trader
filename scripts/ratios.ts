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
    moving_average TEXT,
    timestamp TEXT
  )
`);

const historicalRatios: Record<string, number[]> = {};
let runCounter = 0;

async function updateRatios() {
  try {
    const ratios: Record<string, number | undefined> = {};

    const timestamp = new Date().toISOString(); // Define the timestamp here

    for (const [key, value] of Object.entries(addresses)) {
      if (key === "WPLS") {
        continue;
      }

      const ratio: any = await getRatio(value.PAIR_ADDRESS);

      if (!historicalRatios[key]) {
        historicalRatios[key] = [];
      }
      if (ratio !== undefined) {
        historicalRatios[key].push(Number(ratio)); // Convert ratio to number
      }

      if (historicalRatios[key].length > 120) {
        historicalRatios[key].shift();
      }

      ratios[key] = ratio;

      // Calculate 120-day moving average
      const movingAverage =
        historicalRatios[key].length < 120
          ? Number(ratio) // Convert ratio to number
          : historicalRatios[key].reduce((sum, val) => sum + val, 0) / 120;

      db.run(
        `INSERT INTO token_prices (token, ratio, moving_average, timestamp) VALUES (?, ?, ?, ?)`,
        [key, ratio?.toString(), movingAverage?.toString(), timestamp],
        (error) => {
          if (error) {
            console.error("Error inserting data into the database:", error);
          } else {
            console.log("Inserted data into the database:");
            console.log("Token:", key);
            console.log("Ratio:", ratio?.toString());
            console.log("Moving Average:", movingAverage?.toString());
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

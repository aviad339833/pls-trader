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
    ma_120 TEXT,
    ma_120_ago TEXT,
    timestamp TEXT
  )
`);

const historicalRatios: Record<string, BigInt[]> = {};
let runCounter = 0;

function calculateMovingAverage(values: any) {
  const period = 120;
  // Calculate the sum of the firast 120 values
  const sum = values
    .slice(0, period)
    .reduce((total: any, value: any) => total + value, 0n);

  // Calculate the moving average for the entire period (including the first price)
  return sum / BigInt(period);
}

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
      const movingAverage = calculateMovingAverage(historicalRatios[token]);
      const movingAverage120Ago = calculateMovingAverage(
        historicalRatios[token].slice(-240, -120)
      );

      if (movingAverage !== null && movingAverage120Ago !== null) {
        // Update the ma_120 column in the database
        db.run(
          `INSERT INTO token_prices (token, ratio, ma_120, ma_120_ago, timestamp) VALUES (?, ?, ?, ?, ?)`,
          [
            token,
            ratio?.toString(),
            movingAverage.toString(),
            movingAverage120Ago.toString(),
            timestamp,
          ],
          (error) => {
            if (error) {
              console.error("Error inserting data into the database:", error);
            } else {
              console.log("Inserted data into the database:");
              console.log("Token:", token);
              console.log("Ratio:", ratio?.toString());
              console.log("Moving Average (120):", movingAverage.toString());
              console.log(
                "Moving Average (120 ago):",
                movingAverage120Ago.toString()
              );
              console.log("Timestamp:", timestamp);
            }
          }
        );
      }
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

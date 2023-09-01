import { db } from "./database";

export async function writeAggregatedData(
  interval: string,
  token: string,
  data: any
) {
  db.run(
    `INSERT INTO token_prices_${interval} (name, low, high, open, close, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
    [token, data.low, data.high, data.open, data.close, data.timestamp],
    function (err) {
      if (err) {
        console.log(`Insert Error in ${interval} for ${token}`, err);
        return;
      }
    }
  );
}

export async function aggregateData(token: string, interval: string) {
  // Define your time frame in milliseconds (e.g., 5 minutes = 300000 ms)
  let timeframeMs = 300000;

  // Get the current time
  const now = new Date().getTime();

  // Calculate the start time for the data you want to aggregate
  const startTime = new Date(now - timeframeMs).toISOString();

  return new Promise((resolve, reject) => {
    db.all(
      `SELECT MIN(price) as low, MAX(price) as high,
              (SELECT price FROM raw_token_prices WHERE timestamp >= ? ORDER BY timestamp ASC LIMIT 1) as open,
              (SELECT price FROM raw_token_prices WHERE timestamp <= ? ORDER BY timestamp DESC LIMIT 1) as close
       FROM raw_token_prices
       WHERE name = ? AND timestamp BETWEEN ? AND ?`,
      [
        startTime,
        new Date().toISOString(),
        token,
        startTime,
        new Date().toISOString(),
      ],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows[0]); // Assumes that aggregation query will return a single row
        }
      }
    );
  });
}

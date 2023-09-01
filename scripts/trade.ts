import fs from "fs";
import { readLast3Items } from "../sqlLIte/readLast3Items";
// Import other necessary modules here

type Balances = {
  [key: string]:
    | number
    | {
        highestPercentageDifferences: number;
        lowestPercentageDifferences: number;
      };
};

function readJsonFromFile(filename: string): Balances | null {
  try {
    const jsonString = fs.readFileSync(filename, "utf8");
    const jsonData = JSON.parse(jsonString);
    return jsonData;
  } catch (error) {
    console.error(`Error reading or parsing JSON data from ${filename}`);
    return null;
  }
}

let flagOpposite = false; // Add this flag to switch the behavior
const calculateTrendLine = (entryLevel: number, slopeDegree: number) => {
  const slope = Math.tan(
    (flagOpposite ? -slopeDegree : slopeDegree) * (Math.PI / 180)
  );
  return (time: number) => entryLevel + slope * time;
};

let time = 0;
const entryLevel = 0.0000374;
const slopeDegree = 80; // Changed to 50 degrees as per your requirement
const trendLineFunction = calculateTrendLine(entryLevel, slopeDegree);
let stopLossLevel = entryLevel * (1 - 0.5 / 100); // Initial stop loss level
const targetToken = "DAI"; // Token to target

async function checkAndExecuteTrade() {
  try {
    const ratios = await readLast3Items(); // Implement the actual function
    const balances: Balances | null = readJsonFromFile("balances.json");

    if (!balances) return;

    console.clear();

    console.log(`=== Current Time: ${new Date().toLocaleTimeString()} ===`); // Added line

    console.log(`=== Trend Line Info ===`);
    console.log(
      `Trend Line Status: ${flagOpposite ? "Going Down" : "Going Up"}`
    );
    console.log(`Trend Line Degree: ${slopeDegree} degrees`);

    console.log(`Current Stop Loss Level: ${stopLossLevel.toFixed(8)}`);

    console.log("\n=== Account Balances ===");
    if (balances[targetToken]) {
      console.log(
        `${targetToken}: ${balances[targetToken]} (Token: ${targetToken})`
      );
    }

    console.log("\n=== Ratios ===");
    for (const ratio of ratios) {
      if (ratio.token !== targetToken) continue;

      const currentRatio = ratio.ratio;
      const trendLineValue = trendLineFunction(time);
      const distancePercentage =
        ((trendLineValue - currentRatio) / trendLineValue) * 100;

      const isBelowTrendLine = flagOpposite
        ? currentRatio > trendLineValue
        : currentRatio < trendLineValue;
      const isBelowStopLoss = currentRatio < stopLossLevel;

      console.log(`Token: ${ratio.token}, Ratio: ${currentRatio}`);

      if (isBelowTrendLine || isBelowStopLoss) {
        console.log(
          `Ratio ${
            flagOpposite ? "broke above" : "broke below"
          } the trend line or hit the stop loss.`
        );
        // Adjust stop loss level
        stopLossLevel = currentRatio * (1 - 0.5 / 100);
      } else {
        console.log(`trendLineValue`, trendLineValue);
        console.log(`Did not break the trend line yet.`);
      }
    }

    time++;
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Poll every 1 second (customize this)
setInterval(checkAndExecuteTrade, 1000);

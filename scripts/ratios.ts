import fs from "fs";
import { getRatio } from "../utils/getRatio";
import { addresses } from "../config/config";

// To store historical ratios for calculating moving averages
const historicalRatios: Record<string, BigInt[]> = {};
const highestPercentageUpside: Record<string, string> = {};
const lowestPercentageDownside: Record<string, string> = {};
let runCounter = 0; // Initialize a counter for the number of runs

async function updateRatios() {
  const ratios: Record<string, BigInt | undefined> = {};
  const ma120: Record<string, string> = {};
  const percentageDifference: Record<string, string> = {};

  for (const [key, value] of Object.entries(addresses)) {
    const ratio: any = await getRatio(value.PAIR_ADDRESS);

    // Update historical ratios for each address
    if (!historicalRatios[key]) {
      historicalRatios[key] = [];
    }
    if (ratio !== undefined) {
      historicalRatios[key].push(ratio);
    }

    // If more than 120 records, remove the oldest one
    if (historicalRatios[key].length > 120) {
      historicalRatios[key].shift();
    }

    // Calculate 120-point MA for each address
    const total = historicalRatios[key].reduce((a, b) => a + Number(b), 0);
    const ma = (total / historicalRatios[key].length).toString();
    ma120[key] = ma;

    // Calculate % difference between the current ratio and the MA from 60 points before
    if (historicalRatios[key].length >= 60) {
      const totalOld = historicalRatios[key]
        .slice(0, 60)
        .reduce((a, b) => a + Number(b), 0);
      const maOld = totalOld / 60;
      const percentDiff = (((Number(ratio) - maOld) / maOld) * 100).toFixed(2);
      percentageDifference[key] = percentDiff;

      // Update highestPercentageUpside and lowestPercentageDownside
      if (
        !highestPercentageUpside[key] ||
        Number(highestPercentageUpside[key]) < Number(percentDiff)
      ) {
        highestPercentageUpside[key] = percentDiff;
      }

      if (
        !lowestPercentageDownside[key] ||
        Number(lowestPercentageDownside[key]) > Number(percentDiff)
      ) {
        lowestPercentageDownside[key] = percentDiff;
      }
    }

    ratios[key] = ratio;
  }

  // Clear console
  console.clear();

  // Write the ratios, MA, and percentage difference to console
  console.log("Current Ratios:", ratios);
  console.log("120 MA:", ma120);
  console.log("Percentage Difference:", percentageDifference);
  console.log("Highest Percentage Upside:", highestPercentageUpside);
  console.log("Lowest Percentage Downside:", lowestPercentageDownside);
  runCounter++; // Increment the run counter
  console.log(`This program has run ${runCounter} times so far.`);

  // Convert BigInts to strings before storing them
  const ratiosForJSON = Object.fromEntries(
    Object.entries(ratios).map(([key, value]) => [key, value?.toString()])
  );

  // Convert BigInts in historicalRatios to strings
  const historicalRatiosForJSON: Record<string, string[]> = {};
  for (const [key, values] of Object.entries(historicalRatios)) {
    historicalRatiosForJSON[key] = values.map((value) =>
      value ? value.toString() : "undefined"
    );
  }

  // Create an object to hold all the data
  const allData = {
    currentRatios: ratiosForJSON,
    historicalRatios: historicalRatiosForJSON,
    ma120,
    percentageDifference,
    highestPercentageUpside,
    lowestPercentageDownside,
  };

  // Write the entire data set to a JSON file
  fs.writeFileSync("ratios.json", JSON.stringify(allData, null, 2));
}

// Run updateRatios every 5 seconds
setInterval(updateRatios, 5000);

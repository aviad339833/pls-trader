import fs from "fs";
import { getRatio } from "../utils/getRatio";

import { getAllBalances } from "../utils/getAllBalances";
import { addresses } from "../config/config";

// To store historical ratios for calculating moving averages
const historicalRatios: Record<string, BigInt[]> = {};
let runCounter = 0; // Initialize a counter for the number of runs

async function updateRatios() {
  const ratios: Record<string, BigInt | undefined> = {};
  const balances = await getAllBalances();

  for (const [key, value] of Object.entries(addresses)) {
    // Skip processing if the token is WPLS
    if (value.TOKEN_ADDRESS === "WPLS") {
      continue;
    }

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

    ratios[key] = ratio;
  }

  // Clear console
  console.clear();

  // Write the ratios to console
  console.log("Current Ratios:", ratios);
  console.log("Current balances:", balances);
  runCounter++; // Increment the run counter
  console.log(`This program has run ${runCounter} times so far.`);

  // Convert BigInts to strings before storing them
  const ratiosForJSON = Object.fromEntries(
    Object.entries(ratios).map(([key, value]) => [key, value?.toString()])
  );
  const balancesForJSON = Object.fromEntries(
    Object.entries(balances).map(([key, value]) => [key, value?.toString()])
  );

  // Create an object to hold the current ratios data
  const currentRatiosData = {
    currentRatios: ratiosForJSON,
    currentBalances: balancesForJSON,
  };

  // Write the current ratios data to a JSON file
  fs.writeFileSync("ratios.json", JSON.stringify(currentRatiosData, null, 2));
}

// Run updateRatios every 5 seconds
setInterval(updateRatios, 5000);

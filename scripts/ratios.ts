import fs from "fs";
import { getRatio } from "../utils/getRatio"; // import your existing getRatio function
import { addresses } from "../config/config";

async function updateRatios() {
  try {
    const ratios: Record<string, BigInt | undefined> = {}; // Explicitly type ratios

    for (const [key, value] of Object.entries(addresses)) {
      const ratio = await getRatio(value.PAIR_ADDRESS);

      if (ratio === undefined) {
        console.error(`Failed to get ratio for ${key}`);
        continue;
      }

      ratios[key] = ratio;
    }

    // Clear console
    console.clear();

    // Log the current date
    console.log("Last Updated:", new Date().toLocaleString());

    // Write the ratios to console
    console.log("Current Ratios:", ratios);

    // Convert BigInts to strings before storing them
    const ratiosForJSON = Object.fromEntries(
      Object.entries(ratios).map(([key, value]) => [key, value?.toString()])
    );

    // Write the ratios to a JSON file
    fs.writeFileSync("ratios.json", JSON.stringify(ratiosForJSON, null, 2));
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Run updateRatios every 5 seconds
setInterval(updateRatios, 5000);

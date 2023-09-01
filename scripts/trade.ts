import { ethers } from "hardhat";
import pair_ABI from "../abis/pair_ABI.json";
import router_ABI from "../abis/router_ABI.json";
import wpls_ABI from "../abis/wpls_ABI.json";
import { sendMessage } from "../utils/sendMessage";
import { addresses } from "../config/config";
import { gatherUserInputs } from "../utils/userInputs";
import { getRatio } from "../utils/getRatio";
import { getRatiosFromJson } from "../utils/getRatiosFromJson";
import { executeTrade } from "../utils/takeAtrade";
import { readLast3Items } from "../sqlLIte/readLast3Items";

require("dotenv").config();
const fs = require("fs");
// Check ratio and execute trade if conditions met

function readJsonFromFile(filename: any) {
  try {
    const jsonString = fs.readFileSync(filename, "utf8");
    const jsonData = JSON.parse(jsonString);
    return jsonData;
  } catch (error) {
    console.error(`Error reading or parsing JSON data from '${filename}`);
    return null;
  }
}
// ... (other imports and code above)

async function checkAndExecuteTrade() {
  try {
    const ratios = await readLast3Items();
    const balances = await readJsonFromFile("balances.json");
    console.clear();
    console.log("Balances JSON:");
    console.log(balances);
    console.log("Ratios Array:");
    console.log(ratios);

    // Log individual properties of balances
    console.log("Individual Balances:");
    for (const key in balances) {
      console.log(`${key}: ${balances[key]}`);
    }

    // Log individual properties of highestPercentageDifferences
    console.log("Highest Percentage Differences:");
    for (const key in balances.highestPercentageDifferences) {
      console.log(`${key}: ${balances.highestPercentageDifferences[key]}`);
    }

    // Log individual properties of lowestPercentageDifferences
    console.log("Lowest Percentage Differences:");
    for (const key in balances.lowestPercentageDifferences) {
      console.log(`${key}: ${balances.lowestPercentageDifferences[key]}`);
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Poll every 5 seconds (customize this)
setInterval(checkAndExecuteTrade, 1000); // Poll every 5 seconds

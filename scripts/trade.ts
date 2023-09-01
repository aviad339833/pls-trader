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
async function checkAndExecuteTrade() {
  try {
    const ratios = await readLast3Items();
    const balances = await readJsonFromFile("balances.json");
    console.clear();
    console.log(ratios);
    console.log(balances);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Poll every 5 seconds (customize this)
setInterval(checkAndExecuteTrade, 1000);

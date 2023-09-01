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
const tokenSettings = [
  {
    token: "DAI",
    entry: 0.00003789563719,
    trigger: "above",
    stoploss: 0.02,
    contract: addresses.DAI.PAIR_ADDRESS,
  },
];

// Check ratio and execute trade if conditions met
async function checkAndExecuteTrade() {
  try {
    const ratios = await readLast3Items();
    console.clear();
    console.log(ratios);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Poll every 5 seconds (customize this)
setInterval(checkAndExecuteTrade, 1000);

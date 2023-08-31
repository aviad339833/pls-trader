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

require("dotenv").config();

// Check ratio and execute trade if conditions met
async function checkAndExecuteTrade() {
  try {
    const ratios = await getRatiosFromJson();

    // Your condition (customize this)
    if (parseInt(ratios.DAI) > 400000) {
      await executeTrade(addresses.DAI.TOKEN_ADDRESS);
    }
    if (BigInt(ratios.HEX) > BigInt("22330693934297169655070")) {
      await executeTrade(addresses.HEX.TOKEN_ADDRESS);
    }
    if (parseInt(ratios.PLSX) > 2794000000) {
      await executeTrade(addresses.PLSX.TOKEN_ADDRESS);
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Poll every 5 seconds (customize this)
setInterval(checkAndExecuteTrade, 5000);

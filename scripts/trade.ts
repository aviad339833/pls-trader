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
    const ratios = await getRatiosFromJson();

    for (const tokenSetting of tokenSettings) {
      const currentRatio = ratios[tokenSetting.token];
      const { entry, trigger, stoploss, contract } = tokenSetting;

      if (
        (trigger === "above" && currentRatio >= entry) ||
        (trigger === "below" && currentRatio <= entry)
      ) {
        // Calculate stop-loss price
        const stoplossPrice = entry * (1 - stoploss);

        // Check if currentRatio goes below stop-loss price
        if (currentRatio <= stoplossPrice) {
          console.log(
            `${tokenSetting.token}: Triggered stop-loss, executing trade`
          );
          const tradeResult = await executeTrade(contract);
          console.log("Trade result:", tradeResult);
        }
      }
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Poll every 5 seconds (customize this)
setInterval(checkAndExecuteTrade, 500);

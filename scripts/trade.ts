import { addresses } from "../config/config";
import { readLast3Items } from "../sqlLIte/readLast3Items";
import { getPLSWalletBalance } from "../utils/getPLSWalletBalance";
import { executeTrade } from "../utils/takeAtrade";

// Constants for trade configuration
const ENTRY_LEVEL = 0.00003055339009;
const DIRECTION = "below";
const TOKEN_TO_TRADE = "DAI";
const RISE_PER_SECOND = ENTRY_LEVEL * 0.00001;

// Initial settings
let stopLoss = ENTRY_LEVEL * 0.99; // Stop-loss set at 1% below entry level
let timeElapsed = 0; // Time counter in seconds
let tradeExecuted = false; // Flag to track if trade has been executed

export type Direction = "above" | "below";

export function shouldExecuteTrade(
  entryTrigger: number,
  direction: Direction,
  currentRatio: number
): boolean {
  const logAbove = "Take a trade!! currentRatio is above entryTrigger";
  const logBelow = "Take a trade!! currentRatio is below entryTrigger";

  if (direction === "above" && currentRatio > entryTrigger) {
    console.log(logAbove);
    return true;
  } else if (direction === "below" && currentRatio < entryTrigger) {
    console.log(logBelow);
    return true;
  }

  console.log(
    `${
      entryTrigger / currentRatio
    } currentRatio is still above  entryTrigger StopLose: ${stopLoss}`
  );
  return false;
}

async function checkAndExecuteTrade() {
  try {
    const ratios = await readLast3Items(); // Fetch the last 3 items from the database
    const native_balance = await getPLSWalletBalance();

    for (let i in ratios) {
      if (ratios[i].token === TOKEN_TO_TRADE) {
        const currentRatio = ratios[i].ratio / 10000000000;

        console.clear();
        console.log(TOKEN_TO_TRADE, currentRatio, currentRatio / stopLoss);
        console.log(native_balance, "native_balance");

        const shouldTrade = shouldExecuteTrade(
          ENTRY_LEVEL,
          DIRECTION,
          currentRatio
        );

        if (shouldTrade) {
          console.log("Executing trade!");
          await executeTrade(addresses[TOKEN_TO_TRADE].TOKEN_ADDRESS);
          tradeExecuted = true;
          // TODO: Implement the actual trade execution logic here
        }

        // Check for stop-loss trigger
        if (currentRatio < stopLoss) {
          console.log("Sell signal triggered due to stop-loss");
          await executeTrade(addresses[TOKEN_TO_TRADE].TOKEN_ADDRESS);
          return;
        }

        // Only update stop-loss if a trade has been executed
        if (tradeExecuted) {
          stopLoss += RISE_PER_SECOND;
          console.log(`New stop-loss level: ${stopLoss}`);
        }

        break;
      }
    }

    // Check for trade closure condition
    if (stopLoss > ENTRY_LEVEL) {
      console.log("Closing trade, stop-loss exceeded entry level");
      // TODO: Implement trade closure logic here
      return;
    }

    // Increment time counter
    timeElapsed++;
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Poll every 1 second
setInterval(checkAndExecuteTrade, 1000);

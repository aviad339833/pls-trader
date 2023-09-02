import { addresses } from "../config/config";
import { readLast3Items } from "../sqlLIte/readLast3Items";
import { getPLSWalletBalance } from "../utils/getPLSWalletBalance";
import { executeTrade } from "../utils/takeAtrade";

// Constants for trade configuration
const ENTRY_LEVEL = 0.000038306767106;
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
    console.log(ratios);
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

        if (shouldTrade && !tradeExecuted) {
          console.log("Executing trade!");
          // Add a 30-second delay
          tradeExecuted = true;
          await executeTrade(addresses[TOKEN_TO_TRADE].TOKEN_ADDRESS);
        }

        // Check for stop-loss trigger
        if (currentRatio < stopLoss && tradeExecuted) {
          console.log("Sell signal triggered due to stop-loss");
          tradeExecuted = false;
          await executeTrade(addresses[TOKEN_TO_TRADE].TOKEN_ADDRESS);
          return;
        }

        // Only update stop-loss if a trade has been executed
        if (tradeExecuted) {
          stopLoss += RISE_PER_SECOND;
          console.log(`New stop-loss level: ${stopLoss}`);
        }

        // Check for trade closure condition
        if (stopLoss > currentRatio) {
          console.log("Closing trade, stop-loss exceeded entry level");
          // await executeTrade(addresses[TOKEN_TO_TRADE].TOKEN_ADDRESS);
          tradeExecuted = false;
          await executeTrade(addresses[TOKEN_TO_TRADE].TOKEN_ADDRESS);
          return;
        }

        break;
      }
    }

    // Increment time counter
    timeElapsed++;
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Poll every 1 second
setInterval(checkAndExecuteTrade, 1000);

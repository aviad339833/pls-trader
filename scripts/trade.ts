import { addresses } from "../config/config";
import { readLastItemForToken } from "../sqlLIte/readLast3Items";
import { getPLSWalletBalance } from "../utils/getPLSWalletBalance";
import { executeTrade } from "../utils/takeAtrade";
import { cancelAllPendingTransactions } from "./resetNounce";

// Constants for trade configuration
const ENTRY_LEVEL = 0.000037373008826;
const DIRECTION = "below";
const TOKEN_TO_TRADE = "DAI";
const RISE_PER_SECOND = ENTRY_LEVEL * 0.000001; //1 hour to gain 50%

// Initial settings
let stopLoss = ENTRY_LEVEL * 0.99; // Stop-loss set at 1% below entry level
let timeElapsed = 0; // Time counter in seconds
let tradeExecuted = true; // Flag to track if trade has been executed

let tradeInfo = {
  ENTRY_LEVEL: 0.000037373008826,
  DIRECTION: "below",
  TOKEN_TO_TRADE: "DAI",
  RISE_PER_SECOND: 0.000001, //1 hour to gain 50%
};

// check balance of the traded asset if above 0 trade is false

const trade = async () => {
  const { ENTRY_LEVEL, DIRECTION, TOKEN_TO_TRADE, RISE_PER_SECOND } = tradeInfo;

  // Given inputs
  const entryPrice = 0.00003946357549;
  const degrees = 40;
  const direction = "down";

  // Calculate the change in price per second
  const changePerSecond = entryPrice * Math.tan((degrees * Math.PI) / 180);

  // Function to simulate the price change
  function simulatePriceChange(currentPrice: any) {
    if (direction === "down") {
      return currentPrice - changePerSecond;
    } else {
      return currentPrice + changePerSecond;
    }
  }

  // Simulate the price change every second
  let currentPrice = entryPrice;
  setInterval(() => {
    currentPrice = simulatePriceChange(currentPrice);
    console.log("Current Price:", currentPrice);
  }, 1000);

  // console.log(ratio);
};

// export type Direction = "above" | "below";

// export function shouldExecuteTrade(
//   entryTrigger: number,
//   direction: Direction,
//   currentRatio: number
// ): boolean {
//   const logAbove = "Take a trade!! currentRatio is above entryTrigger";
//   const logBelow = "Take a trade!! currentRatio is below entryTrigger";

//   if (direction === "above" && currentRatio > entryTrigger) {
//     console.log(logAbove);
//     return true;
//   } else if (direction === "below" && currentRatio < entryTrigger) {
//     console.log(logBelow);
//     return true;
//   }

//   console.log(
//     `${
//       entryTrigger / currentRatio
//     } currentRatio is still above  entryTrigger StopLose: ${stopLoss}`
//   );
//   return false;
// }

// // Interval reference
// let intervalRef: NodeJS.Timeout | null = null;
// async function checkAndExecuteTrade() {
//   try {
//     const ratio = await readLastItemForToken(TOKEN_TO_TRADE); // Fetch the last 3 items from the database
//     const native_balance = await getPLSWalletBalance();

//     if (ratio.token === TOKEN_TO_TRADE) {
//       const currentRatio = ratio.ratio / 10000000000;

//       console.clear();
//       console.log(TOKEN_TO_TRADE, currentRatio, currentRatio / stopLoss);
//       console.log(native_balance, "native_balance");

//       const shouldTrade = shouldExecuteTrade(
//         ENTRY_LEVEL,
//         DIRECTION,
//         currentRatio
//       );

//       if (shouldTrade && !tradeExecuted) {
//         console.log("Executing trade!");
//         // Add a 30-second delay
//         tradeExecuted = true;
//         await executeTrade(addresses[TOKEN_TO_TRADE].TOKEN_ADDRESS);
//         cancelAllPendingTransactions();
//       }

//       // Check for stop-loss trigger
//       if (currentRatio < stopLoss && tradeExecuted) {
//         console.log("Sell signal triggered due to stop-loss");
//         tradeExecuted = false;
//         await executeTrade(addresses[TOKEN_TO_TRADE].TOKEN_ADDRESS);
//         cancelAllPendingTransactions();
//         // Clear the interval when a trade is executed
//         clearInterval(intervalRef!);
//         intervalRef = null;
//         return;
//       }

//       // Only update stop-loss if a trade has been executed
//       if (tradeExecuted) {
//         stopLoss += RISE_PER_SECOND;
//         console.log(`New stop-loss level: ${stopLoss}`);
//       }

//       // Check for trade closure condition
//       if (stopLoss > currentRatio && tradeExecuted) {
//         console.log("Closing trade, stop-loss exceeded entry level");
//         // await executeTrade(addresses[TOKEN_TO_TRADE].TOKEN_ADDRESS);
//         tradeExecuted = false;
//         await executeTrade(addresses[TOKEN_TO_TRADE].TOKEN_ADDRESS);
//         cancelAllPendingTransactions();
//         // Clear the interval when a trade is executed
//         clearInterval(intervalRef!);
//         intervalRef = null;

//         return;
//       }
//     }

//     // Increment time counter
//     timeElapsed++;
//   } catch (error) {
//     console.error("An error occurred:", error);
//   }
// }

// Start the initial interval
// intervalRef = setInterval(checkAndExecuteTrade, 2000);
trade();

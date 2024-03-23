import { readJSONFile } from "../utils/readJSONFile";
import { executeTrade } from "../utils/takeAtrade";

// Initial trade setup
const triggerPrice = 0.000116780624323;
let triggerDirection: "above" | "below" = "below";
let tradedToken: "DAI" | "PLS" = "PLS";
const stopLossPercentage = 1;
let stopLossDirection: "above" | "below" = "above"; // Specify stop-loss direction

// Trade state
let isTradeActive = false;
let entryPrice = 0;
let stopLossPrice = 0;

// Determine trade direction based on the traded token
function getTradeDirection(
  tradedToken: "DAI" | "PLS"
): "PLS_TO_DAI" | "DAI_TO_PLS" {
  return tradedToken === "PLS" ? "PLS_TO_DAI" : "DAI_TO_PLS";
}

async function fetchCurrentPrice() {
  console.clear();
  console.log("Fetching current price...");
  const data = await readJSONFile("pls-trader/DAIInfo.json");

  if (data && data[tradedToken] && data[tradedToken].CURRENT_PRICE) {
    console.log(
      `Current ${tradedToken} Price: ${data[tradedToken].CURRENT_PRICE}`
    );
    return data[tradedToken].CURRENT_PRICE;
  } else {
    console.log(`Failed to fetch current price for ${tradedToken}.`);
    return null;
  }
}

function calculatePercentageDifference(price1: number, price2: number): string {
  return (((price1 - price2) / price2) * 100).toFixed(2);
}

async function checkAndExecuteTrade() {
  try {
    const currentPrice = await fetchCurrentPrice();
    if (currentPrice === null) return; // Exit if unable to fetch price

    if (!isTradeActive) {
      console.log(`Original trigger price: ${triggerPrice}`);
      if (
        (triggerDirection === "below" && currentPrice < triggerPrice) ||
        (triggerDirection === "above" && currentPrice > triggerPrice)
      ) {
        await executeTrade(getTradeDirection(tradedToken));
        console.log(
          `Trade initiated: ${getTradeDirection(
            tradedToken
          )} at price: ${currentPrice}.`
        );
        entryPrice = currentPrice;
        isTradeActive = true;
        // Calculate and log the stop-loss price
        stopLossPrice =
          stopLossDirection === "below"
            ? entryPrice * (1 - stopLossPercentage / 100)
            : entryPrice * (1 + stopLossPercentage / 100);
        console.log(
          `Stop-loss price set at: ${stopLossPrice} (${stopLossPercentage}% ${stopLossDirection} entry price). Price needs to move ${stopLossDirection} to hit stop-loss.`
        );
      } else {
        const percentageDiff = calculatePercentageDifference(
          currentPrice,
          triggerPrice
        );
        console.log(
          `Trade conditions not met. Current price is ${percentageDiff}% from trigger.`
        );
      }
    } else {
      const stopLossPercentDiff = calculatePercentageDifference(
        currentPrice,
        stopLossPrice
      );
      console.log(
        `Monitoring for stop-loss. Current price is ${stopLossPercentDiff}% from stop-loss level. Price needs to move ${stopLossDirection} to hit stop-loss.`
      );

      let stopLossTriggered =
        (stopLossDirection === "below" && currentPrice <= stopLossPrice) ||
        (stopLossDirection === "above" && currentPrice >= stopLossPrice);

      if (stopLossTriggered) {
        console.log("Stop-loss condition met. Closing the trade...");
        await executeTrade(getTradeDirection(tradedToken));
        isTradeActive = false;
      }
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
}

setInterval(checkAndExecuteTrade, 5000); // Check every 5 seconds

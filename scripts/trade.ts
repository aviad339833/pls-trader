import { addresses } from "../config/config";
import { readJSONFile } from "../utils/readJSONFile";
import { executeTrade } from "../utils/takeAtrade";
import { cancelAllPendingTransactions } from "./resetNounce";
import console from "console";

// Define trigger parameters outside the function if they remain constant
const triggerPrice = 0.00011027979568; // Target price for trading decision
const triggerDirection = "above"; // Trading direction, "above" or "below"
const tradedToken = "DAI"; // The token you are planning to trade

const tradeIfPriceIsRight = async (): Promise<void> => {
  console.clear(); // Clear the console at the start of each function call

  try {
    const DAIInfo = await readJSONFile("pls-trader/DAIInfo.json");
    const WPLS_price = DAIInfo.WPLS.CURRENT_PRICE;
    const WPLS_balance = DAIInfo.WPLS.BALANCE / 1e18;
    const DAI_balance = DAIInfo.DAI.BALANCE / 1e18;

    console.log(`Current PLS Price: ${WPLS_price}`);
    console.log(`WPLS Balance: ${WPLS_balance}`);
    console.log(`DAI Balance: ${DAI_balance}`);
    console.log(
      `Trading conditions: Price ${triggerDirection} ${triggerPrice}`
    );

    let priceDifference = triggerPrice - WPLS_price;
    console.log(`Price difference from target: ${priceDifference}`);

    let percentageDifference = (Math.abs(priceDifference) / triggerPrice) * 100;
    console.log(
      `Percentage difference from target: ${percentageDifference.toFixed(2)}%`
    );

    let shouldTrade = false;
    if (triggerDirection === "below" && WPLS_price < triggerPrice) {
      shouldTrade = true;
    } else if (triggerDirection === "above" && WPLS_price > triggerPrice) {
      shouldTrade = true;
    }

    if (shouldTrade) {
      cancelAllPendingTransactions(2);
      // Dynamically decide on the trade direction based on the tradedToken
      const tradeDirection =
        tradedToken === "DAI" ? "DAI_TO_PLS" : "PLS_TO_DAI";
      await executeTrade(tradeDirection);
      console.log(`Trade executed for ${tradedToken} at price: ${WPLS_price}.`);
    } else {
      console.log("Price not met for trade execution.");
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

const tradeInterval = 5000; // Time interval to check for trading conditions

// Uncomment the line below to start the trading watcher
const tradeWatcher = setInterval(tradeIfPriceIsRight, tradeInterval);

import { addresses } from "../config/config";
import { readJSONFile } from "../utils/readJSONFile";
import { executeTrade } from "../utils/takeAtrade";
import { cancelAllPendingTransactions } from "./resetNounce";
import console from "console";

const tradeIfPriceIsRight = async (): Promise<void> => {
  console.clear(); // Clear the screen before logging new information
  try {
    // Assuming readJSONFile is an async function that returns the parsed JSON object
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

    // Calculate the percentage difference from the target price
    let percentageDifference = (Math.abs(priceDifference) / triggerPrice) * 100;
    console.log(
      `Percentage difference from target: ${percentageDifference.toFixed(2)}%`
    );

    let shouldTrade = false;

    // Determine if the current price triggers a trade based on direction and trigger price
    if (triggerDirection === "below" && WPLS_price < triggerPrice) {
      shouldTrade = true;
    } else if (triggerDirection === "above" && WPLS_price > triggerPrice) {
      shouldTrade = true;
    }

    if (shouldTrade) {
      cancelAllPendingTransactions(2);
      // executeTrade("DAI_TO_PLS");
      executeTrade("PLS_TO_DAI");
      console.log(`Trade executed for ${tradedToken} at price: ${WPLS_price}.`);
    } else {
      console.log("Price not met for trade execution.");
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

const triggerPrice: number = 0.000111712957672;
const tradedToken: string = "DAI"; // The token you are trading
const tradeInterval: number = 5000; // Check every 5 seconds
const triggerDirection: "above" | "below" = "above";

// tradeIfPriceIsRight();
// Optionally, uncomment to continuously check and trade
const tradeWatcher = setInterval(tradeIfPriceIsRight, tradeInterval);

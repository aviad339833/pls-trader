import { addresses } from "../config/config";
import { readJSONFile } from "../utils/readJSONFile";
import { executeTrade } from "../utils/takeAtrade";
import { cancelAllPendingTransactions } from "./resetNounce";
import console from "console";

// Define trigger parameters outside the function if they remain constant
const triggerPrice = 0.000117871023047; // Target price for trading decision
const triggerDirection = "below"; // Trading direction, "above" or "below"
const tradedToken = "DAI"; // The token you are planning to trade
const stopLossPercentage = 1; // Stop-loss percentage
let isTradeActive = false; // Flag to indicate if a trade is currently active

const calculateStopLossPrice = (entryPrice: any, isAbove: any) => {
  return isAbove
    ? entryPrice * (1 + stopLossPercentage / 100)
    : entryPrice * (1 - stopLossPercentage / 100);
};

const getCurrentTime = () => new Date().toLocaleTimeString();

const tradeIfPriceIsRight = async () => {
  console.clear(); // Clear the console at the start of each function call

  try {
    const DAIInfo = await readJSONFile("pls-trader/DAIInfo.json");
    const WPLS_price = DAIInfo.WPLS.CURRENT_PRICE;
    const WPLS_balance = DAIInfo.WPLS.BALANCE / 1e18;
    const DAI_balance = DAIInfo.DAI.BALANCE / 1e18;

    console.log(`Time: ${getCurrentTime()}`);
    console.log(`WPLS Balance: ${WPLS_balance}`);
    console.log(`DAI Balance: ${DAI_balance}`);
    console.log(`Current PLS Price: ${WPLS_price} \n\n`);
    console.log(`StopLoss %: ${stopLossPercentage}% `);
    console.log(
      `Trading conditions: Price ${triggerDirection} ${triggerPrice} `
    );

    let priceDifference = triggerPrice - WPLS_price;
    // console.log(`Price difference from target: ${priceDifference}`);

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

    if (shouldTrade && !isTradeActive) {
      cancelAllPendingTransactions(2);
      const tradeDirection =
        tradedToken === "DAI" ? "DAI_TO_PLS" : "PLS_TO_DAI";
      await executeTrade(tradeDirection);
      console.log(`Trade executed for ${tradedToken} at price: ${WPLS_price}.`);
      isTradeActive = true;

      const isStopLossAbove = tradedToken === "PLS";
      const stopLossPrice = calculateStopLossPrice(WPLS_price, isStopLossAbove);
      console.log(
        `Your stop-loss: you will exit the trade if price goes ${
          isStopLossAbove ? "above" : "below"
        } ${stopLossPrice}`
      );

      // Function to monitor price and execute stop-loss
      const monitorPriceAndExecuteStopLoss = async () => {
        const freshDAIInfo = await readJSONFile("pls-trader/DAIInfo.json"); // Fetch fresh data
        const currentPrice = freshDAIInfo.WPLS.CURRENT_PRICE;

        if (
          (isStopLossAbove && currentPrice >= stopLossPrice) ||
          (!isStopLossAbove && currentPrice <= stopLossPrice)
        ) {
          const stopLossTradeDirection =
            tradeDirection === "DAI_TO_PLS" ? "PLS_TO_DAI" : "DAI_TO_PLS";
          await executeTrade(stopLossTradeDirection);
          console.log(`Stop-loss executed at price: ${currentPrice}.`);
          isTradeActive = false; // Reset flag after stop-loss execution
          clearInterval(stopLossWatcher); // Stop monitoring once stop-loss is executed
        }
      };

      // Start monitoring for stop-loss condition
      const stopLossInterval = 5000; // Check every 5 seconds
      const stopLossWatcher = setInterval(
        monitorPriceAndExecuteStopLoss,
        stopLossInterval
      );
    } else if (!shouldTrade && !isTradeActive) {
      console.log("Waiting for entry conditions...");
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

const tradeInterval = 5000; // Time interval to check for trading conditions
const tradeWatcher = setInterval(tradeIfPriceIsRight, tradeInterval); // Start the trading watcher

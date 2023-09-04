import { addresses } from "../config/config";
import { readJSONFile } from "../utils/readJSONFile";
import { executeTrade } from "../utils/takeAtrade";

type Direction = "above" | "below";

enum TradeState {
  ALERT_MODE,
  EXECUTE_TRADE,
  WAIT_FOR_COMPLETION,
  TRADE_COMPLETED,
  TRADE_WATCH,
  TRADE_EXIT,
  EXIT_COMPLETED,
}

const triggerAlert: number = 0.000038063323354;
const triggerDirection: Direction = "above";
const stopLosePrec: number = 0.99;
const TradedToken: string = "DAI";
let previousBalance: string = "0"; // Store the previous balance of TradedToken
let realStopLose: number;

let currentBalanceAtEntry: string;
let currentRatioAtEntry: number;
let currentBalanceAtEntrySuccess: string;
let currentRatioAtEntrySuccess: number;

let currentState: TradeState = TradeState.ALERT_MODE;

const shouldTriggerTrade = (
  triggerAlert: number,
  triggerDirection: Direction,
  tradedAssetPrice: number
): boolean => {
  if (
    (triggerAlert < tradedAssetPrice && triggerDirection === "above") ||
    (triggerAlert > tradedAssetPrice && triggerDirection === "below")
  ) {
    return true;
  }
  return false;
};

const trade = async (): Promise<void> => {
  try {
    const generalInfo: any = await readJSONFile(
      "pls-trader/ratiosAndBalancesInfo.json"
    );

    if (!generalInfo || !generalInfo[TradedToken]) {
      console.log(`Could not find asset information for ${TradedToken}`);
      return;
    }

    const tradedAssetPrice: number = generalInfo[TradedToken].CURRENT_PRICE;
    const currentBalance: string = generalInfo[TradedToken].BALANCE;

    switch (currentState) {
      case TradeState.ALERT_MODE:
        if (parseFloat(currentBalance) > 0.0001) {
          // Check if there's a balance. Adjust the threshold as needed.
          console.log(
            "You already have a position in the trade. Skipping new trade."
          );
          currentState = TradeState.TRADE_COMPLETED; // Move to the completed state
          return; // Exit this iteration
        }

        if (
          shouldTriggerTrade(triggerAlert, triggerDirection, tradedAssetPrice)
        ) {
          console.log("Triggering the trade with current stats.");
          console.log(
            `TOKENNAME: ${TradedToken}, BALANCE: ${currentBalance}, TRIGER_LIVE_RATIO: ${tradedAssetPrice}`
          );
          executeTrade(addresses.DAI.TOKEN_ADDRESS);
          currentState = TradeState.EXECUTE_TRADE;

          // Save the current balance and ratio at the entry point.
          currentBalanceAtEntry = currentBalance;
          currentRatioAtEntry = tradedAssetPrice;
        } else {
          console.log("Watching for price...");
        }
        break;

      case TradeState.EXECUTE_TRADE:
        // Implement your trade logic here

        // Simulate the trade logic
        await new Promise((res) => setTimeout(res, 5000));

        currentState = TradeState.WAIT_FOR_COMPLETION;
        break;

      case TradeState.WAIT_FOR_COMPLETION:
        if (currentBalance !== previousBalance) {
          currentBalanceAtEntrySuccess = currentBalance;
          currentRatioAtEntrySuccess = tradedAssetPrice;

          let slippage: number =
            currentRatioAtEntrySuccess - currentRatioAtEntry;
          let stopLoseTriggerAlert: number = triggerAlert * stopLosePrec;

          console.log("You entered the trade successfully!");
          console.log(
            `TOKENNAME: ${TradedToken}, BALANCE: ${currentBalance}, REAL_ENTRY: ${tradedAssetPrice}, SLIPPAGE: ${slippage}, REAL_STOP_LOSE: ${stopLoseTriggerAlert}`
          );

          previousBalance = currentBalance; // Update the previous balance
          currentState = TradeState.TRADE_COMPLETED;
        } else {
          console.log("Waiting for transaction...");
        }
        break;

      case TradeState.TRADE_COMPLETED:
        console.log("Transaction ended successfully!");

        realStopLose = currentRatioAtEntrySuccess * stopLosePrec;
        currentState = TradeState.TRADE_WATCH;
        break;

      case TradeState.TRADE_WATCH:
        console.log("Monitoring trade...");
        console.log(
          `Current Price: ${tradedAssetPrice}, Stop Rise Value: ${addresses.DAI.STOP_RISE}`
        );

        if (tradedAssetPrice < realStopLose) {
          console.log("Price dropped below stop loss! Exiting trade...");
          currentState = TradeState.TRADE_EXIT;
        } else if (tradedAssetPrice > realStopLose + addresses.DAI.STOP_RISE) {
          realStopLose += addresses.DAI.STOP_RISE;
          console.log(`Raised stop loss to: ${realStopLose}`);
        }
        break;

      case TradeState.TRADE_WATCH:
        console.log("Monitoring trade...");

        if (tradedAssetPrice < realStopLose) {
          console.log("Price dropped below stop loss! Exiting trade...");
          currentState = TradeState.TRADE_EXIT;
        } else if (tradedAssetPrice > realStopLose + addresses.DAI.STOP_RISE) {
          realStopLose += addresses.DAI.STOP_RISE;
          console.log(`Raised stop loss to: ${realStopLose}`);
        }
        break;

      case TradeState.TRADE_EXIT:
        console.log("Executing trade exit...");
        executeTrade(addresses.DAI.TOKEN_ADDRESS); // Assuming this function can be used to exit the trade too

        // Save the exit balance and ratio. For simplicity, re-using the same variables
        currentBalanceAtEntry = currentBalance;
        currentRatioAtEntry = tradedAssetPrice;

        currentState = TradeState.EXIT_COMPLETED;
        break;

      case TradeState.EXIT_COMPLETED:
        console.log("Trade exit completed successfully!");
        // If you want to stop the entire script here, clear the interval
        clearInterval(tradeInterval);
        break;
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

const tradeInterval = setInterval(trade, 1000);

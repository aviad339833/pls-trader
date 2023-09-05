import { addresses } from "../config/config";
import { Direction, TradeState } from "../config/types";
import { getCurrentDateTime } from "../utils/getTime";
import { describeDifference } from "../utils/percentageDifference";
import { readJSONFile } from "../utils/readJSONFile";
import { executeTrade } from "../utils/takeAtrade";
import { shouldTriggerTrade } from "../utils/trades/tradeTriggers";
import { cancelAllPendingTransactions } from "./resetNounce";

const triggerAlert: number = 0.000037384629594;
const triggerDirection: Direction = "below";
const stopLosePrec: number = 0.99;
const TradedToken: string = "DAI";
let previousBalance: string = "0"; // Store the previous balance of TradedToken
let realStopLose: number;

let currentBalanceAtEntry: string;
let currentRatioAtEntry: number;
let currentBalanceAtEntrySuccess: string;
let currentRatioAtEntrySuccess: number;

let currentState: TradeState = TradeState.ALERT_MODE;

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
          console.clear();
          console.log("Watching for price...");
          console.log(`Current Price :${tradedAssetPrice}`);
          console.log(
            `when Price goes ${triggerDirection} ${triggerAlert} You Will Enter A trade`
          );
          console.log(`You Are Trading: ${TradedToken}`);

          console.log(describeDifference(tradedAssetPrice, triggerAlert));
        }

        break;

      case TradeState.EXECUTE_TRADE:
        executeTrade(addresses.DAI.TOKEN_ADDRESS);
        currentState = TradeState.WAIT_FOR_COMPLETION;
        break;

      case TradeState.WAIT_FOR_COMPLETION:
        if (currentBalance !== previousBalance) {
          currentBalanceAtEntrySuccess = currentBalance;
          currentRatioAtEntrySuccess = tradedAssetPrice;

          let slippage: number =
            currentRatioAtEntrySuccess - currentRatioAtEntry;
          let stopLoseTriggerAlert: number = triggerAlert * stopLosePrec;

          console.clear();
          console.log("You entered the trade successfully!");
          console.log(
            `TOKENNAME: ${TradedToken}, BALANCE: ${currentBalance}, REAL_ENTRY: ${tradedAssetPrice}, SLIPPAGE: ${slippage}, REAL_STOP_LOSE: ${stopLoseTriggerAlert}`
          );
          console.log("Resting for 10 seconds.. ");

          await new Promise((res) => setTimeout(res, 10000));

          previousBalance = currentBalance; // Update the previous balance
          currentState = TradeState.TRADE_COMPLETED;
        } else {
          console.clear();
          console.log("Waiting for transaction...");
        }
        break;

      case TradeState.TRADE_COMPLETED:
        console.clear();
        console.log("Transaction ended successfully!");
        realStopLose = currentRatioAtEntrySuccess * stopLosePrec;
        currentState = TradeState.TRADE_WATCH;

        break;

      case TradeState.TRADE_WATCH:
        console.clear();
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
        console.clear();
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
    console.log(getCurrentDateTime());
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

const tradeInterval = setInterval(trade, 1000);

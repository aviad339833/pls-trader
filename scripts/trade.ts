import { addresses } from "../config/config";
import { readJSONFile } from "../utils/readJSONFile";
import { executeTrade } from "../utils/takeAtrade";

type Direction = "above" | "below";

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

const triggerAlert: number = 0.000038063323354;
const triggerDirection: Direction = "above";
const TradedToken: string = "DAI";
let previousBalance: string = "0"; // Store the previous balance of TradedToken

enum TradeState {
  ALERT_MODE,
  EXECUTE_TRADE,
  WAIT_FOR_COMPLETION,
  TRADE_COMPLETED,
}

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
        if (
          shouldTriggerTrade(triggerAlert, triggerDirection, tradedAssetPrice)
        ) {
          console.log("Triggering the trade.");
          executeTrade(addresses.DAI.TOKEN_ADDRESS);
          currentState = TradeState.EXECUTE_TRADE;
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
          console.log("You entered the trade successfully!");
          previousBalance = currentBalance; // Update the previous balance
          currentState = TradeState.TRADE_COMPLETED;
        } else {
          console.log("Waiting for transaction...");
        }
        break;

      case TradeState.TRADE_COMPLETED:
        console.log("Transaction ended successfully!");
        // You can stop the interval here if you don't want any more checks
        break;
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

setInterval(trade, 1000);

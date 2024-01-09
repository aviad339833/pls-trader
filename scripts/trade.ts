import { addresses } from "../config/config";
import { readJSONFile } from "../utils/readJSONFile";
import { executeTrade } from "../utils/takeAtrade";

const triggerPrice: number = 0.000063703070516; // Set your target price here
const tradedToken: string = "DAI"; // The token you are trading
const tradeInterval: number = 5000; // Check every 5 seconds
const triggerDirection: "above" | "below" = "below";

const tradeIfPriceIsRight = async (): Promise<void> => {
  try {
    const generalInfo: any = await readJSONFile(
      "pls-trader/ratiosAndBalancesInfo.json"
    );

    if (!generalInfo || !generalInfo[tradedToken]) {
      console.error(`Could not find asset information for ${tradedToken}`);
      return;
    }

    const currentPrice: number = generalInfo[tradedToken].CURRENT_PRICE;

    // Calculate how close the current price is to the trigger price
    const priceDifference = currentPrice - triggerPrice;
    const percentageDifference = (priceDifference / triggerPrice) * 100;

    // Check if the current price has hit the trigger price based on the specified direction
    const isTradeTriggered: any =
      triggerDirection === "above"
        ? currentPrice >= triggerPrice
        : currentPrice <= triggerPrice;

    if (isTradeTriggered) {
      console.log(
        `Triggering trade for ${tradedToken} at price: ${currentPrice}. Target was: ${triggerPrice} (${triggerDirection}).`
      );
      executeTrade(addresses.DAI.TOKEN_ADDRESS); // Uncomment this line to execute the trade
      clearInterval(tradeWatcher); // Stop the interval after trade execution
    } else {
      console.log(
        `Current Price of ${tradedToken}: ${currentPrice}, waiting for target price: ${triggerPrice} (${triggerDirection}).`
      );
      console.log(
        `The current price is ${priceDifference.toFixed(
          10
        )} (${percentageDifference.toFixed(2)}%) away from the target.`
      );
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

const tradeWatcher = setInterval(tradeIfPriceIsRight, tradeInterval);

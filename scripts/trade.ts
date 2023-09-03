import { addresses } from "../config/config";
import { readJSONFile } from "../utils/readJSONFile";
import { executeTrade } from "../utils/takeAtrade";
import { updateJsonFile } from "../utils/updateJsonFile";
import { cancelAllPendingTransactions } from "./resetNounce";

// Define types for your JSON files and any other custom types
interface GeneralInfo {
  DAI: {
    CURRENT_PRICE: number;
    BALANCE: number;
  };
  PLS_WALLET: {
    BALANCE: number;
  };
}

interface TradeInfo {
  InTrade: boolean;
  CurrentDAIBalance: number;
  WaitingForExit: boolean;
  // Add other fields as required
}

// Configurations should ideally be moved to a separate config file
const watchTrade: boolean = true;
const triggerAlert: number = 0.00003946357549;
const triggerDirection: "above" | "below" = "above";

const shouldExecuteTrade = (
  price: number,
  triggerAlert: number,
  triggerDirection: "above" | "below"
): boolean => {
  return triggerDirection === "above"
    ? price > triggerAlert
    : price < triggerAlert;
};

const updateTradeInfo = async (generalInfo: GeneralInfo): Promise<void> => {
  const { CURRENT_PRICE, BALANCE } = generalInfo.DAI;
  const currentDAIBalance = BALANCE / addresses.DAI.BALANCE_DEVIDER; // Add your divider logic here
  const currentPLSBalance =
    generalInfo.PLS_WALLET.BALANCE / addresses.PLS.BALANCE_DEVIDER; // Add your divider logic here

  await updateJsonFile({
    TokenName: "DAI",
    WatchTrade: watchTrade,
    CurrentPrice: CURRENT_PRICE,
    TriggerAlert: triggerAlert,
    CurrentDAIBalance: currentDAIBalance,
    CurrentPLSBalance: currentPLSBalance,
    TriggerDirection: triggerDirection,
    OriginalStopLoss: triggerAlert * 0.995,
    InTrade: currentDAIBalance > 0,
    WaitingForExit: false,
    // Add more fields as needed
  });
};

const trade = async (): Promise<void> => {
  try {
    const generalInfo: GeneralInfo | null = await readJSONFile(
      "pls-trader/ratiosAndBalancesInfo.json"
    );
    const tradeInfo: TradeInfo | null = await readJSONFile(
      "pls-trader/utils/trades/DAI_trade_info.json"
    );

    if (!generalInfo || !tradeInfo) {
      throw new Error("Failed to read JSON files.");
    }

    await updateTradeInfo(generalInfo);

    console.clear();
    console.log(tradeInfo);
    if (watchTrade) {
      console.log("you should strat watching the alert trigger");
    } else {
      console.log(
        "You need to set the flag to true if you want to watch the trade"
      );
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

// Assuming you want to run trade every second
setInterval(trade, 1000);

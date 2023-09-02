import { addresses } from "../config/config";
import { readJSONFile } from "../utils/readJSONFile";
import { executeTrade } from "../utils/takeAtrade";
import { updateJsonFile } from "../utils/updateJsonFile";
import { cancelAllPendingTransactions } from "./resetNounce";

const trade = async () => {
  const generalInfo = await readJSONFile(
    "pls-trader/ratiosAndBalancesInfo.json"
  ).then((content) => {
    if (content) {
      return content;
    }
  });
  const tradeInfo = await readJSONFile(
    "pls-trader/utils/trades/DAI_trade_info.json"
  ).then((content) => {
    return content !== null ? content : "Some default value or throw an error";
  });

  const watchTrade = true;
  const triggerAlert = 0.000037984939905;
  const triggerDirection = "above";

  // Test the function
  await updateJsonFile({
    TokenName: "DAI",
    WatchTrade: watchTrade,
    CurrentPrice: generalInfo.DAI.CURRENT_PRICE,
    TrigerAlert: triggerAlert,
    CurrentDAIBalance: generalInfo.DAI.BALANCE / addresses.DAI.BALANCE_DEVIDER,
    CurrentPLSBalance:
      generalInfo.PLS_WALLET.BALANCE / addresses.PLS.BALANCE_DEVIDER,
    TrigerDirection: triggerDirection,
    OriginalStopLose: triggerAlert * 0.995,
    TralingStopLose: triggerAlert * 0.995,
    StopLoseRise: addresses.DAI.STOP_RISE,
  });

  if (watchTrade) {
    await updateJsonFile({
      InTrade: false,
      EnterAtrade: false,
      FinishedTradeEntry: false,
      TradeRatioEntry: 0,
      ExiteTrade: false,
      ExiteTradeRatio: 0,
    });

    if (
      tradeInfo.CurrentDAIBalance > 0 &&
      !tradeInfo.FinishedTradeEntry &&
      !tradeInfo.InTrade
    ) {
      await updateJsonFile({
        InTrade: true,
        FinishedTradeEntry: true,
      });
    } else {
      await updateJsonFile({
        InTrade: false,
      });
    }

    if (
      !tradeInfo.InTrade &&
      tradeInfo.TrigerDirection === "above" &&
      triggerAlert < generalInfo.DAI.CURRENT_PRICE &&
      !tradeInfo.EnterAtrade &&
      tradeInfo.CurrentDAIBalance == 0
    ) {
      await updateJsonFile({
        EnterAtrade: true,
      });
      executeTrade(addresses.DAI.PAIR_ADDRESS);
      cancelAllPendingTransactions();
    }
    if (
      !tradeInfo.InTrade &&
      tradeInfo.TrigerDirection === "below" &&
      triggerAlert > generalInfo.DAI.CURRENT_PRICE &&
      !tradeInfo.EnterAtrade &&
      tradeInfo.CurrentDAIBalance == 0
    ) {
      console.log(
        "triggerAlert is graater than  generalInfo.DAI.CURRENT_PRICE "
      );
      console.log("Excute a trade");
      await updateJsonFile({
        EnterAtrade: true,
      });
    }
  }

  console.log(tradeInfo);
};

setInterval(trade, 1000);

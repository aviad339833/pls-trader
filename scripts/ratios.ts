import fs from "fs/promises";
import { getAllBalances } from "../utils/getAllBalances";
import { getRatio } from "../utils/getRatio";
import { AMPLIFIER, addresses } from "../config/config";
import { getPLSWalletBalance } from "../utils/getPLSWalletBalance";
import { getBalance } from "../utils/getTokenBlance";

async function loadTradingConfigurations() {
  const configFileContent = await fs.readFile("trade.json", "utf8");
  const config = JSON.parse(configFileContent);
  return config.tradingStrategies;
}

export const bigIntToDecimalString = (
  rawBigInt: BigInt | undefined,
  decimals: number
): number => {
  if (typeof rawBigInt === "undefined") {
    return 0;
  }

  const fullStr = rawBigInt.toString().padStart(decimals + 1, "0");
  const intPart = fullStr.slice(0, -decimals) || "0";
  const fractPart = fullStr.slice(-decimals).padEnd(decimals, "0");

  // console.log("fullStr", Number(intPart + "." + fractPart));
  return Number(intPart + "." + fractPart);
};

async function updateRatios() {
  let plsPrice: number = 0;
  try {
    const tradingStrategies = await loadTradingConfigurations();

    let fetchPromises = [];

    // Prepare data structure for results
    let priceData: any = {};

    // Gather all promises for fetching ratios
    for (const strategy of tradingStrategies) {
      const { pair } = strategy;
      const [fromTokenSymbol, toTokenSymbol] = pair.split("_");

      // Skip if WPLS is the target token, as we're calculating ratios relative to WPLS

      fetchPromises.push(
        getRatio(
          addresses[fromTokenSymbol].PAIR_ADDRESS.toLowerCase(),
          addresses[fromTokenSymbol].TOKEN_ADDRESS,
          addresses[fromTokenSymbol].WALLET_PRIVATE_KEY
        ).then((price) => {
          return {
            symbol: fromTokenSymbol,
            price: bigIntToDecimalString(price, 10),
          };
        })
      );

      if (fromTokenSymbol !== toTokenSymbol) {
        fetchPromises.push(
          getRatio(
            addresses[toTokenSymbol].PAIR_ADDRESS.toLowerCase(),
            addresses[toTokenSymbol].TOKEN_ADDRESS,
            addresses[toTokenSymbol].WALLET_PRIVATE_KEY
          ).then((price) => {
            if (toTokenSymbol === "WPLS") {
              plsPrice = bigIntToDecimalString(price, 10);
            }
            return {
              symbol: toTokenSymbol,
              price: bigIntToDecimalString(price, 10),
            };
          })
        );
      }
    }

    // Wait for all promises to resolve
    const results = await Promise.all(fetchPromises);

    // Process results
    for (const result of results) {
      const tokenBalance = await getBalance(
        addresses[result.symbol].TOKEN_ADDRESS.toLowerCase(),
        addresses[result.symbol].WALLET_PRIVATE_KEY
      );

      priceData[result.symbol] = {
        CURRENT_PRICE: result.price
          ? result.symbol === "WPLS"
            ? result.price
            : plsPrice * result.price
          : "Price not available",
        BALANCE: String(tokenBalance.your_token_balance),
        TOKEN_NAME: result.symbol,
      };
    }

    const jsonStr = JSON.stringify(priceData, null, 2);
    await fs.writeFile("priceData.json", jsonStr);
    console.log(priceData);
    console.log("Updated price data successfully.");
  } catch (error) {
    console.error("Error updating price data:", error);
  }
}

// Run updateRatios every second
setInterval(updateRatios, 1000);

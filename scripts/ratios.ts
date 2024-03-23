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
): string => {
  if (typeof rawBigInt === "undefined") {
    return "0";
  }

  const fullStr = rawBigInt.toString().padStart(decimals + 1, "0");
  const intPart = fullStr.slice(0, -decimals) || "0";
  const fractPart = fullStr.slice(-decimals).padEnd(decimals, "0");

  return intPart + "." + fractPart;
};

async function updateRatios() {
  try {
    const tradingStrategies = await loadTradingConfigurations();
    let priceData: any = {};
    console.log("Loaded trading strategies:", tradingStrategies.length);

    for (const strategy of tradingStrategies) {
      const { pair, walletAddress } = strategy;

      const [fromTokenSymbol, toTokenSymbol] = pair.split("_");

      // Ensure you have the correct private keys setup for each wallet in your config
      const privateKey = addresses[fromTokenSymbol].WALLET_PRIVATE_KEY!; // This line seems to be incorrect as private keys should be fetched based on walletAddress, not tokenSymbol.
      const fromTokenBalance = await getBalance(
        addresses[fromTokenSymbol].TOKEN_ADDRESS.toLowerCase(),
        privateKey
      );

      const toTokenBalance = await getBalance(
        addresses[toTokenSymbol].TOKEN_ADDRESS.toLowerCase(),
        privateKey
      );

      console.log(
        `Fetching prices for ${fromTokenSymbol} and ${toTokenSymbol}`
      );

      // Note: getRatio doesn't seem to require a private key in your original function definition.
      const fromTokenPrice = await getRatio(
        addresses[fromTokenSymbol].PAIR_ADDRESS.toLowerCase(),
        privateKey
      );
      const toTokenPrice = await getRatio(
        addresses[toTokenSymbol].PAIR_ADDRESS.toLowerCase(),
        privateKey
      );

      console.log(
        `Price for ${fromTokenSymbol}:`,
        bigIntToDecimalString(fromTokenPrice, 10)
      );
      console.log(
        `Price for ${toTokenSymbol}:`,
        bigIntToDecimalString(toTokenPrice, 10)
      );

      // Calculating the price ratio if needed or direct prices
      priceData[fromTokenSymbol] = {
        CURRENT_PRICE: fromTokenPrice
          ? bigIntToDecimalString(fromTokenPrice, 10)
          : "Price not available",
        BALANCE: String(fromTokenBalance.your_token_balance),
        TOKEN_NAME: fromTokenSymbol,
      };

      priceData[toTokenSymbol] = {
        CURRENT_PRICE: toTokenPrice
          ? bigIntToDecimalString(toTokenPrice, 10)
          : "Price not available",
        BALANCE: String(toTokenBalance.your_token_balance),
        TOKEN_NAME: toTokenSymbol,
      };
    }

    const jsonStr = JSON.stringify(priceData, null, 2);
    await fs.writeFile("priceData.json", jsonStr);
    console.log("Updated price data successfully.");
  } catch (error) {
    console.error("Error updating price data:", error);
  }
}

// Run updateRatios every second
setInterval(updateRatios, 1000);

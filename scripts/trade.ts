import { ethers } from "hardhat";
import pair_ABI from "./pair_ABI.json";
import router_ABI from "./router_ABI.json";
import wpls_ABI from "./wpls_ABI.json";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const targetRatioDecimalsPLStoDai = 0.000049448109466;
  const targetRatioDecimalsDaiToPLS = 2874;
  const tradePLStoDAI = true;

  const hardhatWalletKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const RPC_URL = process.env.LIVE_RPC || "https://rpc.pulsechain.com";

  const amplifier = 10000000000n;

  let targetRatio: BigInt;
  if (tradePLStoDAI) {
    targetRatio = BigInt(
      Math.round(Number(amplifier) * targetRatioDecimalsPLStoDai)
    );
  } else {
    targetRatio = BigInt(
      Math.round(Number(amplifier) * targetRatioDecimalsDaiToPLS)
    );
  }

  const DAI_ADDRESS = "0xefD766cCb38EaF1dfd701853BFCe31359239F305";
  const WPLS_ADDRESS = "0xa1077a294dde1b09bb078844df40758a5d0f9a27";
  const PAIR_ADDRESS = "0xe56043671df55de5cdf8459710433c10324de0ae";
  const ROUTER_ADDRESS = "0x98bf93ebf5c380C0e6Ae8e192A7e2AE08edAcc02";

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(hardhatWalletKey, provider);

  const pair_contract = new ethers.Contract(PAIR_ADDRESS, pair_ABI, signer);
  const router_contract = new ethers.Contract(
    ROUTER_ADDRESS,
    router_ABI,
    signer
  );
  const dai_contract = new ethers.Contract(DAI_ADDRESS, wpls_ABI, signer);

  // Entry price
  const entryPrice = 0.000049060952758;

  // Initial stop-loss price
  let stopLossPrice = 0.000048495870613;
  const initialStopLossPrice = stopLossPrice;

  // Growth rates and intervals
  const growthRate24Hours = 0.03; // 3% in 24 hours
  const growthIntervalSeconds = 1; // Growth interval in seconds

  // Calculate the increment per second
  const secondsIn24Hours = 24 * 60 * 60;
  const growthIncrement =
    initialStopLossPrice * (growthRate24Hours / secondsIn24Hours);

  const getRatio = async () => {
    try {
      const reserves = await pair_contract.getReserves();
      let ratio: BigInt;
      if (tradePLStoDAI) {
        ratio = (amplifier * reserves[1]) / reserves[0];
      } else {
        ratio = (amplifier * reserves[0]) / reserves[1];
      }
      return ratio;
    } catch (err) {
      console.error("Error fetching ratio:", err);
    }
  };

  const logTradeInfo = async () => {
    const ratio = await getRatio();
    console.log(`Ratio: ${ratio}, targetRatio: ${targetRatio}`);

    const currentPrice = Number(ratio) / Number(amplifier);
    console.log(`Current Price: ${currentPrice}`);
    console.log(`Original Stop-Loss Price: ${initialStopLossPrice}`);
    console.log(`Current Stop-Loss Price: ${stopLossPrice}`);

    const percentageIncrease =
      ((stopLossPrice - initialStopLossPrice) / initialStopLossPrice) * 100;
    const distanceCurrentToStopLoss =
      ((currentPrice - stopLossPrice) / stopLossPrice) * 100;
    const distanceCurrentToInitialStopLoss =
      ((currentPrice - initialStopLossPrice) / initialStopLossPrice) * 100;

    console.log(
      `Stop-Loss Price has increased by: ${percentageIncrease.toFixed(10)}%`
    );
    console.log(
      `Distance from Current Price to Current Stop-Loss: ${distanceCurrentToStopLoss.toFixed(
        10
      )}%`
    );
    console.log(
      `Distance from Current Price to Original Stop-Loss: ${distanceCurrentToInitialStopLoss.toFixed(
        10
      )}%`
    );

    if (currentPrice <= stopLossPrice) {
      console.log(
        `ALERT: Current price of ${
          tradePLStoDAI ? "PLS" : "DAI"
        } has fallen to the stop-loss price. Current price: ${currentPrice}`
      );
    }

    // Increment the stop-loss price
    stopLossPrice += growthIncrement;
  };

  async function poll(ms: number) {
    let result = await logTradeInfo();
    while (true) {
      await wait(ms);
      result = await logTradeInfo();
    }
  }

  function wait(ms: number) {
    return new Promise((resolve) => {
      console.log(`waiting ${ms} ms...`);
      setTimeout(resolve, ms);
    });
  }

  await poll(growthIntervalSeconds * 1000);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

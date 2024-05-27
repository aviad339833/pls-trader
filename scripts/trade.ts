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
  const entryPrice = 0.000048910969116;

  // Initial stop-loss price
  let stopLossPrice = 0.000048419634488;
  const initialStopLossPrice = stopLossPrice;

  // Choose growth rate and interval
  const growthRateOption1 = { rate: 0.02, hours: 5 }; // 2% in 5 hours
  const growthRateOption2 = { rate: 0.1, hours: 1 }; // 3% in 24 hours

  const selectedOption = growthRateOption2; // Change to growthRateOption1 for the other option

  const growthRate = selectedOption.rate;
  const growthIntervalHours = selectedOption.hours;

  // Delay before the stop-loss starts rising (in seconds)
  const delayBeforeRising = 1 * 60; // 120 minutes

  // Calculate the increment per second
  const secondsInInterval = growthIntervalHours * 60 * 60;
  const growthIncrement =
    initialStopLossPrice * (growthRate / secondsInInterval);

  console.log(`Initial settings:`);
  console.log(`Entry Price: ${entryPrice}`);
  console.log(`Original Stop-Loss Price: ${initialStopLossPrice}`);
  console.log(
    `Growth Rate: ${growthRate * 100}% in ${growthIntervalHours} hours`
  );

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
  };

  const logAndUpdateStopLoss = async () => {
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

    // Increment the stop-loss price only if delay period has passed
    stopLossPrice += growthIncrement;

    // Log the rate of stop-loss rise
    console.log(
      `Stop-Loss is rising at a rate of ${
        (growthIncrement / initialStopLossPrice) * 100
      }% per second.`
    );
  };

  async function poll(ms: number) {
    let result = await logTradeInfo();
    let elapsedTime = 0;
    const startTime = Date.now(); // Record the start time

    while (true) {
      await wait(ms);
      elapsedTime = (Date.now() - startTime) / 1000; // Calculate elapsed time in seconds

      if (elapsedTime > delayBeforeRising) {
        result = await logAndUpdateStopLoss();
      } else {
        result = await logTradeInfo();
      }
    }
  }

  function wait(ms: number) {
    return new Promise((resolve) => {
      console.log(`waiting ${ms} ms...`);
      setTimeout(resolve, ms);
    });
  }

  await poll(1000); // Poll every second
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

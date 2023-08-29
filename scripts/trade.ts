import { ethers } from "hardhat";
import pair_ABI from "./pair_ABI.json";
import router_ABI from "./router_ABI.json";
import wpls_ABI from "./wpls_ABI.json";
import { setNonce } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import readline from "readline"; // Import readline module
require("dotenv").config();

interface UserInputs {
  targetPrice: number;
  triggerAbove: boolean;
  tradePLStoDAIInput: boolean;
}

async function gatherUserInputs(): Promise<UserInputs> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let targetPrice: number, triggerAbove: boolean, tradePLStoDAIInput: boolean;

    rl.question("Enter target price: ", (price) => {
      targetPrice = parseFloat(price);
      rl.question(
        "Trigger a trade if price is above (true/false): ",
        (above) => {
          triggerAbove = above === "true";
          rl.question("Trade PLS to DAI? (true/false): ", (tradePLS) => {
            tradePLStoDAIInput = tradePLS === "true";
            rl.close();
            resolve({ targetPrice, triggerAbove, tradePLStoDAIInput });
          });
        }
      );
    });
  });
}

async function main() {
  const { targetPrice, triggerAbove, tradePLStoDAIInput } =
    await gatherUserInputs();
  // The three most important variables
  const targetRatioDecimalsPLStoDai = targetPrice;
  const tradePLStoDAI = tradePLStoDAIInput;
  const shouldTradeUp = triggerAbove;

  // two next important variables
  const hardhatWalletKey = process.env.HARDHAT_WALLET_KEY;
  // const RPC_URL = "http://127.0.0.1:8545";
  const RPC_URL = "https://rpc.pulsechain.com";

  if (!hardhatWalletKey) {
    throw new Error("HARDHAT_WALLET_KEY is not defined");
  }

  const amplifier = 10000000000n; // to get rid of rounding issues

  let targetRatio: BigInt;

  targetRatio = BigInt(
    Math.round(Number(amplifier) * targetRatioDecimalsPLStoDai)
  );

  // In PulseChain mainnet
  const DAI_ADDRESS = "0xefD766cCb38EaF1dfd701853BFCe31359239F305";
  const WPLS_ADDRESS = "0xa1077a294dde1b09bb078844df40758a5d0f9a27";
  const PAIR_ADDRESS = "0xe56043671df55de5cdf8459710433c10324de0ae";
  const ROUTER_ADDRESS = "0x98bf93ebf5c380C0e6Ae8e192A7e2AE08edAcc02";

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(hardhatWalletKey, provider);

  const pair_contract = new ethers.Contract(PAIR_ADDRESS, pair_ABI, signer);
  let router_contract = new ethers.Contract(ROUTER_ADDRESS, router_ABI, signer);
  /*   const wpls_contract = new ethers.Contract(
    WPLS_ADDRESS,
    wpls_ABI,
    signer
  );  */
  const dai_contract = new ethers.Contract(DAI_ADDRESS, wpls_ABI, signer);

  const getRatio = async () => {
    try {
      const reserves = await pair_contract.getReserves();
      let ratio: BigInt;

      ratio = (amplifier * reserves[1]) / reserves[0];

      return ratio;
    } catch (err) {
      console.error("Error fetching ratio:", err);
    }
  };

  const tradeIfRatio = async (shouldTradeUp: any) => {
    const ratio = await getRatio();
    console.log(`Ratio: ${ratio}, targetRatio: ${targetRatio}`);

    let shouldTrade = false;
    let reason = "";

    if (shouldTradeUp && ratio && ratio > targetRatio) {
      shouldTrade = true;
    } else if (shouldTradeUp) {
      reason = `Price needs to go above ${targetRatio} to initiate a trade.`;
    }

    if (!shouldTradeUp && ratio && ratio < targetRatio) {
      shouldTrade = true;
    } else if (!shouldTradeUp) {
      reason = `Price needs to go below ${targetRatio} to initiate a trade.`;
    }

    if (shouldTrade) {
      // the ratio should be below the target ratio
      console.log(`hurray, let's trade, direction: `, tradePLStoDAI);

      // Get the blockchain's timestamp
      const block = await provider.getBlock("latest");
      const timestamp = block!.timestamp;
      const deadline = timestamp + 1000; // add a bit of extra time before deadline. in seconds

      //const oldWPLSBalance = await wpls_contract.balanceOf(signer.address);
      const oldDaiBalance = await dai_contract.balanceOf(signer.address);
      const oldNativeBalance = await provider.getBalance(signer.address);

      console.log(`your DAI balance: `, oldDaiBalance);
      console.log(`your PLS balance: `, oldNativeBalance);

      const executeTrade = async () => {
        if (tradePLStoDAI) {
          const inputPLS = (oldNativeBalance / 100n) * 95n; // leave 3% for gas costs

          await router_contract.swapExactETHForTokens(
            1, // amountOutMin (uint256) (slippage)
            [WPLS_ADDRESS, DAI_ADDRESS], // path (address[])
            signer.address, // to (address)
            deadline, // deadline (uint256)
            { value: inputPLS }
          );
        } else {
          if (oldDaiBalance == 0) {
            throw "No DAI to trade";
          }

          // Add approval to withdraw our DAI
          await dai_contract.approve(ROUTER_ADDRESS, oldDaiBalance);

          // Unsure why we have to manually adjust the nonce
          const nonce = await signer.getNonce();

          await router_contract.swapExactTokensForETH(
            oldDaiBalance, // amountIn (uint256)
            1, // amountOutMin (uint256) (slippage)
            [DAI_ADDRESS, WPLS_ADDRESS], // path (address[])
            signer.address, // to (address)
            deadline, // deadline (uint256)
            { nonce: nonce }
          );
        }
      };

      await executeTrade();

      //const newWPLSBalance = await wpls_contract.balanceOf(signer.address);
      const newDaiBalance = await dai_contract.balanceOf(signer.address);
      const newNativeBalance = await provider.getBalance(signer.address);

      //console.log(`WPLS balances. Old: ${oldWPLSBalance}. New: ${newWPLSBalance}. Diff: ${newWPLSBalance - oldWPLSBalance}` );
      console.log(
        `DAI balances. Old: ${oldDaiBalance}. New: ${newDaiBalance}. Diff: ${
          newDaiBalance - oldDaiBalance
        }`
      );
      console.log(
        `Native balances. Old: ${oldNativeBalance}. New: ${newNativeBalance}. Diff: ${
          newNativeBalance - oldNativeBalance
        }`
      );

      throw "Purchase done";
    } else {
      if (shouldTradeUp) {
        console.log(
          `Price needs to go above ${targetRatio} to initiate a trade.`
        );
      } else {
        console.log(
          `Price needs to go below ${targetRatio} to initiate a trade.`
        );
      }

      console.log(`shitty price, let's not trade`);
      return false;
    }
  };

  // Code borrowed from https://dev.to/jakubkoci/polling-with-async-await-25p4
  async function poll(ms: number) {
    let result = await tradeIfRatio(shouldTradeUp);
    while (true) {
      await wait(ms);
      process.stdout.write("\x1Bc"); // Clear the terminal screen
      result = await tradeIfRatio(shouldTradeUp);
    }
  }
  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`waiting ${ms} ms...`);
        resolve();
      }, ms);
    });
  }

  // Polling, every 5 seconds
  await poll(5000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

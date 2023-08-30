import { ethers } from "hardhat";
import pair_ABI from "./pair_ABI.json";
import router_ABI from "./router_ABI.json";
import wpls_ABI from "./wpls_ABI.json";
import { setNonce } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import readline from "readline"; // Import readline module
import { sendMessage } from "../utils/sendMessage";
import { getBalance } from "./getTokenBlance";
import { DAI_ADDRESS, HEX_ADDRESS, PLSX_ADDRESS, WPLS_ADDRESS } from "./config";
import { gatherUserInputs } from "./userInputs";
import { executeTrade } from "./takeAtrade";
require("dotenv").config();

async function main() {
  const trade = await executeTrade(DAI_ADDRESS!);
  console.log(trade, "aviad");
  const { targetPrice, triggerAbove, tradePLStoDAIInput } =
    await gatherUserInputs();

  // The three most important variables
  const targetRatioDecimalsPLStoDai = targetPrice;
  const tradePLStoDAI = tradePLStoDAIInput;
  const shouldTradeUp = triggerAbove;

  // two next important variables - LIVE
  const hardhatWalletKey = process.env.LIVE_WALLET_KEY;
  const RPC_URL = process.env.LIVE_RPC;

  // two next important variables - TESTING
  // const hardhatWalletKey = process.env.HARDHAT_PRIVATE_KEY;
  // const RPC_URL = process.env.RPC_URL_LOCAL;

  if (!hardhatWalletKey) {
    throw new Error("HARDHAT_WALLET_KEY is not defined");
  }

  const amplifier = 10000000000n; // to get rid of rounding issues

  let targetRatio: BigInt;

  targetRatio = BigInt(
    Math.round(Number(amplifier) * targetRatioDecimalsPLStoDai)
  );

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(hardhatWalletKey, provider);

  const pair_contract = new ethers.Contract(
    process.env.PAIR_ADDRESS!,
    pair_ABI,
    signer
  );
  let router_contract = new ethers.Contract(
    process.env.ROUTER_ADDRESS!,
    router_ABI,
    signer
  );
  /*   const wpls_contract = new ethers.Contract(
    WPLS_ADDRESS,
    wpls_ABI,
    signer
  );  */
  const dai_contract = new ethers.Contract(
    process.env.DAI_ADDRESS!,
    wpls_ABI,
    signer
  );

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
    console.log(`left to trade: ${Number(ratio) / Number(targetRatio)}`);

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
          const inputPLS = (oldNativeBalance / 100n) * 97n; // leave 3% for gas costs

          await router_contract.swapExactETHForTokens(
            1, // amountOutMin (uint256) (slippage)
            [process.env.WPLS_ADDRESS, process.env.DAI_ADDRESS], // path (address[])
            signer.address, // to (address)
            deadline, // deadline (uint256)
            { value: inputPLS }
          );

          sendMessage("Sold All PLS for Die ")
            .then(() => {
              console.log("Test completed.");
            })
            .catch((error) => {
              console.error(`Test failed: ${error}`);
            });
        } else {
          if (oldDaiBalance == 0) {
            sendMessage("There is not enough dai inside the wallet")
              .then(() => {
                console.log("Test completed.");
              })
              .catch((error) => {
                console.error(`Test failed: ${error}`);
              });
            throw "No DAI to trade";
          }

          // Add approval to withdraw our DAI
          const approveTx = await dai_contract.approve(
            process.env.ROUTER_ADDRESS,
            oldDaiBalance
          );
          await approveTx.wait(); // Wait for confirmation

          // Unsure why we have to manually adjust the nonce
          const nonce = await signer.getNonce();

          await router_contract.swapExactTokensForETH(
            oldDaiBalance, // amountIn (uint256)
            1, // amountOutMin (uint256) (slippage)
            [process.env.DAI_ADDRESS, process.env.WPLS_ADDRESS], // path (address[])
            signer.address, // to (address)
            deadline // deadline (uint256)
            // { nonce: nonce } ONLY IN TEST MODE
          );
          sendMessage("Sold All Dai To PLs")
            .then(() => {
              console.log("Test completed.");
            })
            .catch((error) => {
              console.error(`Test failed: ${error}`);
            });
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

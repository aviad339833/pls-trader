import { ethers } from "hardhat";
import { sendMessage } from "../utils/sendMessage";
import {
  DAI_ADDRESS,
  LIVE_RPC_URL,
  LIVE_WALLET_KEY,
  WPLS_ADDRESS,
} from "./config";
import { getBalance } from "./getTokenBlance";
import wpls_ABI from "./wpls_ABI.json";
import router_ABI from "./router_ABI.json";

export const executeTrade = async (tradedContract: string) => {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const signer = new ethers.Wallet(LIVE_WALLET_KEY!, provider);

  let router_contract = new ethers.Contract(
    process.env.ROUTER_ADDRESS!,
    router_ABI,
    signer
  );

  const asset_contract = new ethers.Contract(tradedContract, wpls_ABI, signer);

  // Get the blockchain's timestamp
  const block = await provider.getBlock("latest");
  const timestamp = block!.timestamp;
  const deadline = timestamp + 1000; // add a bit of extra time before deadline. in seconds

  const TradedAsset_balance = await getBalance(tradedContract);

  if (TradedAsset_balance.your_token_balance > 0) {
    console.log(`Trade ${TradedAsset_balance.token_symbol} to PLS`);
    if (TradedAsset_balance.your_token_balance == 0) {
      sendMessage(
        `There is not enough ${TradedAsset_balance.token_symbol} inside the wallet`
      )
        .then(() => {
          console.log("Test completed.");
        })
        .catch((error) => {
          console.error(`Test failed: ${error}`);
        });
      throw `No ${TradedAsset_balance.token_symbol} to trade`;
    }

    // Add approval to withdraw our ASSETS account
    const approveTx = await asset_contract.approve(
      process.env.ROUTER_ADDRESS,
      TradedAsset_balance.your_token_balance
    );
    await approveTx.wait(); // Wait for confirmation

    // Unsure why we have to manually adjust the nonce
    const nonce = await signer.getNonce();

    await router_contract.swapExactTokensForETH(
      TradedAsset_balance.your_token_balance, // amountIn (uint256)
      1, // amountOutMin (uint256) (slippage)
      [tradedContract, WPLS_ADDRESS], // path (address[])
      signer.address, // to (address)
      deadline // deadline (uint256)
      // { nonce: nonce } ONLY IN TEST MODE
    );
    sendMessage(`Sold All ${TradedAsset_balance.your_token_balance} To PLs`)
      .then(() => {
        console.log("Test completed.");
      })
      .catch((error) => {
        console.error(`Test failed: ${error}`);
      });
  } else {
    const oldNativeBalance = await provider.getBalance(signer.address);
    const inputPLS = (oldNativeBalance / 100n) * 97n; // leave 3% for gas costs

    await router_contract.swapExactETHForTokens(
      1, // amountOutMin (uint256) (slippage)
      [WPLS_ADDRESS, tradedContract], // path (address[])
      signer.address, // to (address)
      deadline, // deadline (uint256)
      { value: inputPLS }
    );

    sendMessage(`Sold All PLS for ${TradedAsset_balance.token_symbol} `)
      .then(() => {
        console.log("Test completed.");
      })
      .catch((error) => {
        console.error(`Test failed: ${error}`);
      });
  }
};

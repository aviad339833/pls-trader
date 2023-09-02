import { ethers } from "hardhat";
import { sendMessage } from "./sendMessage";
import { addresses, LIVE_RPC_URL, LIVE_WALLET_KEY } from "../config/config";
import { getBalance } from "./getTokenBlance";
import wpls_ABI from "../abis/wpls_ABI.json";
import router_ABI from "../abis/router_ABI.json";

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
  const deadline = timestamp + 1000;

  const TradedAsset_balance = await getBalance(tradedContract);

  // Store the initial balance of the other asset before trading
  const oldOtherAssetBalance = await getBalance(addresses.WPLS.TOKEN_ADDRESS);

  if (TradedAsset_balance.your_token_balance > 0) {
    console.log(`Trade ${TradedAsset_balance.token_symbol} to PLS`);
    if (TradedAsset_balance.your_token_balance === 0) {
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

    const approveTx = await asset_contract.approve(
      process.env.ROUTER_ADDRESS,
      TradedAsset_balance.your_token_balance
    );

    await approveTx.wait();

    const tx = await router_contract.swapExactTokensForETH(
      TradedAsset_balance.your_token_balance,
      1,
      [tradedContract, addresses.WPLS.TOKEN_ADDRESS],
      signer.address,
      deadline
    );

    // Wait for the transaction to be mined
    await tx.wait();
  } else {
    const oldNativeBalance = await provider.getBalance(signer.address);
    const inputPLS = (oldNativeBalance / 100n) * 97n;

    const tx2 = await router_contract.swapExactETHForTokens(
      1,
      [addresses.WPLS.TOKEN_ADDRESS, tradedContract],
      signer.address,
      deadline,
      { value: inputPLS }
    );

    // Wait for the transaction to be mined
    await tx2.wait();
  }

  // Check the balance of the other asset after trading
  const newOtherAssetBalance = await getBalance(tradedContract);

  // Compare the new and old balances
  if (
    newOtherAssetBalance.your_token_balance !==
    oldOtherAssetBalance.your_token_balance
  ) {
    sendMessage(`Success: The balance of the other asset has changed.`)
      .then(() => {
        console.log("Test completed.");
      })
      .catch((error) => {
        console.error(`Test failed: ${error}`);
      });
  } else {
    console.log("The balance of the other asset did not change.");
  }
};

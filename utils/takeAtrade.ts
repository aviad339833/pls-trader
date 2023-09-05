import { ethers } from "hardhat";
import { sendMessage } from "./sendMessage";
import { addresses, LIVE_RPC_URL, LIVE_WALLET_KEY } from "../config/config";
import { getBalance } from "./getTokenBlance";
import wpls_ABI from "../abis/wpls_ABI.json";
import router_ABI from "../abis/router_ABI.json";
import { cancelAllPendingTransactions } from "../scripts/resetNounce";

export const executeTrade = async (tradedContract: string) => {
  try {
    const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
    const signer = new ethers.Wallet(LIVE_WALLET_KEY!, provider);

    // Fetch current nonce
    let currentNonce = await provider.getTransactionCount(
      signer.address,
      "latest"
    );

    const router_contract = new ethers.Contract(
      process.env.ROUTER_ADDRESS!,
      router_ABI,
      signer
    );
    const asset_contract = new ethers.Contract(
      tradedContract,
      wpls_ABI,
      signer
    );

    const block: any = await provider.getBlock("latest");
    const deadline = block.timestamp + 1000;

    const TradedAsset_balance = await getBalance(tradedContract);
    const oldOtherAssetBalance = await getBalance(addresses.WPLS.TOKEN_ADDRESS);

    if (TradedAsset_balance.your_token_balance > 0) {
      console.log(`Trade ${TradedAsset_balance.token_symbol} to PLS`);

      const currentAllowance = await asset_contract.allowance(
        signer.address,
        process.env.ROUTER_ADDRESS
      );
      if (currentAllowance < TradedAsset_balance.your_token_balance) {
        const approveTx = await asset_contract.approve(
          process.env.ROUTER_ADDRESS,
          TradedAsset_balance.your_token_balance,
          { nonce: currentNonce } // Use nonce here
        );
        await approveTx.wait();
        currentNonce++; // Increment nonce after sending transaction
      }

      const tx = await router_contract.swapExactTokensForETH(
        TradedAsset_balance.your_token_balance,
        1,
        [tradedContract, addresses.WPLS.TOKEN_ADDRESS],
        signer.address,
        deadline,
        { nonce: currentNonce } // Use nonce here
      );
      await tx.wait();
      currentNonce++; // Increment nonce after sending transaction
    } else {
      const oldNativeBalance = await provider.getBalance(signer.address);
      const inputPLS = (oldNativeBalance / 100n) * 97n;

      const tx2 = await router_contract.swapExactETHForTokens(
        1,
        [addresses.WPLS.TOKEN_ADDRESS, tradedContract],
        signer.address,
        deadline,
        { value: inputPLS, nonce: currentNonce } // Use nonce here
      );
      await tx2.wait();
      currentNonce++; // Increment nonce after sending transaction
    }

    const newOtherAssetBalance = await getBalance(tradedContract);
    if (
      newOtherAssetBalance.your_token_balance !==
      oldOtherAssetBalance.your_token_balance
    ) {
      await sendMessage(`Success: The balance of the other asset has changed.`);
    } else {
      console.log("The balance of the other asset did not change.");
    }
  } catch (error) {
    console.error(`Error executing trade: ${error}`);
  }
};

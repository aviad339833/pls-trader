import { ethers } from "hardhat";
import { LIVE_RPC_URL, LIVE_WALLET_KEY } from "../config/config";

export const cancelAllPendingTransactions = async (gaAmplifier: number) => {
  console.log("Starting the cancellation process...");

  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const signer = new ethers.Wallet(LIVE_WALLET_KEY!, provider);

  // An array to hold your pending transaction hashes
  const pendingTransactionHashes = []; // Populate this array with your actual pending transaction hashes

  // Iterate through the list of pending transaction hashes
  for (const txHash of pendingTransactionHashes) {
    try {
      const tx = await provider.getTransaction(txHash);

      // Skip if the transaction is not pending
      if (!tx || tx.confirmations > 0) {
        continue;
      }

      // Compute the new gas price
      const gasPrice = ethers.BigNumber.from(tx.gasPrice);
      const increasedGasPrice = gasPrice.mul(
        ethers.BigNumber.from(gaAmplifier)
      );

      // Create a new transaction with a higher gas price to replace the pending one
      const txParams = {
        to: tx.to, // The destination address (can be the signer address if you're canceling)
        value: tx.value, // The amount of ether to send (0 if you're canceling)
        nonce: tx.nonce, // The nonce of the pending transaction
        gasPrice: increasedGasPrice.toString(), // The new, increased gas price
        gasLimit: tx.gasLimit, // The gas limit from the original transaction
      };

      console.log(`Sending replacement transaction for nonce ${tx.nonce}...`);
      const cancelTx = await signer.sendTransaction(txParams);
      console.log(`Replacement transaction sent. Hash: ${cancelTx.hash}`);
      await cancelTx.wait();
      console.log(
        `Transaction with nonce ${tx.nonce} has been successfully replaced.`
      );
    } catch (err) {
      console.error(
        `An error occurred while replacing transaction ${txHash}:`,
        err
      );
    }
  }

  console.log("Finished checking pending transactions.");
};

// You would call the function like this
// cancelAllPendingTransactions(2); // Assuming you want to double the gas price

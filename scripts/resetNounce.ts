import { ethers } from "hardhat";
import { LIVE_RPC_URL, LIVE_WALLET_KEY } from "../config/config";

export const cancelAllPendingTransactions = async () => {
  console.log("Starting the cancellation process...");

  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const signer = new ethers.Wallet(LIVE_WALLET_KEY!, provider);

  // Get the nonce of the last confirmed transaction
  const confirmedNonce = await provider.getTransactionCount(
    signer.address,
    "latest"
  );

  // Get the current nonce from the mempool
  const mempoolNonce = await provider.getTransactionCount(
    signer.address,
    "pending"
  );

  // Calculate the highest nonce in use (either confirmed or pending)
  const highestNonce = Math.max(confirmedNonce, mempoolNonce);

  console.log(`The highest nonce in use: ${highestNonce}`);

  // Get current block to fetch base fee
  const currentBlock = await provider.getBlock("latest");

  if (!currentBlock) {
    console.log("Could not fetch current block.");
    return;
  }

  const baseFeePerGas = currentBlock.baseFeePerGas;

  if (baseFeePerGas === null) {
    console.log("Base fee per gas is null.");
    return;
  }

  console.log(`Base fee per gas: ${baseFeePerGas}`);

  // Iterate through all pending transactions and cancel them
  for (let i = confirmedNonce; i <= highestNonce; i++) {
    // Compute the gas fee cap
    const gasFeeCap = BigInt(baseFeePerGas) * BigInt(3); // Adjust as needed

    // Create a replacement transaction with zero value and the same nonce
    const txParams = {
      to: signer.address,
      value: 0,
      nonce: i,
      gasPrice: gasFeeCap.toString(),
    };

    try {
      console.log(`Sending replacement transaction for nonce ${i}...`);
      const tx = await signer.sendTransaction(txParams);
      console.log(
        `Replacement transaction for nonce ${i} sent. Transaction hash:`,
        tx.hash
      );
      console.log(
        `Waiting for confirmation of replacement transaction for nonce ${i}...`
      );
      await tx.wait();
      console.log(
        `Transaction with nonce ${i} has been successfully cancelled.`
      );
    } catch (err) {
      console.log(
        `An error occurred while cancelling transaction with nonce ${i}:`,
        err
      );
    }
  }

  console.log("All pending transactions have been cancelled.");
};

import { ethers } from "hardhat";
import router_ABI from "../abis/router_ABI.json";
require("dotenv").config();

async function main() {
  // Simplified trade execution from PLS to DAI
  const tradeAmountPLS = "138.936"; // Amount of PLS you want to swap for DAI
  const walletPrivateKey = process.env.WALLET_PK_2!; // Your private key
  const RPC_URL = process.env.LIVE_RPC!; // Your RPC URL

  // Contract addresses for PulseChain mainnet (replace these with the actual addresses)
  const HTP_ADDRESS = "0x7c7ba94b60270bc2c7d98d3498b5ce85b870a749";
  const WPLS_ADDRESS = "0xa1077a294dde1b09bb078844df40758a5d0f9a27"; // Wrapped PLS address if needed
  const ROUTER_ADDRESS = "0x98bf93ebf5c380C0e6Ae8e192A7e2AE08edAcc02"; // Router contract address

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(walletPrivateKey, provider);
  const routerContract = new ethers.Contract(
    ROUTER_ADDRESS,
    router_ABI,
    signer
  );

  // Prepare the swap transaction
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current time
  const amountIn = ethers.parseEther(tradeAmountPLS); // Parse the trade amount to the correct format

  // Execute the swap from PLS to DAI
  try {
    console.log(
      `Executing swap from PLS to DAI for amount: ${tradeAmountPLS} PLS`
    );

    const tx = await routerContract.swapExactETHForTokens(
      0, // amountOutMin - set to 0 for simplicity, but consider using a real minimum to prevent slippage
      [WPLS_ADDRESS, HTP_ADDRESS], // Path from PLS to DAI
      signer.address, // Recipient of the DAI
      deadline, // Deadline for the swap
      { value: amountIn } // Amount of PLS to swap
    );

    console.log(`Swap initiated, transaction hash: ${tx.hash}`);
    await tx.wait(); // Wait for the transaction to be mined
    console.log(`Swap completed successfully`);
  } catch (error) {
    console.error(`Failed to execute swap:`, error);
  }
}

main().catch((error) => {
  console.error("Error in main execution:", error);
});

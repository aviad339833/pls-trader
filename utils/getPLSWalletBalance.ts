import { ethers } from "hardhat";
import { LIVE_RPC_URL, LIVE_WALLET_KEY } from "../config/config";

// Create a function to get the PLS wallet balance
export async function getPLSWalletBalance(): Promise<string> {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const signer = new ethers.Wallet(LIVE_WALLET_KEY!, provider);
  const balance_PLS = await provider.getBalance(signer.address);

  return balance_PLS.toString();
}

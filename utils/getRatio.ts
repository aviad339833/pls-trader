import { ethers } from "hardhat";
import { AMPLIFIER, LIVE_RPC_URL } from "../config/config";
import pair_ABI from "../abis/pair_ABI.json";

export const getRatio = async (
  pair_address: string,
  tokenAddress: string, // Token address for WPLS
  WALLET_PRIVATE_KEY: string
) => {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const signer = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);

  const pair_contract = new ethers.Contract(pair_address, pair_ABI, signer);

  try {
    const reserves = await pair_contract.getReserves();
    const token0 = await pair_contract.token0();

    // Determine if WPLS is token0 or token1
    const isToken0 = token0.toLowerCase() === tokenAddress.toLowerCase();

    // Calculate ratio to always represent 1 WPLS = X of the other token
    let ratio;
    ratio = isToken0
      ? (reserves[1] * AMPLIFIER) / reserves[0]
      : (reserves[0] * AMPLIFIER) / reserves[1];

    return ratio;
  } catch (err) {
    console.error("Error fetching ratio:", err);
  }
};

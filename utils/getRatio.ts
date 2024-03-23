import { ethers } from "hardhat";
import { AMPLIFIER, LIVE_RPC_URL } from "../config/config";
import pair_ABI from "../abis/pair_ABI.json";

export const getRatio = async (
  pair_address: string,
  WALLET_PRIVATE_KEY: string
) => {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const signer = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);

  const pair_contract = new ethers.Contract(pair_address, pair_ABI, signer);

  try {
    const reserves = await pair_contract.getReserves();
    let ratio: BigInt;

    ratio = (AMPLIFIER * reserves[1]) / reserves[0];

    return ratio;
  } catch (err) {
    console.error("Error fetching ratio:", err);
  }
};

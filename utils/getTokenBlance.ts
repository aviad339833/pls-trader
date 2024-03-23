import { ethers } from "hardhat";
import { LIVE_RPC_URL, addresses } from "../config/config";
import wpls_ABI from "../abis/wpls_ABI.json";

const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);

export async function getBalance(
  token_contract_address: string,
  WALLET_PRIVATE_KEY: string
) {
  const signer = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);

  const token_balance = new ethers.Contract(
    token_contract_address,
    wpls_ABI,
    signer
  );

  const your_token_balance = await token_balance.balanceOf(signer.address);
  const decimals = await token_balance.decimals();
  const token_symbol = await token_balance.symbol(); // Fetching the token symbol

  return { decimals, token_symbol, your_token_balance };
}

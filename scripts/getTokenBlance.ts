import { ethers } from "hardhat";
import { LIVE_RPC_URL, LIVE_WALLET_KEY } from "./config";
import wpls_ABI from "./wpls_ABI.json";

const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
const signer = new ethers.Wallet(LIVE_WALLET_KEY!, provider);

export async function getBalance(token_contract_address: string) {
  // Create a new contract instance with the provided token contract address
  const token_balance = new ethers.Contract(
    token_contract_address,
    wpls_ABI,
    signer
  );

  const your_token_balance = await token_balance.balanceOf(signer.address);
  const decimals = await token_balance.decimals();
  const token_symbol = await token_balance.symbol(); // Fetching the token symbol

  console.log(
    `Your ${token_symbol} token balance is: ${your_token_balance.toString()} (DECIMALS) ${decimals}`
  );

  return { decimals, token_symbol, your_token_balance };
}

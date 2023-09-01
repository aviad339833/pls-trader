import { ethers } from "hardhat";
import { LIVE_RPC_URL, addresses } from "../config/config";
import { getBalance } from "./getTokenBlance";
import { getPLSWalletBalance } from "./getPLSWalletBalance";

type TokenInfo = {
  TOKEN_ADDRESS: string;
  PAIR_ADDRESS: string;
};

type TokenAddresses = {
  [key: string]: TokenInfo;
};
export async function getAllBalances() {
  let balances: any = {};

  try {
    const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);

    const tokensToCheck: TokenAddresses = {
      DAI: addresses.DAI,
      HEX: addresses.HEX,
      PLSX: addresses.PLSX,
      WPLS: addresses.WPLS,
    };

    for (const tokenName in tokensToCheck) {
      if (Object.prototype.hasOwnProperty.call(tokensToCheck, tokenName)) {
        const { TOKEN_ADDRESS } = tokensToCheck[tokenName];
        const balance = await getBalance(TOKEN_ADDRESS);
        balances[tokenName] = balance.your_token_balance;
      }
    }

    const pls_balance = await getPLSWalletBalance();
    balances["PLS"] = pls_balance;
  } catch (error) {
    console.error("An error occurred:", error);
  }
  return balances;
}

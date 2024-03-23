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
    const pls_balance = await getPLSWalletBalance();
    balances["PLS"] = pls_balance;

    const tokensToCheck: TokenAddresses = {
      DAI: addresses.DAI,
      WPLS: addresses.WPLS,
      DWB: addresses.DWB,
    };

    for (const tokenName in tokensToCheck) {
      if (Object.prototype.hasOwnProperty.call(tokensToCheck, tokenName)) {
        const { TOKEN_ADDRESS } = tokensToCheck[tokenName];
        const balance = await getBalance(TOKEN_ADDRESS);
        balances[tokenName] = balance.your_token_balance;
      }
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
  return balances;
}

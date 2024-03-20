import { ethers } from "ethers";

import { LIVE_RPC_URL, LIVE_WALLET_KEY, addresses } from "../config/config";
import { getBalance } from "../utils/getTokenBlance";
import { executeTrade } from "../utils/takeAtrade";

require("dotenv").config();

type TokenInfo = {
  TOKEN_ADDRESS: string;
  PAIR_ADDRESS: string;
};

type TokenAddresses = {
  [key: string]: TokenInfo;
};

async function checkAndExecuteTrade(tokenName: string, tokenAddress: string) {
  const balance = await getBalance(tokenAddress);

  // console.log('balance',balance)
  if (balance.your_token_balance > 0) {
    const tradeResult = await executeTrade(tokenAddress);
    console.log(`${tokenName} Trade Result:`, tradeResult);
  } else {
    console.log(`${tokenName} Token balance is 0.`);
  }

  console.log(`${tokenName} Token balance:`, balance.your_token_balance);
}

async function convertAllToPls() {
  try {
    const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
    const signer = new ethers.Wallet(LIVE_WALLET_KEY!, provider);
    const balance_PLS = await provider.getBalance(signer.address);

    const tokensToCheck: TokenAddresses = {
      DAI: addresses.DAI,
      HEX: addresses.HEX,
      PLSX: addresses.PLSX,
      WPLS: addresses.WPLS,
    };

    for (const tokenName in tokensToCheck) {
      if (Object.prototype.hasOwnProperty.call(tokensToCheck, tokenName)) {
        const { TOKEN_ADDRESS } = tokensToCheck[tokenName];
        await checkAndExecuteTrade(tokenName, TOKEN_ADDRESS);
      }
    }

    console.log("PLS Token balance:", balance_PLS);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Poll every 5 seconds (customize this)
convertAllToPls();
// setInterval(convertAllToPls, 5000);

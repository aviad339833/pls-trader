import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import erc20Abi from "../abis/wpls_ABI.json";

dotenv.config();

interface TokenDetails {
  type: string;
  address?: string;
  decimals: number;
}

interface TokenConfig {
  [symbol: string]: TokenDetails;
}

interface WalletConfig {
  name: string;
  address: string;
}

// Read the JSON configuration for tokens and wallets
const config = JSON.parse(fs.readFileSync("config.json", "utf8")) as {
  tokens: TokenConfig;
  wallets: WalletConfig[];
};

// Function to fetch the token balance
async function getTokenBalance(
  provider: ethers.JsonRpcProvider,
  tokenAddress: string,
  walletAddress: string,
  decimals: number
): Promise<string> {
  if (tokenAddress === "native") {
    const balance = await provider.getBalance(walletAddress);
    return ethers.formatUnits(balance, decimals);
  } else {
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const balance = await tokenContract.balanceOf(walletAddress);
    return ethers.formatUnits(balance, decimals);
  }
}

async function fetchBalances(): Promise<void> {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER);

  for (const wallet of config.wallets) {
    // Outer loop over wallets
    console.log(`Balances for ${wallet.name} (${wallet.address}):`);

    for (const [tokenName, tokenInfo] of Object.entries(config.tokens)) {
      // Inner loop over tokens
      try {
        const tokenAddress: any =
          tokenInfo.type === "native" ? "native" : tokenInfo.address;
        const decimals = tokenInfo.type === "native" ? 18 : tokenInfo.decimals; // Using 18 for native asset
        const balance = await getTokenBalance(
          provider,
          tokenAddress,
          wallet.address,
          decimals
        );
        console.log(`${tokenName}: ${balance}`);
      } catch (error) {
        console.error(`Error fetching balance for ${tokenName}:`, error);
      }
    }

    console.log("---");
  }
}

// Run the function to fetch balances
fetchBalances().catch(console.error);

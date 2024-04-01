import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import erc20Abi from "../abis/wpls_ABI.json";
import { JsonRpcProvider } from "ethers";

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
const config = JSON.parse(
  fs.readFileSync("scriptsBot/config.json", "utf8")
) as {
  tokens: TokenConfig;
  wallets: WalletConfig[];
};

// Function to fetch the token balance
async function getTokenBalance(
  provider: JsonRpcProvider,
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

async function fetchBalances(provider: JsonRpcProvider): Promise<void> {
  for (const wallet of config.wallets) {
    console.log(`Balances for ${wallet.name} (${wallet.address}):`);

    for (const [tokenName, tokenInfo] of Object.entries(config.tokens)) {
      try {
        const tokenAddress =
          tokenInfo.type === "native" ? "native" : tokenInfo.address!;
        const decimals = tokenInfo.type === "native" ? 18 : tokenInfo.decimals;
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

async function main(): Promise<void> {
  const provider = new ethers.JsonRpcProvider(process.env.LIVE_RPC);

  // Fetch all balances first before starting the interval
  await fetchBalances(provider);

  // Set an interval to fetch balances every 20 seconds
  setInterval(async () => {
    console.clear();
    await fetchBalances(provider);
  }, 20000);
}

main().catch(console.error);

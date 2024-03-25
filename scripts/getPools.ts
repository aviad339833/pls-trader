require("dotenv").config();
import { ethers } from "ethers";
import poolABI from "../abis/9mm_v3_factory.json"; // Make sure this ABI includes the "PoolCreated" event
import minimalERC20ABI from "../abis/wpls_ABI.json"; // Minimal ABI to interact with ERC20 tokens
import { LIVE_RPC_URL } from "../config/config";

// Type definition for token details
interface TokenDetails {
  symbol: string | null;
  totalSupply: string;
}

// Ensure WPLS_ADDRESS is correctly set for the network you're monitoring
const WPLS_ADDRESS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27".toLowerCase();

const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);

// Function to fetch token symbol
async function getTokenSymbol(tokenAddress: string): Promise<string | null> {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    minimalERC20ABI,
    provider
  );
  try {
    const symbol = await tokenContract.symbol();
    return symbol;
  } catch (error) {
    console.error(`Error fetching symbol for token at ${tokenAddress}:`, error);
    return null;
  }
}

// Main function to listen for new pools
async function listenForNewPools() {
  const factoryAddress = process.env.LP_FACTORY_CONTRACT_ADDRESS!;
  const factoryContract = new ethers.Contract(
    factoryAddress,
    poolABI,
    provider
  );

  factoryContract.on(
    "PoolCreated",
    async (
      token0: string,
      token1: string,
      fee: number,
      tickSpacing: number,
      pool: string
    ) => {
      const symbolToken0 = await getTokenSymbol(token0);
      const symbolToken1 = await getTokenSymbol(token1);

      if (
        token0.toLowerCase() === WPLS_ADDRESS ||
        token1.toLowerCase() === WPLS_ADDRESS
      ) {
        console.log(`New WPLS Pool Created:`);
        console.log(`- Token 0 Address (${symbolToken0}): ${token0}`);
        console.log(`- Token 1 Address (${symbolToken1}): ${token1}`);
        console.log(`- Fee: ${fee}`);
        console.log(`- Tick Spacing: ${tickSpacing}`);
        console.log(`- Pool Address: ${pool}`);
        // Additional details from the event can be logged here if needed
      } else {
        // This pool does not involve WPLS, so we're not logging it.
      }
    }
  );

  console.log("Listening for new WPLS pools...");
}

listenForNewPools().catch(console.error);

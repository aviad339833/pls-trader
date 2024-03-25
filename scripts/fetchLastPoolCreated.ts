require("dotenv").config();
import { ethers } from "ethers";
import { LIVE_RPC_URL } from "../config/config";

// Assuming these ABI files are available and correct
import factoryABI from "../abis/9mm_v3_factory.json";
import minimalERC20ABI from "../abis/wpls_ABI.json";

// Factory contract address and WPLS address
const factoryContractAddress = process.env.LP_FACTORY_CONTRACT_ADDRESS!;
const WPLS_ADDRESS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27".toLowerCase();
const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);

async function getTokenSymbol(tokenAddress: string): Promise<string> {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    minimalERC20ABI,
    provider
  );
  try {
    return await tokenContract.symbol();
  } catch (error) {
    console.error(`Error fetching symbol for token at ${tokenAddress}:`, error);
    return "Unknown";
  }
}

async function findLast10PoolsWithWPLS() {
  const factoryContract = new ethers.Contract(
    factoryContractAddress,
    factoryABI,
    provider
  );
  const filter = factoryContract.filters.PoolCreated(
    null,
    null,
    null,
    null,
    null
  );
  const events = await factoryContract.queryFilter(filter, -10000);
  const wplsEvents = events.filter(
    (event) =>
      event.args.token0.toLowerCase() === WPLS_ADDRESS ||
      event.args.token1.toLowerCase() === WPLS_ADDRESS
  );

  // Get the last 10 events
  const last10WPLSEvents = wplsEvents.slice(-10);

  for (const event of last10WPLSEvents) {
    const token0Symbol = await getTokenSymbol(event.args.token0);
    const token1Symbol = await getTokenSymbol(event.args.token1);
    console.log(`Pool Created: ${event.args.pool}`);
    console.log(`- Token 0: ${token0Symbol} (${event.args.token0})`);
    console.log(`- Token 1: ${token1Symbol} (${event.args.token1})`);
    console.log(`- Fee: ${event.args.fee}`);
    console.log(`- Tick Spacing: ${event.args.tickSpacing}`);
    console.log("---");
  }
}

findLast10PoolsWithWPLS().catch(console.error);

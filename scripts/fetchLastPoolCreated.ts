require("dotenv").config();
import { ethers } from "ethers";
import factoryABI from "../abis/9mm_v3_factory.json"; // Ensure the path is correct
import erc20ABI from "../abis/wpls_ABI.json"; // Ensure the path is correct
import { LIVE_RPC_URL } from "../config/config";
import { getTimeElapsed } from "../scriptsBot/utils/utilsGeneral";

const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
const factoryAddress = process.env.LP_FACTORY_CONTRACT_ADDRESS!;

async function getTokenDetails(address) {
  const tokenContract = new ethers.Contract(address, erc20ABI, provider);
  const symbol = await tokenContract.symbol();
  const name = await tokenContract.name();
  const decimals = await tokenContract.decimals();
  return { symbol, name, decimals };
}

async function fetchAndLogLastPools() {
  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryABI,
    provider
  );
  const filter = factoryContract.filters.PoolCreated();
  const events = await factoryContract.queryFilter(filter, -10000);
  const uniquePools = new Set();
  let foundPools = 0;

  for (let i = events.length - 1; i >= 0 && foundPools < 10; i--) {
    const event = events[i];
    const poolAddress = event.args.pool;
    if (uniquePools.has(poolAddress)) continue; // Skip if already processed
    uniquePools.add(poolAddress);

    // Get block timestamp
    const block = await provider.getBlock(event.blockNumber);
    const timestamp = new Date(block.timestamp * 1000);
    const timeElapsed = getTimeElapsed(timestamp);

    // Get token details
    const token0Details = await getTokenDetails(event.args.token0);
    const token1Details = await getTokenDetails(event.args.token1);

    // Log pool information
    console.log(`POOL CREATED: ${poolAddress}`);
    console.log(`Creation Time: ${timestamp.toISOString()} (${timeElapsed})`);
    console.log(
      `Token0: ${event.args.token0} - ${token0Details.symbol} (${token0Details.name})`
    );
    console.log(
      `Token1: ${event.args.token1} - ${token1Details.symbol} (${token1Details.name})`
    );
    console.log(`Fee: ${event.args.fee}`);
    console.log("---");
    foundPools++;
  }

  if (foundPools === 0) {
    console.log("No new pools found among the last few events.");
  }
}

async function listenForNewPools() {
  await fetchAndLogLastPools(); // Initial fetch and log

  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryABI,
    provider
  );
  factoryContract.on(
    "PoolCreated",
    async (token0, token1, fee, tickSpacing, pool) => {
      const block = await provider.getBlock(event.blockNumber);
      const timestamp = new Date(block.timestamp * 1000);
      const timeElapsed = getTimeElapsed(timestamp);
      const token0Details = await getTokenDetails(token0);
      const token1Details = await getTokenDetails(token1);

      console.log(`New Pool Created: ${pool}`);
      console.log(`Creation Time: ${timestamp.toISOString()} (${timeElapsed})`);
      console.log(
        `Token0: ${token0} - ${token0Details.symbol} (${token0Details.name})`
      );
      console.log(
        `Token1: ${token1} - ${token1Details.symbol} (${token1Details.name})`
      );
      console.log(`Fee: ${fee}`);
      console.log("---");
    }
  );

  console.log("Listening for new pools...");
}

listenForNewPools().catch(console.error);

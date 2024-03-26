require("dotenv").config();
import { ethers } from "ethers";
import factoryABI from "../abis/9mm_v3_factory.json"; // Make sure the path is correct
import minimalERC20ABI from "../abis/wpls_ABI.json"; // Make sure the path is correct and ABI includes "name", "symbol", "decimals", and "totalSupply" methods
import { LIVE_RPC_URL, addresses } from "../config/config";
import { getRatio } from "./getRatio";
import {
  bigIntToDecimalString,
  checkLiquidity,
  estimateWPLSTrade,
} from "../utils/utils";
const WPLS_ADDRESS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27".toLowerCase();
const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
const factoryAddress = process.env.LP_FACTORY_CONTRACT_ADDRESS!;

async function getTokenDetails(tokenAddress: string): Promise<any> {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    minimalERC20ABI,
    provider
  );
  try {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.totalSupply(),
    ]);
    return {
      name,
      symbol,
      decimals: decimals.toString(),
      totalSupply: totalSupply.toString(),
    };
  } catch (error) {
    console.error(
      `Error fetching details for token at ${tokenAddress}:`,
      error
    );
    return null;
  }
}

async function fetchAndLogLastPoolsWithWPLS() {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL); // Move provider initialization here
  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryABI,
    provider
  );
  const filter = factoryContract.filters.PoolCreated();
  const events = await factoryContract.queryFilter(filter, -10000); // Fetch a larger number of events to ensure we capture enough pools
  const uniquePools = new Set();
  let foundPools = 0;

  for (let i = events.length - 1; i >= 0 && foundPools < 30; i--) {
    const event = events[i];
    const poolAddress = event.args.pool;
    if (uniquePools.has(poolAddress)) {
      continue; // Skip if we've already processed this pool
    }
    uniquePools.add(poolAddress);

    // Retrieve details for both tokens
    const token0Details = await getTokenDetails(event.args.token0);
    const token1Details = await getTokenDetails(event.args.token1);

    // Check if either token is WPLS by symbol
    let isWPLSPair =
      token0Details.symbol === "WPLS" || token1Details.symbol === "WPLS";
    let otherTokenDetails =
      token0Details.symbol === "WPLS" ? token1Details : token0Details;

    if (!isWPLSPair) {
      // If neither token is WPLS, skip this pool
      continue;
    }

    console.log(`Found WPLS pair: ${poolAddress}`);

    try {
      await checkLiquidity(WPLS_ADDRESS, otherTokenDetails.address);
      foundPools++;

      // Call getRatio for the current pool
      const ratio = await getRatio(poolAddress);
      console.log(`Ratio for pool ${poolAddress}: ${ratio}`);

      // Log pool information here
      console.log(`Pool Created: ${poolAddress}`);
      console.log(
        `- TOKEN: ${otherTokenDetails.symbol} (${otherTokenDetails.name})`
      );
      console.log(`- TOKEN ADDRESS: ${otherTokenDetails.address}`);
      console.log(`- Decimals: ${otherTokenDetails.decimals}`);
      console.log(
        `- Total Supply: ${bigIntToDecimalString(
          otherTokenDetails.totalSupply,
          otherTokenDetails.decimals
        ).toLocaleString()}`
      );
      console.log(`- Fee: ${event.args.fee}`);
      console.log(`- Tick Spacing: ${event.args.tickSpacing}`);

      // Fetch timestamp for the block in which the event occurred
      const block: any = await provider.getBlock(event.blockNumber);
      const timestamp = block.timestamp;

      console.log(`- Pool created at: ${new Date(timestamp * 1000)}`);

      // Calculate the number of days ago the pool was created
      const currentDate = new Date();
      const daysAgo = Math.floor(
        (currentDate.getTime() - timestamp * 1000) / (1000 * 3600 * 24)
      );
      console.log(`- Pool created ${daysAgo} days ago`);

      const estimatedTradeAmount = await estimateWPLSTrade(
        otherTokenDetails.address
      );

      if (estimatedTradeAmount) {
        console.log(
          `- 1 WPLS can buy approximately ${ethers.formatUnits(
            estimatedTradeAmount,
            otherTokenDetails.decimals
          )} of ${otherTokenDetails.symbol}`
        );
      } else {
        console.log("- Unable to estimate trade amount.");
      }
      console.log("---");
    } catch (error) {
      console.error(
        `Swap failed. Insufficient liquidity in the pool for ${otherTokenDetails.symbol}.`
      );
    }
  }

  if (foundPools === 0) {
    console.log("No new pools found in the last 30 pools created.");
  }
}

async function listenForNewPools() {
  await fetchAndLogLastPoolsWithWPLS(); // Initial fetch and log

  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryABI,
    provider
  );
  factoryContract.on(
    "PoolCreated",
    async (token0, token1, fee, tickSpacing, pool) => {
      const otherTokenAddress =
        token0.toLowerCase() === WPLS_ADDRESS ? token1 : token0;
      if (otherTokenAddress.toLowerCase() !== WPLS_ADDRESS) {
        // Ensure we're not handling WPLS itself
        const otherTokenDetails = await getTokenDetails(otherTokenAddress);
        console.log(`New WPLS Pool Created: ${pool}`);
        console.log(
          `- Other Token: ${otherTokenDetails.symbol} (${otherTokenDetails.name})`
        );
        console.log(`- Decimals: ${otherTokenDetails.decimals}`);
        console.log(
          `- Total Supply: ${bigIntToDecimalString(
            otherTokenDetails.totalSupply,
            otherTokenDetails.decimals
          ).toLocaleString()}`
        );
        console.log(`- Fee: ${fee}`);
        console.log("---");
      }
    }
  );

  console.log("Listening for new WPLS pools...");
}

listenForNewPools().catch(console.error);

require("dotenv").config();
import { ethers } from "ethers";
import factoryABI from "../abis/9mm_v3_factory.json"; // Make sure the path is correct

import { LIVE_RPC_URL, addresses } from "../config/config";
import { getRatio } from "./getRatio";
import {
  bigIntToDecimalString,
  checkLiquidity,
  estimateWPLSTrade,
  getTokenDetails,
  logTokenDetails,
} from "../utils/utils";
import {
  LpTestResult,
  logSuccessfulLpTest,
} from "../utils/logSuccessfulLpTest";
const WPLS_ADDRESS = addresses.WPLS.TOKEN_ADDRESS.toLowerCase();
const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
const factoryAddress = process.env.LP_FACTORY_CONTRACT_ADDRESS!;

async function fetchAndLogLastPoolsWithWPLS(plsPrice: number) {
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
    const event = events[i].args;
    const poolAddress = event.pool;
    if (uniquePools.has(poolAddress)) {
      continue; // Skip if we've already processed this pool
    }
    uniquePools.add(poolAddress);

    const token0 = await getTokenDetails(event.token0, provider);
    const token1 = await getTokenDetails(event.token1, provider);
    // const otherTokenDetails = await getTokenDetails(otherTokenAddress);
    logTokenDetails(token0, token1);
    try {
      await checkLiquidity(event.token1, event.token0);
      foundPools++;

      const result: LpTestResult = {
        timestamp: new Date(),
        tokenPair: `${token0.symbol}/${token1.symbol}`, // Or any format you prefer
        transactionHash: "N/A", // Since this is historical data, might not have a direct transaction hash
        details: {
          poolAddress,
          liquidityCheck: "Success",
          // Add any other details relevant to your application
        },
      };
      await logSuccessfulLpTest(result);
      // Log pool information here
      console.log(`\n\n POOL CREATED: ${poolAddress}`);

      console.log(`\n\n\n`);
    } catch (error) {
      console.error(
        `Swap failed. Insufficient liquidity in the pool for ${token0.symbol}/${token1.symbol}. \n POOL ADDRESS: ${poolAddress} \n`
      );
    }
  }

  if (foundPools === 0) {
    console.log("No new pools found in the last 30 pools created.");
  }
}

async function listenForNewPools() {
  const plsPrice = await getRatio(addresses.WPLS.PAIR_ADDRESS);
  await fetchAndLogLastPoolsWithWPLS(plsPrice); // Initial fetch and log

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
        const otherTokenDetails = await getTokenDetails(
          otherTokenAddress,
          provider
        );
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

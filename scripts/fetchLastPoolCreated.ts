require("dotenv").config();
import { ethers } from "ethers";
import factoryABI from "../abis/9mm_v3_factory.json"; // Make sure the path is correct

import { LIVE_RPC_URL, addresses } from "../config/config";
import { getRatio } from "./getRatio";
import {
  bigIntToDecimalString,
  checkLiquidity,
  getTokenDetails,
} from "../utils/utils";
import {
  LpTestResult,
  logSuccessfulLpTest,
} from "../utils/logSuccessfulLpTest";
import { getPairRatiov2 } from "./getPairRatioV2";
const WPLS_ADDRESS = addresses.WPLS.TOKEN_ADDRESS.toLowerCase();
const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
const factoryAddress = process.env.LP_FACTORY_CONTRACT_ADDRESS!;

async function fetchAndLogLastPoolsWithWPLS(plsPrice) {
  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryABI,
    provider
  );
  const filter = factoryContract.filters.PoolCreated();
  const events = await factoryContract.queryFilter(filter, -10000);
  const uniquePools = new Set();
  let foundPools = 0;

  for (let i = events.length - 1; i >= 0 && foundPools < 30; i--) {
    const event = events[i].args;
    const poolAddress = event.pool;
    if (uniquePools.has(poolAddress)) {
      continue; // Skip if already processed
    }
    uniquePools.add(poolAddress);
    const token0 = await getTokenDetails(event.token0, provider);
    const token1 = await getTokenDetails(event.token1, provider);

    // First, perform the liquidity check
    try {
      await checkLiquidity(event.token1, event.token0);
      foundPools++;

      // Since liquidity check passed, now fetch the ratio
      const ratioResult = await getRatio(poolAddress, token0, token1);
      console.log(`POOL CREATED: ${poolAddress}`);
      if (ratioResult.errorMessage) {
        console.error(`Unable to fetch ratio: ${ratioResult.errorMessage}`);
      } else {
        console.log(
          `Ratio: 1 ${ratioResult.token0Symbol} = ${ratioResult.ratio} ${ratioResult.token1Symbol}`
        );
      }

      // Logging successful LP test result
      const result: LpTestResult = {
        timestamp: new Date(),
        tokenPair: `${token0.symbol}/${token1.symbol}`,
        transactionHash: "N/A", // Use actual transaction hash if available
        details: {
          poolAddress,
          liquidityCheck: "Success",
          // Include the ratio in your logged details if needed
          ratio: ratioResult.errorMessage
            ? "Error fetching ratio"
            : `1 ${ratioResult.token0Symbol} = ${ratioResult.ratio} ${ratioResult.token1Symbol}`,
        },
      };
      await logSuccessfulLpTest(result);
    } catch (error) {
      console.error(
        `Error processing pool ${poolAddress} for ${token0.symbol}/${token1.symbol}: ${error}`
      );
    }
  }

  if (foundPools === 0) {
    console.log("No new pools found in the last 30 pools created.");
  }
}

async function listenForNewPools() {
  const plsPrice = await getPairRatiov2(addresses.WPLS);
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

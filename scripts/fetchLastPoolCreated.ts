require("dotenv").config();
import { ethers } from "ethers";
import factoryABI from "../abis/9mm_v3_factory.json"; // Make sure the path is correct
import minimalERC20ABI from "../abis/wpls_ABI.json"; // Make sure the path is correct and ABI includes "name", "symbol", "decimals", and "totalSupply" methods
import { LIVE_RPC_URL, addresses } from "../config/config";
import { getRatio } from "../utils/getRatio";
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
  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryABI,
    provider
  );
  const filter = factoryContract.filters.PoolCreated();
  const events = await factoryContract.queryFilter(filter, -10000);
  let index = events.length - 1;
  let foundPoolWithLiquidity = false;

  while (index >= 0 && !foundPoolWithLiquidity) {
    const event = events[index];
    const otherTokenAddress =
      event.args.token0.toLowerCase() === WPLS_ADDRESS
        ? event.args.token1
        : event.args.token0;
    const otherTokenDetails = await getTokenDetails(otherTokenAddress);

    // Log pool information here
    console.log(`Pool Created: ${event.args.pool}`);
    console.log(
      `- Other Token: ${otherTokenDetails.symbol} (${otherTokenDetails.name})`
    );
    console.log(`- TOKEN ADDRESS: ${otherTokenAddress}`);
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
    const block = await provider.getBlock(event.blockNumber);
    const timestamp = block.timestamp;

    console.log(`- Pool created at: ${new Date(timestamp * 1000)}`);

    // Calculate the number of days ago the pool was created
    const currentDate = new Date();
    const daysAgo = Math.floor(
      (currentDate.getTime() - timestamp * 1000) / (1000 * 3600 * 24)
    );
    console.log(`- Pool created ${daysAgo} days ago`);

    try {
      await checkLiquidity(WPLS_ADDRESS, otherTokenAddress);
      foundPoolWithLiquidity = true;
    } catch (error) {
      console.error(
        `Skipping pool ${event.args.pool} due to insufficient liquidity`
      );
      index--; // Move to the previous event
      continue;
    }

    const estimatedTradeAmount = await estimateWPLSTrade(otherTokenAddress);

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

    index--; // Move to the previous event
  }

  if (!foundPoolWithLiquidity) {
    console.log("No pool with liquidity found.");
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

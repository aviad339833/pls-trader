require("dotenv").config();
import { ethers } from "ethers";
import factoryABI from "../abis/9mm_v3_factory.json"; // Make sure the path is correct
import minimalERC20ABI from "../abis/wpls_ABI.json"; // Make sure the path is correct and ABI includes "name", "symbol", "decimals", and "totalSupply" methods
import { LIVE_RPC_URL, addresses } from "../config/config";
import { getRatio } from "../utils/getRatio";

const WPLS_ADDRESS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27".toLowerCase();
const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
const factoryAddress = process.env.LP_FACTORY_CONTRACT_ADDRESS!;

async function fetchWPLSPrice(): Promise<number> {
    // Fetch the WPLS/USD price
    console.log("getRatio(addresses.WPLS.PAIR_ADDRESS);,",getRatio(addresses.WPLS.PAIR_ADDRESS);)
  return getRatio(addresses.WPLS.PAIR_ADDRESS);
}

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
    return { name, symbol, decimals, totalSupply: totalSupply.toString() };
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
  const filter = factoryContract.filters.PoolCreated(
    null,
    null,
    null,
    null,
    null
  );
  const events = await factoryContract.queryFilter(filter, -10000);
  // Filter for events involving WPLS and take the last 10
  const wplsEvents = events
    .filter(
      (event) =>
        event.args.token0.toLowerCase() === WPLS_ADDRESS ||
        event.args.token1.toLowerCase() === WPLS_ADDRESS
    )
    .slice(-10);

  for (const event of wplsEvents) {
    const wplsPriceUSD = await fetchWPLSPrice();
    const otherTokenAddress =
      event.args.token0.toLowerCase() === WPLS_ADDRESS
        ? event.args.token1
        : event.args.token0;
    const otherTokenDetails = await getTokenDetails(otherTokenAddress);
    console.log(`Pool Created: ${event.args.pool}`);
    console.log(
      `- Other Token: ${otherTokenDetails.symbol} (${otherTokenDetails.name})`
    );
    console.log(`- TOKEN ADDRESS: ${otherTokenAddress} `);
    console.log(`- Decimals: ${otherTokenDetails.decimals}`);
    console.log(`- Total Supply: ${otherTokenDetails.totalSupply}`);
    console.log(`- Fee: ${event.args.fee}`);
    console.log(`- Tick Spacing: ${event.args.tickSpacing}`);
    console.log(`- WPLS price: ${wplsPriceUSD}`);
    console.log("---");
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
        console.log(`- Total Supply: ${otherTokenDetails.totalSupply}`);
        console.log(`- Fee: ${fee}`);
        console.log("---");
      }
    }
  );

  console.log("Listening for new WPLS pools...");
}

listenForNewPools().catch(console.error);

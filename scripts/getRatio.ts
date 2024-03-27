import { ethers } from "ethers";
import { LIVE_RPC_URL } from "../config/config";
// Import the Uniswap V3 Pool ABI from the installed package
const {
  abi: v3PoolABI,
} = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");

export const getRatio = async (pool_address: string): Promise<number> => {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const pool_contract = new ethers.Contract(pool_address, v3PoolABI, provider);

  try {
    const slot0 = await pool_contract.slot0();
    const sqrtPriceX96 = slot0.sqrtPriceX96;
    // Convert to bigint if necessary
    const sqrtPriceX96AsBigInt = BigInt(sqrtPriceX96.toString());
    const price = sqrtPriceX96AsBigInt ** 2n / 2n ** 192n; // Price of token1 in terms of token0

    // Convert bigint result back to a number for easier handling/display
    const priceNumber = Number(price) / 2 ** 96; // Divide by 2 ** 96 to adjust for precision

    console.log("The price of token1 in terms of token0 is:", priceNumber);

    // If you need the price of token0 in terms of token1, take the reciprocal
    const priceOfToken0 = 1 / priceNumber;
    console.log("The price of token0 in terms of token1 is:", priceOfToken0);

    return priceOfToken0; // or priceNumber, depending on which direction you need
  } catch (error) {
    console.error("Error fetching price:", error);
    return 0; // Handle the error appropriately
  }
};

// Example usage
getRatio("0xaD0F9ea50903e3992FC74E33a0d5471aDe15F14e").then((price) => {
  console.log(price);
});

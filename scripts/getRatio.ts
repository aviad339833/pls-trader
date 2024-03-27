import { ethers } from "ethers";
import { LIVE_RPC_URL } from "../config/config";
const v3PoolABI =
  require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json").abi;

export const getRatio = async (
  pool_address: string,
  token0: any,
  token1: any
) => {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const pool_contract = new ethers.Contract(pool_address, v3PoolABI, provider);

  console.log(`Fetching price ratio for pool: ${pool_address}`);
  console.log(
    `Token0 (${token0.symbol}) Address: ${token0.tokenAddress} with ${token0.decimals} decimals`
  );
  console.log(
    `Token1 (${token1.symbol}) Address: ${token1.tokenAddress} with ${token1.decimals} decimals`
  );

  try {
    const slot0 = await pool_contract.slot0();
    const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96.toString());
    console.log(`sqrtPriceX96: ${sqrtPriceX96.toString()}`);

    // Calculate price of token0 in terms of token1
    const rawPrice = sqrtPriceX96 ** 2n;
    const priceOfToken0InTermsOfToken1 = BigInt(2) ** (96n * 2n) / rawPrice;
    console.log(
      `Raw price (token0 per token1) before adjustments: ${priceOfToken0InTermsOfToken1.toString()}`
    );

    // Adjust for token decimals
    const adjustedPriceForTokenDecimals =
      (priceOfToken0InTermsOfToken1 * BigInt(10) ** BigInt(token1.decimals)) /
      BigInt(10) ** BigInt(token0.decimals);
    console.log(
      `Adjusted price for decimals: ${adjustedPriceForTokenDecimals.toString()}`
    );

    // Convert to a readable number format
    const readablePrice =
      Number(adjustedPriceForTokenDecimals) / 10 ** token1.decimals;
    console.log(
      `Readable price: 1 ${token0.symbol} = ${readablePrice} ${token1.symbol}`
    );

    return {
      ratio: readablePrice > 0 ? readablePrice : "Error: Price too low",
      token0Symbol: token0.symbol,
      token1Symbol: token1.symbol,
    };
  } catch (error) {
    console.error("Error fetching price with v3PoolABI:", error);
    return {
      ratio: "Error",
      token0Symbol: token0.symbol,
      token1Symbol: token1.symbol,
      errorMessage: "Error fetching price",
    };
  }
};

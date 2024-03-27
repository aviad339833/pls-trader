// Type definition for the function's parameter to ensure proper usage
require("dotenv").config();
import { ethers } from "ethers";
import { LIVE_RPC_URL, addresses } from "../config/config";
import pairABI from "../abis/pair_ABI.json";

interface PairAddressConfig {
  PAIR_ADDRESS: string;
  TOKEN_NAME: string;
}

export const getPairRatiov2 = async (config: PairAddressConfig) => {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const pairContract = new ethers.Contract(
    config.PAIR_ADDRESS,
    pairABI,
    provider
  );

  try {
    const [reserve0, reserve1] = await pairContract.getReserves();
    // Use BigInt for precise arithmetic, assuming 18 decimals for both tokens
    const balanceDivider = BigInt(10) ** BigInt(18); // Equivalent to 1e18

    const bigReserve0 = BigInt(reserve0.toString());
    const bigReserve1 = BigInt(reserve1.toString());

    // Calculate the ratio using BigInt to avoid precision loss
    // Corrected final conversion for readability
    const ratio = (bigReserve1 * balanceDivider) / bigReserve0; // Keeps calculation in BigInt

    // Convert to a floating-point number correctly considering the 18 decimal places
    const readableRatio = Number(ratio) / 10 ** 18; // Correctly scale down the ratio for readability

    console.log(
      `Ratio: 1 ${config.TOKEN_NAME} = ${readableRatio} of the counterpart token (Adjusted for 18 decimals)`
    );

    return Number(ratio) / Number(balanceDivider); // Convert back to a floating-point number for readability, if necessary
  } catch (error) {
    console.error(
      "Error fetching pair ratio for",
      config.TOKEN_NAME,
      ":",
      error
    );
    throw error; // Re-throw the error to handle it in the calling context
  }
};

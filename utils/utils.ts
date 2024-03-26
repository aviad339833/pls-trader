import { LIVE_RPC_URL, addresses } from "../config/config";
import { getRatio } from "../scripts/getRatio";
import router_ABI from "../abis/router_ABI.json";
import { ethers } from "ethers";

export const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS!;

export const bigIntToDecimalString = (
  rawBigInt: BigInt | undefined,
  decimals: number
): number => {
  if (typeof rawBigInt === "undefined") {
    return 0;
  }

  const fullStr = rawBigInt.toString().padStart(decimals + 1, "0");
  const intPart = fullStr.slice(0, -decimals) || "0";
  const fractPart = fullStr.slice(-decimals).padEnd(decimals, "0");

  // console.log("fullStr", Number(intPart + "." + fractPart));
  return Number(intPart + "." + fractPart);
};

// Helper function to create a delay
export function delay(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to attempt fetching the ratio with retries and exponential backoff
export async function fetchRatioWithRetry(
  pair_address: string,
  retries = 5,
  backoff = 1000
) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const ratio = await getRatio(pair_address);
      if (ratio > 0) {
        // Check for a valid ratio
        return ratio;
      }
    } catch (error) {
      console.error(
        `Retry attempt ${attempt + 1} for pair address ${pair_address} failed:`,
        error
      );
    }
    await delay(backoff * 2 ** attempt);
    attempt++;
  }
  throw new Error(`Failed to fetch ratio after ${retries} attempts`);
}

export async function estimateWPLSTrade(
  toTokenAddress: string,
  amountIn: string = "1"
) {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL); // Initialize provider
  const signer = new ethers.Wallet(process.env.LIVE_WALLET_KEY!, provider); // Initialize wallet
  const routerContract = new ethers.Contract(
    ROUTER_ADDRESS,
    router_ABI,
    signer
  ); // Initialize router contract

  const WPLSAddress = addresses.WPLS.TOKEN_ADDRESS; // Replace with actual WPLS contract address
  const oneWPLSToWei = ethers.parseUnits(amountIn, 18); // Convert 1 WPLS to Wei

  try {
    // Check liquidity before estimating the trade
    await checkLiquidity(WPLSAddress, toTokenAddress);

    // If liquidity check passes, proceed to estimate the trade
    const amountsOut = await routerContract.getAmountsOut(oneWPLSToWei, [
      WPLSAddress,
      toTokenAddress,
    ]);
    return amountsOut[1]; // Return the amount of the target token you'd get for the input WPLS
  } catch (error) {
    console.error("Error estimating WPLS trade:", error);
    throw error; // Rethrow the error or handle it as needed
  }
}

export async function estimateGasCost(
  contract: ethers.Contract,
  methodName: string,
  args: any[]
): Promise<number> {
  // Ensure that the methodName exists on the contract
  const method = contract[methodName as keyof typeof contract];
  if (!method) {
    throw new Error(`Method ${methodName} does not exist on the contract`);
  }

  try {
    // Estimate gas cost for the transaction
    const estimatedGas = await method.estimateGas(...args);
    // Return the estimated gas cost as a number
    return estimatedGas.toNumber();
  } catch (error) {
    // Handle the case where gas estimation fails
    console.error(`Gas estimation failed for ${methodName}:`);
    // Return a default gas estimation value (e.g., 1 million gas)
    return 1000000; // Adjust this value as needed based on your requirements
  }
}

export async function checkLiquidity(
  WPLSAddress: string,
  otherTokenAddress: string
) {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL); // Initialize provider
  const signer = new ethers.Wallet(process.env.LIVE_WALLET_KEY!, provider); // Initialize wallet
  const routerContract = new ethers.Contract(
    ROUTER_ADDRESS,
    router_ABI,
    signer
  ); // Initialize router contract

  const amountIn = ethers.parseUnits("0.01", 18); // Small amount for testing liquidity

  try {
    // Estimate gas cost for the swap transaction
    const gasCost = await estimateGasCost(
      routerContract,
      "swapExactTokensForTokens",
      [
        amountIn,
        0, // set minimum amount out as needed
        [WPLSAddress, otherTokenAddress],
        signer.address,
        Date.now() + 1000 * 60 * 10, // deadline in 10 minutes
      ]
    );

    console.log("Estimated gas cost for swap transaction:", gasCost);

    // Attempt a swap from WPLS to the other token with a small amount to check liquidity
    const tx = await routerContract.swapExactTokensForTokens(
      amountIn,
      0, // set minimum amount out as needed
      [WPLSAddress, otherTokenAddress],
      signer.address,
      Date.now() + 1000 * 60 * 10 // deadline in 10 minutes
    );

    console.log("Swap successful. Liquidity exists in the pool for WPLS.");
  } catch (error) {
    console.error("Swap failed. Insufficient liquidity in the pool for WPLS.");
    throw new Error("Insufficient liquidity");
  }
}

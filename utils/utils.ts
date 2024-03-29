import { LIVE_RPC_URL, addresses } from "../config/config";
import { getRatio } from "../scripts/getRatio";
import router_ABI from "../abis/router_ABI.json";
import { ethers } from "ethers";
import minimalERC20ABI from "../abis/wpls_ABI.json";

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

export async function checkLiquidity(token0: string, token1: string) {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL); // Initialize provider
  const signer = new ethers.Wallet(process.env.LIVE_WALLET_KEY!, provider); // Initialize wallet
  const routerContract = new ethers.Contract(
    ROUTER_ADDRESS,
    router_ABI,
    signer
  ); // Initialize router contract

  const amountIn = ethers.parseUnits("0.01", 18); // Small amount for testing liquidity

  try {
    // Attempt a swap from WPLS to the other token with a small amount to check liquidity
    const tx = await routerContract.swapExactTokensForTokens(
      amountIn,
      0, // set minimum amount out as needed
      [token0, token1],
      signer.address,
      Date.now() + 1000 * 60 * 10 // deadline in 10 minutes
    );

    console.log("Swap successful. Liquidity exists in the pool for WPLS.");
  } catch (error) {
    throw new Error("Insufficient liquidity");
  }
}

export function logTokenDetails(token0: any, token1: any) {
  const plsTokenAddress = addresses.WPLS.TOKEN_ADDRESS.toLocaleLowerCase();

  // Convert big integer to decimal string, considering decimals
  const formatSupply = (token: any) =>
    Number(bigIntToDecimalString(token.totalSupply, token.decimals));

  const totalSupply0 = formatSupply(token0);
  const totalSupply1 = formatSupply(token1);

  // Determine which token is WPLS, if any
  const isToken0WPLS = token0.tokenAddress.toLowerCase() === plsTokenAddress;
  const isToken1WPLS = token1.tokenAddress.toLowerCase() === plsTokenAddress;

  let ratio;
  if (isToken0WPLS) {
    // If token0 is WPLS, calculate how much of token1 one WPLS can buy
    ratio = totalSupply1 / totalSupply0;
    console.log(`1 ${token0.symbol} can buy ${ratio} ${token1.symbol}`);
  } else if (isToken1WPLS) {
    // If token1 is WPLS, calculate how much of token0 one WPLS can buy
    ratio = totalSupply0 / totalSupply1;
    console.log(`1 ${token1.symbol} can buy ${ratio} ${token0.symbol}`);
  } else {
    // If neither token is WPLS, just compare their supplies
    ratio = totalSupply1 / totalSupply0;
    console.log(`1 ${token0.symbol} can buy ${ratio} ${token1.symbol}`);
  }

  console.log(
    `TOKEN PAIR: ${token0.symbol} (${token0.decimals}) / ${token1.symbol} (${token1.decimals})`
  );
  console.log(
    `Supply: ${totalSupply0.toLocaleString()} / ${totalSupply1.toLocaleString()}`
  );
  console.log(`RATIO: ${ratio}`);
  console.log(`TOKEN ADDRESS (${token0.symbol}): ${token0.tokenAddress}`);
  console.log(`TOKEN ADDRESS (${token1.symbol}): ${token1.tokenAddress}`);
}

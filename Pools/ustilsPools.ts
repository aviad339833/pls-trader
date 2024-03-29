import { ethers } from "hardhat";
import { LIVE_RPC_URL, addresses } from "../config/config";
const v3PoolABI =
  require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json").abi;

import wpls_ABI from "../abis/wpls_ABI.json";
import { getRatio } from "../scripts/getRatio";

export async function checkOwnership(tokenAddresses) {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const signer = new ethers.Wallet(process.env.LIVE_WALLET_KEY!, provider);

  for (const address of tokenAddresses) {
    const tokenContract = new ethers.Contract(address, wpls_ABI, provider);
    const decimals = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(signer.address);
    const wplsPriceInUSD = (await getPairRatiov2(addresses.WPLS)).toString(); // Ensure it's a string

    if (balance.isZero()) {
      console.log(
        `The wallet does not own any amount of token at address ${address}`
      );
    } else {
      const tokenPriceInWPLS = (
        await getTokenPriceInWPLS(address, address)
      ).toString(); // Ensure it's a string
      const balanceInWPLS = balance
        .div(ethers.parseUnits("1", decimals))
        .mul(ethers.parseUnits(tokenPriceInWPLS, decimals));
      const balanceInUSD = balanceInWPLS.mul(
        ethers.parseUnits(wplsPriceInUSD, decimals)
      );

      console.log(
        `The wallet owns ${ethers.formatUnits(
          balance,
          decimals
        )} of token at address ${address}`
      );
      console.log(
        `Which is approximately ${ethers.formatUnits(
          balanceInWPLS,
          decimals
        )} WPLS`
      );
      console.log(
        `And approximately ${ethers.formatUnits(balanceInUSD, decimals)} USD`
      );
    }
  }
}

export async function getTokenPriceInWPLS(token0, token1) {
  const wplsAddress = addresses.WPLS.TOKEN_ADDRESS.toLowerCase(); // Ensure WPLS address is lowercase for comparison
  const poolAddress = "0x3584aE4d7046c160bA9c64bB53951285c4B2abfd"; // The Uniswap V3 pool address for WPLS and the other token
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const poolContract = new ethers.Contract(poolAddress, v3PoolABI, provider);

  // Fetch the pool state
  const slot0 = await poolContract.slot0();

  // Convert the sqrtPriceX96 to a price in token0 per token1 format
  const sqrtPriceX96 = slot0.sqrtPriceX96.toString();
  const price = Math.pow(sqrtPriceX96 / Math.pow(2, 96), 2);

  // Check which token is WPLS and calculate the price accordingly
  const token0IsWPLS = token0.toLowerCase() === wplsAddress;
  const wplsPriceInTermsOfOtherToken = token0IsWPLS ? price : 1 / price;

  // Normalize the price to 1 WPLS
  const normalizedPrice = token0IsWPLS
    ? ethers.parseUnits(
        wplsPriceInTermsOfOtherToken.toString(),
        18 - (await poolContract.decimals(token0))
      )
    : ethers.parseUnits(
        (1 / wplsPriceInTermsOfOtherToken).toString(),
        18 - (await poolContract.decimals(token1))
      );

  return normalizedPrice;
}

export async function executeTrade(
  signer,
  fromTokenAddress,
  toTokenAddress,
  amountToBuy
) {
  const routerAddress = process.env.ROUTER_ADDRESS;
  const routerContract = new ethers.Contract(routerAddress, router_ABI, signer);

  // Check and approve token for trading if necessary
  await checkAndApproveToken(
    signer,
    fromTokenAddress,
    routerAddress,
    amountToBuy
  );

  // Additional logic to get the current price and calculate the amount of `fromToken` needed

  // Now perform the trade
  const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from the current time
  const tx = await routerContract
    .swapExactTokensForTokens
    // amountIn, amountOutMin, path, to, deadline
    // You need to set 'amountIn' according to how much you need to trade for 'amountToBuy'
    // 'amountOutMin' can be set based on slippage tolerance
    ();

  await tx.wait();
  console.log("Trade executed successfully.");
}

export async function provideLiquidity(
  signer,
  tokenAAddress,
  tokenBAddress,
  lowerTick,
  upperTick
) {
  // This would use the Uniswap V3 Pool ABI and methods
  const poolContract = new ethers.Contract(poolAddress, v3PoolABI, signer);

  // Calculate the corresponding amounts for the provided ticks
  // For Uniswap V3, the amount of liquidity you can add is dependent on the tick range and current price

  const liquidityParams = {
    // tokenA, tokenB, fee, recipient, deadline, amountA, amountB, lowerTick, upperTick
    // The amounts and ticks have to be calculated based on the current state of the pool and your desired range
  };

  const tx = await poolContract.mint(liquidityParams);
  await tx.wait();
  console.log("Liquidity provided successfully.");
}

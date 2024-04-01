require("dotenv").config();
import { ethers } from "hardhat";
import poolABI from "../abis/9mm_v2_factory.json";
import pairABI from "../abis/pair_ABI.json";
import minimalERC20ABI from "../abis/wpls_ABI.json";
import { LIVE_RPC_URL, addresses } from "../config/config";
import { bigIntToDecimalString } from "./utils/bigIntToDecimalString";

const WPLS_TOKEN_ADDRESS = addresses.WPLS.TOKEN_ADDRESS.toLowerCase();

export const logListOfPoolsV2 = async () => {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const poolFactoryContractAddress = process.env.POOL_FACTORY_CONTRACT_ADDRESS!;
  const poolFactoryContract = new ethers.Contract(
    poolFactoryContractAddress,
    poolABI,
    provider
  );

  const totalPairs = await poolFactoryContract.allPairsLength();
  console.log(`Total Pairs: ${totalPairs}`);

  for (let i = 0; i < totalPairs; i++) {
    const pairAddress = await poolFactoryContract.allPairs(i);
    const pairContract = new ethers.Contract(pairAddress, pairABI, provider);

    const [token0Address, token1Address] = await Promise.all([
      pairContract.token0(),
      pairContract.token1(),
    ]);

    let WPLSAddress, otherTokenAddress;
    if (token0Address.toLowerCase() === WPLS_TOKEN_ADDRESS) {
      WPLSAddress = token0Address;
      otherTokenAddress = token1Address;
    } else if (token1Address.toLowerCase() === WPLS_TOKEN_ADDRESS) {
      WPLSAddress = token1Address;
      otherTokenAddress = token0Address;
    } else {
      // Skip processing this pair if neither token is WPLS
      continue;
    }

    const token0Contract = new ethers.Contract(
      WPLSAddress,
      minimalERC20ABI,
      provider
    );
    const token1Contract = new ethers.Contract(
      otherTokenAddress,
      minimalERC20ABI,
      provider
    );

    const [
      token0Name,
      token0Symbol,
      token1Name,
      token1Symbol,
      token0TotalSupplyRaw,
      token1TotalSupplyRaw,
      token0Decimals,
      token1Decimals,
    ] = await Promise.all([
      token0Contract.name(),
      token0Contract.symbol(),
      token1Contract.name(),
      token1Contract.symbol(),
      token0Contract.totalSupply(),
      token1Contract.totalSupply(),
      token0Contract.decimals(),
      token1Contract.decimals(),
    ]);

    const [reserve0, reserve1] = await pairContract.getReserves();

    const token0TotalSupply = bigIntToDecimalString(
      token0TotalSupplyRaw,
      token0Decimals
    );
    const token1TotalSupply = bigIntToDecimalString(
      token1TotalSupplyRaw,
      token1Decimals
    );
    const reserve0Formatted = bigIntToDecimalString(reserve0, token0Decimals);
    const reserve1Formatted = bigIntToDecimalString(reserve1, token1Decimals);

    // Calculate the price of 1 WPLS in terms of the other token
    const priceOfWPLSInToken1 = Number(reserve1) / Number(reserve0);

    // Compute the difference between the total supply and the locked supply
    const totalSupplyDifference = token0TotalSupplyRaw - reserve0;

    console.log(`Pair ${i}: ${pairAddress}`);
    console.log(`${WPLSAddress}  | ${otherTokenAddress} `);
    console.log(
      `TOTAL SUPPLY: (${token0Symbol}) ${token0TotalSupply} | (${token1Symbol}) ${token1TotalSupply}`
    );

    console.log(
      `LP (LOCKED): (${token0Symbol}) ${reserve0Formatted}:  (${token1Symbol}) ${reserve1Formatted} `
    );

    // Log the price of 1 WPLS in terms of the other token and the total supply difference
    console.log(
      `Price of 1 ${token0Symbol} in ${token1Symbol}: ${priceOfWPLSInToken1}`
    );
    console.log(
      `Total Supply - Locked Supply: ${totalSupplyDifference.toString()}`
    );

    console.log("\n");
  }
};

logListOfPoolsV2().catch(console.error);

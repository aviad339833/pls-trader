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

    if (
      token0Address.toLowerCase() === WPLS_TOKEN_ADDRESS ||
      token1Address.toLowerCase() === WPLS_TOKEN_ADDRESS
    ) {
      const token0Contract = new ethers.Contract(
        token0Address,
        minimalERC20ABI,
        provider
      );
      const token1Contract = new ethers.Contract(
        token1Address,
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

      console.log(`Pair ${i}: ${pairAddress}`);
      console.log(`${token0Address}  | ${token1Address} `);
      console.log(
        `TOTAL SUPPLY: (${token0Symbol}) ${token0TotalSupply} | (${token1Symbol}) ${token1TotalSupply}`
      );

      console.log(
        `LP (LOCKED): (${token0Symbol}) ${reserve0Formatted}:  (${token1Symbol}) ${reserve1Formatted} `
      );
      console.log("\n");
    }
  }
};

logListOfPoolsV2().catch(console.error);

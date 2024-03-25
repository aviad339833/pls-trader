import { ethers } from "ethers";
import { LIVE_RPC_URL } from "../config/config";
import pair_ABI from "../abis/pair_ABI.json";

export const getRatio = async (pair_address: string): Promise<number> => {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const pair_contract = new ethers.Contract(pair_address, pair_ABI, provider);

  try {
    const reserves = await pair_contract.getReserves();
    const reserve0 = ethers.formatUnits(reserves[0], 18); // Assuming 18 decimals, adjust as needed
    const reserve1 = ethers.formatUnits(reserves[1], 18); // Assuming 18 decimals, adjust as needed

    // The ratio of reserves (reserve1 / reserve0) gives you how much of token1 you get for 1 unit of token0
    const ratio = parseFloat(reserve1) / parseFloat(reserve0);

    return ratio;
  } catch (error) {
    console.error("Error fetching ratio:", error);
    return 0; // or throw an error or return an appropriate error value
  }
};

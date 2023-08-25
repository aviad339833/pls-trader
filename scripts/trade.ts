import { ethers } from "hardhat";
import pair_ABI from "./pair_ABI.json";

async function main() {
  // The minimum ratio
  const targetRatioDecimals = 0.0000338;

  const amplifier = 10000000000n; // to get rid of rounding issues
  // max number   = 9007199254740991

  const targetRatio =  BigInt(Math.round(Number(amplifier) * targetRatioDecimals));
  

  const RPC_URL = 'https://rpc.pulsechain.com';

  const DAI_ADDRESS = '0xefD766cCb38EaF1dfd701853BFCe31359239F305';
  const WPLS_ADDRESS = '0xa1077a294dde1b09bb078844df40758a5d0f9a27';
  const PAIR_ADDRESS = '0xe56043671df55de5cdf8459710433c10324de0ae';

  //const provider = ethers.getDefaultProvider("pulsechain");
  const provider = new ethers.JsonRpcProvider("https://rpc.pulsechain.com");

  const pair_contract = new ethers.Contract(
    PAIR_ADDRESS,
    pair_ABI,
    provider
  );


  const getRatio = async () => {
      try {
          
          const reserves = await pair_contract.getReserves();
          const ratio = (amplifier * reserves[1]) / reserves[0];
          console.log("ratio", ratio);

          return ratio;

      } catch (err) {
          console.error('Error fetching ratio:', err);
      }
  } 


  const tradeIfRatio = async () => {
    const ratio = await getRatio();
    console.log(`Ratio: ${ratio}, targetRatio: ${targetRatio}`);
    if (ratio && ratio > targetRatio) {
      console.log(`hurray, let's trade`);

      const executeTrade = async () => {
        // TODO
      }

      await executeTrade();
    }
    else {
      console.log(`shitty price, let's not trade`);
    }
  }


  // This is a simple polling mechanism to call getRatio every second.
  // You might want to optimize it to be event-driven if the blockchain supports such events.
  //setInterval(tradeIfRatio, 1000);
  
  await tradeIfRatio();
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

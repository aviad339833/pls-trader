import { ethers } from "hardhat";
import pair_ABI from "./pair_ABI.json";

async function main() {

  // Replace this with your RPC endpoint for PulseChain
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


  async function getRatio() {
      try {
          const data = await pair_contract.getReserves();
          console.log("reserves", data);

      } catch (err) {
          console.error('Error fetching ratio:', err);
      }
  } 

  // This is a simple polling mechanism to call getRatio every second.
  // You might want to optimize it to be event-driven if the blockchain supports such events.
  //setInterval(getRatio, 10000);
  getRatio();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

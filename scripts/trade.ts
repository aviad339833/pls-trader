import { ethers } from "hardhat";
import pair_ABI from "./pair_ABI.json";
/*
function getRatio(contractAddress):
-this functoin should watch the ratio between 
DAi = 0xefD766cCb38EaF1dfd701853BFCe31359239F305
to 
PLS native 


this is the url for it:
https://app.pulsex.com/swap?outputCurrency=0xefD766cCb38EaF1dfd701853BFCe31359239F305&chain=pulsechain

so every second if possible to fetch the ratio between PLS to DAI


Script Overview:

Connect to a PulseChain node.
Listen for new blocks.
When a new block is detected, query the contract for the ratio.
*/

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

  const data = await pair_contract.getReserves();
  console.log("DATAAA", data);

  // You'd ideally want the ABI (Application Binary Interface) of the contract to interact with its methods.
  // If it's a standard ERC-20, then there's a standard ABI you could use.
  const ABI = [];  // Replace with actual ABI

  //const contract = new web3.eth.Contract(ABI, PAIR_ADDRESS);

/*   async function getRatio() {
      try {
          // This method call depends on how the contract is set up
          // You'd typically call a function in the contract that gives you the desired ratio.
          const ratio = await contract.methods.getYourMethodName().call();

          console.log(`The current ratio is: ${ratio}`);
      } catch (err) {
          console.error('Error fetching ratio:', err);
      }
  } */

  // This is a simple polling mechanism to call getRatio every second.
  // You might want to optimize it to be event-driven if the blockchain supports such events.
  //setInterval(getRatio, 10000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

require("dotenv").config();
import { ethers } from "ethers";
import pairABI from "../abis/pair_ABI.json";
import minimalERC20ABI from "../abis/wpls_ABI.json";
// Assuming your ENV variables are named WALLET_ADDRESS_1, WALLET_PK_1, WALLET_ADDRESS_2, WALLET_PK_2, etc.
// And TOKEN_CONTRACT_ADDRESS for the token you're sending

async function sendToken(wallets, tokenContractAddress, amountToSend) {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.LIVE_RPC_URL
  );
  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    tokenAbi,
    provider
  );

  wallets.forEach(async (wallet) => {
    const signer = new ethers.Wallet(wallet.privateKey, provider);
    const tokenWithSigner = tokenContract.connect(signer);

    try {
      const tx = await tokenWithSigner.transfer(
        wallet.address,
        ethers.utils.parseUnits(amountToSend.toString(), "ether")
      ); // Assuming "ether" works for your token's decimals
      console.log(`Transaction hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    } catch (error) {
      console.error(`Failed to send tokens to ${wallet.address}:`, error);
    }
  });
}

function loadWalletsFromEnv() {
  const wallets = [];
  let index = 1;
  while (
    process.env[`WALLET_ADDRESS_${index}`] &&
    process.env[`WALLET_PK_${index}`]
  ) {
    wallets.push({
      address: process.env[`WALLET_ADDRESS_${index}`],
      privateKey: process.env[`WALLET_PK_${index}`],
    });
    index++;
  }
  return wallets;
}

async function main() {
  const wallets = loadWalletsFromEnv();
  if (wallets.length > 0) {
    // Example: Send 1 token to each wallet
    await sendToken(wallets, process.env.TOKEN_CONTRACT_ADDRESS, 1);
  } else {
    console.log("No wallets found in environment variables.");
  }
}

main().catch((error) => {
  console.error("An error occurred:", error);
});

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import erc20Abi from "../abis/wpls_ABI.json";
import { JsonRpcProvider } from "ethers";

dotenv.config();

interface TokenDetails {
  type: string;
  address?: string;
  decimals: number;
}

interface TokenConfig {
  [symbol: string]: TokenDetails;
}

interface WalletConfig {
  name: string;
  address: string;
}

// Read the JSON configuration for tokens and wallets
const config = JSON.parse(
  fs.readFileSync("scriptsBot/config.json", "utf8")
) as {
  tokens: TokenConfig;
  wallets: WalletConfig[];
};

// Function to fetch the token balance
const masterWalletAddress = "0x4025C90C51a811EC329837EBCB6434789ed328B9"; // Master wallet address

async function sendPLSToWallets(
  provider: JsonRpcProvider,
  senderPrivateKey: string,
  amountInPLS: string
): Promise<void> {
  const senderWallet = new ethers.Wallet(senderPrivateKey, provider);
  const amountInWei = ethers.parseUnits(amountInPLS, "ether"); // Assuming PLS has 18 decimals

  for (const wallet of config.wallets) {
    if (wallet.address === masterWalletAddress) continue; // Skip the master wallet

    console.log(
      `Sending ${amountInPLS} PLS to ${wallet.name} (${wallet.address})`
    );
    const tx = {
      to: wallet.address,
      value: amountInWei,
    };

    try {
      const transactionResponse = await senderWallet.sendTransaction(tx);
      await transactionResponse.wait(); // Wait for the transaction to be mined
      console.log(
        `Transaction successful with hash: ${transactionResponse.hash}`
      );
    } catch (error) {
      console.error(`Failed to send PLS to ${wallet.name}:`, error);
    }
  }
}

async function main(): Promise<void> {
  const provider = new ethers.JsonRpcProvider(process.env.LIVE_RPC);
  const senderPrivateKey = process.env.WALLET_PK_MASTER as string;
  const amountInPLS = "90000"; // The fixed amount of PLS you want to send

  await sendPLSToWallets(provider, senderPrivateKey, amountInPLS);
}

main().catch(console.error);

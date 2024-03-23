import { ethers } from "hardhat";
import { addresses, LIVE_RPC_URL, LIVE_WALLET_KEY } from "../config/config";
import wpls_ABI from "../abis/wpls_ABI.json";
import router_ABI from "../abis/router_ABI.json";
import { getBalance } from "./getTokenBlance";

// Utility to check token approval
async function checkAndApproveToken(
  signer: ethers.Wallet,
  tokenAddress: string,
  routerAddress: string,
  amount: ethers.BigNumber
) {
  const tokenContract = new ethers.Contract(tokenAddress, wpls_ABI, signer);
  const allowance = await tokenContract.allowance(
    signer.address,
    routerAddress
  );

  if (allowance.lt(amount)) {
    console.log("Approving tokens for trade...");
    const approveTx = await tokenContract.approve(
      routerAddress,
      ethers.constants.MaxUint256
    );
    await approveTx.wait();
    console.log("Approval transaction sent and confirmed.");
  } else {
    console.log("Token already approved for trading.");
  }
}

export const executeTrade = async (
  fromTokenSymbol: string,
  toTokenSymbol: string
) => {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const signer = new ethers.Wallet(LIVE_WALLET_KEY!, provider);

  const routerAddress = process.env.ROUTER_ADDRESS!;
  let router_contract = new ethers.Contract(routerAddress, router_ABI, signer);

  const fromToken = addresses[fromTokenSymbol].TOKEN_ADDRESS;
  const toToken = addresses[toTokenSymbol].TOKEN_ADDRESS;

  console.log(
    `Preparing to trade from ${fromTokenSymbol} to ${toTokenSymbol}...`
  );

  const block: any = await provider.getBlock("latest");
  const deadline = block.timestamp + 1000;

  const fromTokenBalance = await getBalance(fromToken);
  console.log("Retrieved balance for token:", fromTokenBalance.token_symbol);
  console.log("Balance:", fromTokenBalance.your_token_balance);
  console.log("Token address:", fromToken);

  if (fromTokenBalance.your_token_balance <= 0) {
    console.log(`No balance to trade for ${fromTokenBalance.token_symbol}.`);
    return;
  }

  const tradeAmount = fromTokenBalance.your_token_balance;

  console.log(
    `Trading ${tradeAmount} of ${fromTokenBalance.token_symbol} to ${toTokenSymbol}.`
  );

  // Check and approve the fromToken if necessary
  await checkAndApproveToken(signer, fromToken, routerAddress, tradeAmount);

  // Execute trade
  console.log("Executing trade...");
  const tx = await router_contract.swapExactTokensForTokens(
    tradeAmount,
    0, // set minimum amount out as needed
    [fromToken, toToken],
    signer.address,
    deadline
  );

  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();
  console.log("Trade executed successfully.");
};

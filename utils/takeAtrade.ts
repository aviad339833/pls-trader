import { ethers } from "hardhat";
import { addresses, LIVE_RPC_URL, LIVE_WALLET_KEY } from "../config/config";
import wpls_ABI from "../abis/wpls_ABI.json";
import router_ABI from "../abis/router_ABI.json";
import { getBalance } from "./getTokenBlance";

export const executeTrade = async (
  tradeDirection: "DAI_TO_PLS" | "PLS_TO_DAI"
) => {
  const provider = new ethers.JsonRpcProvider(LIVE_RPC_URL);
  const signer = new ethers.Wallet(LIVE_WALLET_KEY, provider);

  let router_contract = new ethers.Contract(
    process.env.ROUTER_ADDRESS,
    router_ABI,
    signer
  );

  let fromToken, toToken;

  if (tradeDirection === "DAI_TO_PLS") {
    fromToken = addresses.DAI.TOKEN_ADDRESS;
    toToken = addresses.WPLS.TOKEN_ADDRESS; // Assuming there's a PLS address in the config
  } else {
    fromToken = addresses.WPLS.TOKEN_ADDRESS; // Assuming there's a PLS address in the config
    toToken = addresses.DAI.TOKEN_ADDRESS;
  }

  console.log(`Preparing to trade from ${tradeDirection}...`);

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

  // Now using the entire balance for the trade
  const tradeAmount = fromTokenBalance.your_token_balance;

  console.log(
    `Trading ${tradeAmount} of ${fromTokenBalance.token_symbol} to ${toToken}.`
  );

  const fromTokenContract = new ethers.Contract(fromToken, wpls_ABI, signer);

  // Approve the router to spend tokens
  console.log("Approving tokens for trade...");
  const approveTx = await fromTokenContract.approve(
    process.env.ROUTER_ADDRESS,
    tradeAmount
  );
  await approveTx.wait();
  console.log("Approval transaction sent and confirmed.");

  // Execute trade
  console.log("Executing trade...");
  let tx;
  if (tradeDirection === "DAI_TO_PLS") {
    // DAI to PLS trade example
    tx = await router_contract.swapExactTokensForTokens(
      tradeAmount,
      0, // set minimum amount out as needed
      [fromToken, toToken],
      signer.address,
      deadline
    );
  } else {
    // PLS to DAI trade example
    tx = await router_contract.swapExactTokensForTokens(
      tradeAmount,
      0, // set minimum amount out as needed
      [fromToken, toToken],
      signer.address,
      deadline
    );
  }

  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();
  console.log("Trade executed successfully.");
};

// Note: The function `getBalance` should return an object containing `your_token_balance`
// and `token_symbol` based on the `fromToken` address. Ensure this function is correctly implemented.

// Use aggressive gas settings if needed by adjusting the gas price in the transaction parameters.

// executeTrade("DAI_TO_PLS");

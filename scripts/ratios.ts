import fs from "fs/promises";
import { getAllBalances } from "../utils/getAllBalances";
import { getRatio } from "../utils/getRatio";
import { addresses } from "../config/config";
import { getPLSWalletBalance } from "../utils/getPLSWalletBalance";

function customDivision(inputStr: BigInt | undefined, divisor: number) {
  if (inputStr === undefined) {
    // Handle undefined, you can return a default value or throw an error.
    return 0;
  }

  // Remove the 'n' from the input string and convert to a number
  const inputNumber = parseFloat(String(inputStr).replace("n", ""));
  // Divide the input number by the divisor
  const result = inputNumber / divisor;

  return result;
}

async function updateRatios() {
  try {
    const balances = await getAllBalances();

    const PLS_wallet_balnce = await getPLSWalletBalance(); // Await here

    const DAI_price = await getRatio(addresses.DAI.PAIR_ADDRESS);
    const HEX_price = await getRatio(addresses.HEX.PAIR_ADDRESS);
    const PLSX_price = await getRatio(addresses.PLSX.PAIR_ADDRESS);

    const ratiosAndBalancesInfo = {
      DAI: {
        CURRENT_PRICE: customDivision(DAI_price, 10000000000), // Convert to BigInt and ensure it is not undefined
        BALANCE: String(balances.DAI),
        CURRENT_PRICE_BIGINT: String(DAI_price),
      },
      HEX: {
        CURRENT_PRICE: HEX_price
          ? customDivision(HEX_price, 100000000000000000000)
          : 0, // Check for undefined
        CURRENT_PRICE_BIGINT: String(HEX_price),
        BALANCE: String(balances.HEX),
      },
      PLSX: {
        CURRENT_PRICE: PLSX_price ? customDivision(PLSX_price, 10000000000) : 0, // Check for undefined
        CURRENT_PRICE_BIGINT: String(PLSX_price),
        BALANCE: String(balances.PLSX),
      },
      PLS_WALLET: {
        CURRENT_PRICE: DAI_price ? customDivision(DAI_price, 10000000000) : 0, // Check for undefined
        CURRENT_PRICE_BIGINT: String(DAI_price),
        BALANCE: String(PLS_wallet_balnce), // No need to use 'await' here agai)n
      },
    };

    // Convert ratiosAndBalancesInfo to a JSON string
    const jsonStr = JSON.stringify(ratiosAndBalancesInfo, null, 2); // The "2" argument pretty-prints the JSON

    // Write the JSON string to a file named ratiosAndBalancesInfo.json
    await fs.writeFile("ratiosAndBalancesInfo.json", jsonStr);

    console.clear();
    console.log(ratiosAndBalancesInfo);

    console.clear();
    console.log(ratiosAndBalancesInfo);
  } catch (error) {
    console.error("Error updating ratios:", error);
  }
}

// Run updateRatios every 5 seconds
setInterval(updateRatios, 1000);

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
    const PLS_price = await getRatio(addresses.DAI.PAIR_ADDRESS);
    const DWB_price = await getRatio(addresses.DWB.PAIR_ADDRESS);

    const DWB_price_in_USD =
      customDivision(PLS_price, 10000000000) *
      (1 / customDivision(DWB_price, 10000000000));

    const DAIInfo = {
      DAI: {
        CURRENT_PRICE: customDivision(PLS_price, 10000000000), // Adjusted for PLS_price's specific scaling factor
        BALANCE: String(balances.DAI), // Balance in DAI
        CURRENT_PRICE_BIGINT: String(PLS_price), // Original BigInt price
        TOKEN_NAME: "DAI", // Original BigInt price
      },
      DWB: {
        CURRENT_PRICE: DWB_price_in_USD,
        BALANCE: String(balances.DWB),
        CURRENT_PRICE_BIGINT: String(DWB_price), // Original BigInt price
        TOKEN_NAME: "DAI", // Original BigInt price
      },
      PLS: {
        CURRENT_PRICE: customDivision(PLS_price, 10000000000), // Adjusted for DAI's specific scaling factor
        BALANCE: String(balances.WPLS), // Balance in DAI
        CURRENT_PRICE_BIGINT: String(PLS_price), // Original BigInt price
        TOKEN_NAME: "PLS", // Original BigInt price
      },
    };

    // Convert DAIInfo to a JSON string
    const jsonStr = JSON.stringify(DAIInfo, null, 2); // Pretty-print the JSON

    // Write only the DAI information to a file named DAIInfo.json
    await fs.writeFile("DAIInfo.json", jsonStr);

    console.clear(); // Clear the console to keep it clean
    console.log(DAIInfo); // Log the DAI information for verification
  } catch (error) {
    console.error("Error updating DAI price:", error);
  }
}

// Run updateRatios every second
setInterval(updateRatios, 1000);

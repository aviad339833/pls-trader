// userInputs.ts

import readline from "readline";
import { addresses } from "../config/config";
import { getBalance } from "./getTokenBlance";

export interface UserInputs {
  targetPrice: number;
  triggerAbove: boolean;
  tradePLStoDAIInput: boolean;
}

export async function gatherUserInputs(): Promise<UserInputs> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let targetPrice: number, triggerAbove: boolean, tradePLStoDAIInput: boolean;

    rl.question("Enter target price: ", (price) => {
      targetPrice = parseFloat(price);
      rl.question(
        "Trigger a trade if price is above (true/false): ",
        (above) => {
          triggerAbove = above === "true";
          rl.question("Trade PLS to DAI? (true/false): ", (tradePLS) => {
            tradePLStoDAIInput = tradePLS === "true";
            rl.close();
            resolve({ targetPrice, triggerAbove, tradePLStoDAIInput });
          });
        }
      );
    });
  });
}

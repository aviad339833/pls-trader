import fs from "fs"; // Import fs module
import { readJSONFile } from "../utils/readJSONFile";
import { executeTrade } from "../utils/takeAtrade";

const triggerPrice = 0.000127200608966;
let triggerDirection: "above" | "below" = "above";
let tradedToken: "DAI" | "PLS" = "DAI";
const stopLossPercentage = 1;
let stopLossDirection: "above" | "below" = "above";

let isTradeActive = loadTradeStatus();

function saveTradeStatus(isTradeActive: boolean) {
  const tradeStatus = { isTradeActive };
  fs.writeFileSync(
    "tradeStatus.json",
    JSON.stringify(tradeStatus, null, 2),
    "utf8"
  );
}

function resetLogFile() {
  fs.writeFileSync("tradeStatus.json", "", "utf8"); // Clears the content of the log file
}
function tradeStats() {
  console.log(` triggerPrice : ${triggerPrice}`);
  console.log(` triggerDirection : ${triggerDirection}`);
  console.log(` tradedToken : ${tradedToken}`);
  console.log(` stopLossPercentage : ${stopLossPercentage}`);
  console.log(` stopLossDirection : ${stopLossDirection}`);
}

function loadTradeStatus() {
  try {
    const data = fs.readFileSync("tradeStatus.json", "utf8");
    const tradeStatus = JSON.parse(data);
    return tradeStatus.isTradeActive;
  } catch (error) {
    console.log("No existing trade status found, starting fresh.");
    return false; // Default to false if file doesn't exist or an error occurs
  }
}

// Logging function to append logs to a file
function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  fs.appendFileSync("tradeLog.txt", logMessage, "utf8"); // Change 'tradeLog.txt' to your preferred log file name
}

async function fetchCurrentPrice() {
  console.clear();
  console.log("Fetching current price...");

  const data = await readJSONFile("pls-trader/DAIInfo.json");

  if (data.PLS.TOKEN_NAME === tradedToken && !(data.PLS.BALANCE > 0)) {
    tradeStats();
    console.log(
      `You don't have balance to trade ${tradedToken} Please check the stats again `
    );
    process.exit(); // Exits the process immediately
  }
  if (data.DAI.TOKEN_NAME === tradedToken && !(data.DAI.BALANCE > 0)) {
    tradeStats();
    console.log(
      `You don't have balance to trade ${tradedToken} Please check the stats again `
    );
    process.exit(); // Exits the process immediately
  }
  if (data && data.PLS && data.PLS.CURRENT_PRICE) {
    console.log(`Trigger Price: ${triggerPrice}`);
    console.log(
      `If PLS price goes ${triggerDirection} ${triggerPrice}, execute a trade `
    );
    console.log(`Current WPLS Price: ${data.PLS.CURRENT_PRICE}`);

    return data.PLS.CURRENT_PRICE;
  } else {
    throw new Error("Failed to fetch current WPLS price");
  }
}

async function checkAndExecuteTrade() {
  try {
    const currentPrice = await fetchCurrentPrice();
    const percentageDifference =
      ((currentPrice - triggerPrice) / triggerPrice) * 100;
    console.log(
      `Percentage difference from trigger price: ${percentageDifference.toFixed(
        2
      )}%`
    );

    if (!isTradeActive) {
      console.log(
        `Checking trade conditions at ${new Date().toLocaleTimeString()}...`
      );

      // Adjusted condition to check if currentPrice is below the triggerPrice for "below" direction
      if (
        (triggerDirection === "below" && currentPrice < triggerPrice) ||
        (triggerDirection === "above" && currentPrice > triggerPrice)
      ) {
        const tradeDirection =
          tradedToken === "PLS" ? "PLS_TO_DAI" : "DAI_TO_PLS";
        await executeTrade(tradeDirection);
        console.log(
          `Executed ${tradeDirection} trade at price: ${currentPrice}. Trade is now active.`
        );
        logToFile(
          `Executed ${tradeDirection} trade at price: ${currentPrice}. Trade is now active.`
        ); // Log trade execution

        isTradeActive = true;
        saveTradeStatus(isTradeActive);

        // The rest of your logic for stop-loss condition remains the same...
      } else {
        console.log("Current price does not meet trade conditions. Waiting...");
      }
    } else {
      console.log(
        "A trade is already active. Monitoring for stop-loss condition..."
      );
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
    logToFile(`An error occurred: ${error}`); // Log error
  }
}

function calculateStopLossPrice(
  entryPrice: any,
  isBelow: any,
  percentage: any
) {
  return isBelow
    ? entryPrice * (1 - percentage / 100)
    : entryPrice * (1 + percentage / 100);
}

// Kick off the process

setInterval(checkAndExecuteTrade, 5000); // Check every 5 seconds, aligning with your JSON update frequency

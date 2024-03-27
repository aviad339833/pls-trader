import { readFile, writeFile } from "fs/promises"; // Note: Now importing readFile from 'fs/promises' as well
import { join } from "path";

interface LpTestResult {
  timestamp: Date;
  tokenPair: string;
  token0Address: string;
  token1Address: string;
  token0Decimals: number;
  token1Decimals: number;
  supply: {
    token0: string;
    token1: string;
  };
  ratio: string;
  transactionHash: string;
  poolAddress: string;
  transactionDetails: {
    blockNumber: number | null; // You mentioned this as null, consider updating when available
    blockHash: string | null; // Similarly, consider updating when available
    from: string;
    to: string;
    nonce: number;
    gasLimit: bigint;
    gasPrice: bigint | undefined; // Gas Price might be undefined for EIP-1559 transactions
    maxPriorityFeePerGas: bigint;
    maxFeePerGas: bigint;
    value: bigint;
    chainId: bigint;
    data: string;
  };
  details: {
    swapSuccess: boolean;
    liquidityCheck: string;
  };
}

const logFilePath = join(__dirname, "successfulLpTests.json");

export async function logSuccessfulLpTest(result: LpTestResult) {
  try {
    // Initialize logs array
    let logs: LpTestResult[] = [];
    try {
      // Attempt to read the current log file
      const currentLogs = await readFile(logFilePath, { encoding: "utf8" });
      logs = JSON.parse(currentLogs);
    } catch (error) {
      // If the file does not exist or there's an error reading it, we catch the error and continue with an empty array
      // This is a good spot to check for specific errors, e.g., file not found, but for simplicity, we'll just assume it needs to start fresh
    }

    // Add the new result to the array of logs
    logs.push(result);

    // Write the updated logs array back to the file
    await writeFile(logFilePath, JSON.stringify(logs, null, 2));
    console.log("Successfully logged the LP test result.");
  } catch (error) {
    console.error("Failed to log the LP test result:", error);
  }
}

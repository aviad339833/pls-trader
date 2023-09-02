import * as fs from "fs";
import * as path from "path";

interface IUpdates {
  [key: string]: any;
}

export const updateJsonFile = (updates: IUpdates): void => {
  const folderPath: string = path.join(__dirname, "trades");

  const filePath: string = path.join(folderPath, "DAI_trade_info.json");

  // Make sure the folder exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  let jsonData: IUpdates = {};

  // Check if file exists
  if (fs.existsSync(filePath)) {
    // Read the existing JSON data from the file
    const rawFileData: string = fs.readFileSync(filePath, "utf-8");

    // Parse the JSON data
    jsonData = JSON.parse(rawFileData);
  }

  // Update the JSON data with new updates
  Object.assign(jsonData, updates);

  // Write the updated JSON data back to the file
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
};

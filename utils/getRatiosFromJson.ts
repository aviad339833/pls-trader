import fs from "fs";
import path from "path";

export function getRatiosFromJson() {
  try {
    // Use path.join to safely create the absolute path to the file
    const filePath = path.join(__dirname, "../ratios.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const ratios = JSON.parse(rawData);
    return ratios;
  } catch (error) {
    console.error("Could not read ratios.json:", error);
    return null;
  }
}

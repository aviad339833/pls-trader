import fs from "fs/promises";
import path from "path";

// Function to read and parse a JSON file
export async function readJSONFile(relativePath: string): Promise<any> {
  try {
    // Assuming the root of your project is two levels up from this script
    const projectRoot = path.resolve(__dirname, "..", "..");
    const fullPath = path.join(projectRoot, relativePath);

    const fileContent = await fs.readFile(fullPath, "utf8");
    const parsedJSON = JSON.parse(fileContent);

    return parsedJSON;
  } catch (error) {
    console.error(`An error occurred while reading the file: ${error}`);
    return null;
  }
}

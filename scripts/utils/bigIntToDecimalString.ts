export const bigIntToDecimalString = (
  rawBigInt: bigint | undefined,
  decimalsBigInt: bigint
): string => {
  try {
    if (typeof rawBigInt === "undefined") {
      return "0";
    }

    // Ensure decimals is a number for string manipulation
    const decimals = Number(decimalsBigInt);

    const scaleFactor: bigint = 10n ** decimalsBigInt;
    const intPart: bigint = rawBigInt / scaleFactor;
    const fractPart: bigint = rawBigInt % scaleFactor;

    // Convert BigInts to string
    const intPartStr: string = intPart.toString();
    let fractPartStr: string = fractPart.toString();

    // Ensure fractPartStr has the correct length, pad with leading zeros if necessary
    fractPartStr = fractPartStr.padStart(decimals, "0");

    // Concatenate integer and fractional parts
    // Avoid adding a decimal point if decimals is 0
    return Number(
      intPartStr + (decimals > 0 ? "." + fractPartStr : "")
    ).toLocaleString();
  } catch (error) {
    console.error("Error formatting bigInt to decimal string: ", error);
    return "couldn't fetch";
  }
};

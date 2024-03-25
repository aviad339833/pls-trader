export const bigIntToDecimalString = (
  rawBigInt: BigInt | undefined,
  decimals: number
): number => {
  if (typeof rawBigInt === "undefined") {
    return 0;
  }

  const fullStr = rawBigInt.toString().padStart(decimals + 1, "0");
  const intPart = fullStr.slice(0, -decimals) || "0";
  const fractPart = fullStr.slice(-decimals).padEnd(decimals, "0");

  // console.log("fullStr", Number(intPart + "." + fractPart));
  return Number(intPart + "." + fractPart);
};

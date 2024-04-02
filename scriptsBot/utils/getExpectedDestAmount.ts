export async function getExpectedDestAmount(
  router: any,
  amountIn: any,
  path: any
) {
  try {
    // This function name 'getAmountsOut' may vary based on your contract's ABI
    const amountsOut = await router.getAmountsOut(amountIn, path);
    return amountsOut[amountsOut.length - 1];
  } catch (error) {
    console.error("Error getting expected destination amount:", error);
    throw error;
  }
}

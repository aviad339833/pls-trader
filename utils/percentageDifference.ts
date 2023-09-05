export function percentageDifference(a: number, b: number): string {
  const diff = Math.abs(a - b);
  const avg = (a + b) / 2;
  const percentage = (diff / avg) * 100;
  return percentage.toFixed(2); // Rounds to two decimal places for readability
}

export function describeDifference(a: number, b: number): string {
  const diffPercentage = parseFloat(percentageDifference(a, b));

  if (diffPercentage < 0.01) {
    return `The price is very close to the target (${diffPercentage}%)`;
  } else if (diffPercentage < 0.1) {
    return `The price is close to the target (${diffPercentage}%)`;
  } else if (diffPercentage < 1) {
    return `There is a small difference between the price and the target (${diffPercentage}%)`;
  } else {
    return `The price is far from the target (${diffPercentage}%)`;
  }
}

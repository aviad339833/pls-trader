import { Direction } from "../../config/types";

export const shouldTriggerTrade = (
  triggerAlert: number,
  triggerDirection: Direction,
  tradedAssetPrice: number
): boolean => {
  if (
    (triggerAlert < tradedAssetPrice && triggerDirection === "above") ||
    (triggerAlert > tradedAssetPrice && triggerDirection === "below")
  ) {
    return true;
  }
  return false;
};

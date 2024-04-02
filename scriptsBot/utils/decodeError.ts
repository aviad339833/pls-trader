import { ethers } from "hardhat";

export function decodeError(data: any) {
  const errors = {
    ETHTransferFailed: "ETHTransferFailed()",
    EthDepositRejected: "EthDepositRejected()",
    HasBeenStopped: "HasBeenStopped()",
    InsufficientBalance: "InsufficientBalance()",
    InvalidMsgValue: "InvalidMsgValue()",
    ReturnAmountIsNotEnough: "ReturnAmountIsNotEnough()",
    SafeTransferFailed: "SafeTransferFailed()",
    SafeTransferFromFailed: "SafeTransferFromFailed()",
    ZeroAddress: "ZeroAddress()",
    ZeroData: "ZeroData()",
    ZeroDestAmount: "ZeroDestAmount()",
    ZeroSrcAmount: "ZeroSrcAmount()",
  };

  const foundError = Object.entries(errors).find(
    ([key, signature]) =>
      ethers.id(signature).substring(0, 10) === data.substring(0, 10)
  );

  return foundError ? foundError[0] : `Unknown error: ${data}`;
}

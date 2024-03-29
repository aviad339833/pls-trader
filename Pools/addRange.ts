import { ethers } from "hardhat";
import { addresses, LIVE_RPC_URL, LIVE_WALLET_KEY } from "../config/config";
import wpls_ABI from "../abis/wpls_ABI.json";
import router_ABI from "../abis/router_ABI.json";
import { getBalance } from "./getTokenBlance";
import { logTokenDetails } from "../utils/utils";
const v3PoolABI =
  require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json").abi;

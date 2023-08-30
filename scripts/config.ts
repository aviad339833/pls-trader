// Import the dotenv library to handle .env files
require("dotenv").config();

// Assign environment variables to TypeScript variables
export const LIVE_WALLET_KEY = process.env.LIVE_WALLET_KEY;
export const LIVE_RPC_URL = process.env.LIVE_RPC;

export const PAIR_ADDRESS = process.env.PAIR_ADDRESS;
export const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS;

export const HARDHAT_PRIVATE_KEY = process.env.HARDHAT_PRIVATE_KEY;
export const RPC_URL_LOCAL = process.env.RPC_URL_LOCAL;

// Any other constants you may need throughout your app
export const AMPLIFIER = 10000000000n;

export const DAI_ADDRESS = process.env.DAI_ADDRESS;
export const HEX_ADDRESS = process.env.HEX_ADDRESS;
export const WPLS_ADDRESS = process.env.WPLS_ADDRESS;
export const PLSX_ADDRESS = process.env.PLSX_ADDRESS;

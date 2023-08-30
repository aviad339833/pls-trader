// Import the dotenv library to handle .env files
require("dotenv").config();

// Assign environment variables to TypeScript variables
export const LIVE_WALLET_KEY = process.env.LIVE_WALLET_KEY;
export const LIVE_RPC_URL = process.env.LIVE_RPC;

export const HARDHAT_PRIVATE_KEY = process.env.HARDHAT_PRIVATE_KEY;
export const RPC_URL_LOCAL = process.env.RPC_URL_LOCAL;

// Any other constants you may need throughout your app
export const AMPLIFIER = 10000000000n;

export const addresses = {
  DAI: {
    TOKEN_ADDRESS: "0xefD766cCb38EaF1dfd701853BFCe31359239F305",
    PAIR_ADDRESS: "0xE56043671df55dE5CDf8459710433C10324DE0aE",
  },
  HEX: {
    TOKEN_ADDRESS: "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39",
    PAIR_ADDRESS: "0xf1F4ee610b2bAbB05C635F726eF8B0C568c8dc65",
  },
  PLSX: {
    TOKEN_ADDRESS: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab",
    PAIR_ADDRESS: "0x1b45b9148791d3a104184Cd5DFE5CE57193a3ee9",
  },
  WPLS: {
    TOKEN_ADDRESS: "0xA1077a294dDE1B09bB078844df40758a5D0f9a27",
    PAIR_ADDRESS: "",
  },
};

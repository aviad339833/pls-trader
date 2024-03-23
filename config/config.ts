// Import the dotenv library to handle .env files
require("dotenv").config();

type TokenConfig = {
  TOKEN_ADDRESS: string;
  PAIR_ADDRESS: string;
  BALANCE_DEVIDER: number;
  WALLET_ADDRESS?: string;
  WALLET_PRIVATE_KEY?: string;
};

type AddressBook = {
  [key: string]: TokenConfig;
};

// Assign environment variables to TypeScript variables
export const LIVE_RPC_URL = process.env.LIVE_RPC;

export const HARDHAT_PRIVATE_KEY = process.env.HARDHAT_PRIVATE_KEY;
export const RPC_URL_LOCAL = process.env.RPC_URL_LOCAL;

// Any other constants you may need throughout your app
export const AMPLIFIER = 10000000000n;

export const addresses: AddressBook = {
  DAI: {
    TOKEN_ADDRESS: "0xefD766cCb38EaF1dfd701853BFCe31359239F305",
    PAIR_ADDRESS: "0xE56043671df55dE5CDf8459710433C10324DE0aE",
    BALANCE_DEVIDER: 1000000000000000000,
  },
  DWB: {
    WALLET_ADDRESS: "0x59a37F1d15A0dF5B2B96830F189e4dEC2Ee8e28a",
    WALLET_PRIVATE_KEY: process.env.DWB_WALLET_PK,
    TOKEN_ADDRESS: "0xAEbcD0F8f69ECF9587e292bdfc4d731c1abedB68",
    PAIR_ADDRESS: "0x3584aE4d7046c160bA9c64bB53951285c4B2abfd",
    BALANCE_DEVIDER: 1000000000000000000,
  },
  HOA: {
    WALLET_ADDRESS: "0x242C542156727990d73c5a80145758b202a65d14",
    WALLET_PRIVATE_KEY: process.env.HOA_WALLET_PK,
    TOKEN_ADDRESS: "0x7901a3569679AEc3501dbeC59399F327854a70fe",
    PAIR_ADDRESS: "0xD1A2518754796016F177E1759f4Ae50a4dcdA333",
    BALANCE_DEVIDER: 1000000000000000000,
  },
  WPLS: {
    TOKEN_ADDRESS: "0xA1077a294dDE1B09bB078844df40758a5D0f9a27",
    PAIR_ADDRESS: "0xE56043671df55dE5CDf8459710433C10324DE0aE",
    BALANCE_DEVIDER: 1000000000000000000,
  },
};

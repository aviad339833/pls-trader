import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    pulsechain: {
      url: "https://rpc.pulsechain.com"
    }
  }
};

export default config;

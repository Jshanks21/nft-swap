import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-network-helpers";
import "@nomicfoundation/hardhat-verify";
import 'dotenv/config' 

const config: HardhatUserConfig = {
  networks: {
    hardhat: {},
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_API_KEY}`,
      accounts: [process.env.AUX_PRIV_KEY!]
    }
  },
  etherscan: {    
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};

export default config;

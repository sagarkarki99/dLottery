require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-waffle');
require('hardhat-deploy');
require('solidity-coverage');
require('hardhat-gas-reporter');
require('dotenv').config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const LOCALHOST = process.env.LOCALHOST
const RINKEBY_URL = process.env.RINKEBY_URL
const PRIVATE_KEY = process.env.METAMASK_PRIVATE_KEY
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfigurations: 1,
    },
    rinkeby: {
      url: RINKEBY_URL,
      accounts: [PRIVATE_KEY],
      blockConfigurations: 6,
      chainId: 4,
    }
  },
  solidity: "0.8.7",
  gasReporter: {
    enabled: false,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    }
  }
};
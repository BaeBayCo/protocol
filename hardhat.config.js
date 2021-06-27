require("@nomiclabs/hardhat-waffle");
require('dotenv').config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers:[
      {version:"0.8.0"},
      {version:"0.5.16"}
    ]
  },
  networks: {


    hardhat:{
      //chainId:56,
      chainId:137,
      forking:{
        //url:"https://bsc-dataseed.binance.org/"
        url:"https://rpc-mainnet.matic.network"
      },
      accounts:{
        mnemonic : process.env.SEED_PHRASE
      }
    },

    polygon:{
      accounts:{
        mnemonic : process.env.SEED_PHRASE
      },
      url:"https://rpc-mainnet.matic.network"
    },

    bsc:{
      accounts:{
        mnemonic : process.env.SEED_PHRASE
      },
      url:process.env.BSC_ENDPOINT
    }

  }
};



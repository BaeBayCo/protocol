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
      chainId:56,
      forking:{
        url:process.env.BSC_ENDPOINT
      },
      accounts:{
        mnemonic : process.env.SEED_PHRASE
      }
    },

    polygon:{
      accounts:{
        mnemonic : process.env.SEED_PHRASE
      },
      url:process.env.POLYGON_ENDPOINT
    },

    bsc:{
      accounts:{
        mnemonic : process.env.SEED_PHRASE
      },
      url:process.env.BSC_ENDPOINT
    }

  }
};



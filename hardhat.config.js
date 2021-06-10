require("@nomiclabs/hardhat-waffle");
const fs = require('fs');
const seed = fs.readFileSync(".seed").toString().trim();

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
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/LhFW6zh_h6phF-WE8VIkf_Nn4UDGbgkA",
      accounts : {
        mnemonic : seed
      }
    }
  }
};



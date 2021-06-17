const { expect } = require("chai");
const { ethers } = require("hardhat");

//onlyOwner can set dumping address
//onlyOwner can set tributeManager

//constructor
// - treasury address receives correct amount of funds
// - ensure token is paused

//burn
// - onlyOwner can burn

//transfer to dumping address
// - onlyOwner can set Dumping address
// - burn and transfer occur
// - burn amount is correct
// - transfer amount is correct
// - dumping addresses can be changed/added

//tribute manager
// - verify tribute code runs (count increases only when dumping address is receiver)
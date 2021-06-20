const { expect } = require("chai");
const { ethers } = require("hardhat");

//bsc local fork
//polygon local fork
//test on different networks (detect chain IDs)
 
//deployment script function (dp of token, mock price target)
// - deploy fake token (variable DP)
// - deploy buy limit contract
// - deploy mock price feed (8dp)
// - deploy CallbackDB

let accounts;

async function setupMockSale(start,end,dp,buyLimit,max,owner){

    const MockPaymentToken = await ethers.getContractFactory("MockPaymentToken");
    const token = await MockPaymentToken.deploy("TEST","TEST",dp);

    const MockBuyLimit = await ethers.getContractFactory("MockBuyLimit");
    const mockBuyLimit = await MockBuyLimit.connect(owner).deploy(buyLimit);

    const networkDeets = await await ethers.provider.getNetwork();

    let pfAddress;

    // BUSD / USD
    if (networkDeets.chainId == 56) pfAddress = "0xcBb98864Ef56E9042e7d2efef76141f15731B82f";
    
    // USDC / USD
    if (networkDeets.chainId == 137) pfAddress = "0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7";

    const HybridTokenSaleReceiver = await ethers.getContractFactory("HybridTokenSaleReceiver");

    const receiver = await HybridTokenSaleReceiver.connect(owner).deploy(
        start,
        end,
        await owner.getAddress(),
        await owner.getAddress(),
        mockBuyLimit.address
    );

    const CallbackDB = await ethers.getContractFactory("CallbackDataBridge");
    const callbackDB = await CallbackDB.deploy(receiver.address,max);

    //change callback address in receiver
    await receiver.connect(owner).setCallbackAddress(callbackDB.address);

    await receiver.connect(owner).setPriceFeed(token.address,pfAddress);

    return {receiver:receiver,callbackDB:callbackDB,token:token}

}

//Prevents buying before start time
//Prevents buying after end

//only Owner can do onlyOwner stuff

//chainlink, test :
// - get oracle data from fork
// - check if correct... (check directly from call, compare)

//doesn't allow purchases over buy limit
// - make test buy limit manager
// - check if doesn't allow purchases over limit amount (first purchase)
// - check if doesn't allow purchases over limit amount (multiple purchases)
// - check if doesn't allow purchases when limit is set to 0

//check correct amount is sent to correct address

describe("Hybrid Token Sale Receiver Test", function(){

    beforeEach(async function(){

        accounts = await ethers.getSigners();

    });

    describe("Contract Ownership", async function(){

        it("Owner can set receiver address", async function(){

            const {receiver,callbackDB,token} = await setupMockSale(
                                                    Math.floor(Date.now()/1000),
                                                    Math.floor(Date.now()/1000)+120,
                                                    18,
                                                    ethers.utils.parseUnits("500"),
                                                    ethers.utils.parseUnits("50000"),
                                                    accounts[0]
                                                );

            receiver.connect(accounts[0]).setReceiverAddress(await accounts[1].getAddress());

            expect(await receiver.receiverAddress()).to.equal(await accounts[1].getAddress());


        });

        it("")


    });



})
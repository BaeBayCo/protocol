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

    const priceFeed = await ethers.getContractAt("AggregatorV2V3Interface",pfAddress);

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

    return {receiver:receiver,callbackDB:callbackDB,token:token,priceFeed:priceFeed}

}

//Prevents buying before start time
//Prevents buying after end

//only Owner can do onlyOwner stuff

//pricing data, test :
// - get oracle data from fork
// - check if correct... (check directly from call, compare)
// - check if works correctly with 6dp token

//buy limit
// - allows single purchase under purchase limit
// - allows multiple purchases under limit
// - allows single purchase equal to limit
// - check if doesn't allow purchases over limit amount (first purchase)
// - check if doesn't allow purchases over limit amount (multiple purchases)
// - check if doesn't allow purchases when limit is set to 0

//check sales aren't allowed when contract is paused
//check sales aren't allowed when sale is over/ yet to start

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

            await receiver.connect(accounts[0]).setReceiverAddress(await accounts[1].getAddress());

            expect(await receiver.receiverAddress()).to.equal(await accounts[1].getAddress());

        });

        it("Non owner prevented from setting receiver address", async function(){

            const {receiver,callbackDB,token} = await setupMockSale(
                                                    Math.floor(Date.now()/1000),
                                                    Math.floor(Date.now()/1000)+120,
                                                    18,
                                                    ethers.utils.parseUnits("500"),
                                                    ethers.utils.parseUnits("50000"),
                                                    accounts[0]
                                                );

            await expect(receiver.connect(accounts[1]).setReceiverAddress(await accounts[1].getAddress()))
                    .to.be.revertedWith("Ownable: caller is not the owner");

        });

        it("Owner can set callback address", async function(){

            const {receiver,callbackDB,token} = await setupMockSale(
                                                    Math.floor(Date.now()/1000),
                                                    Math.floor(Date.now()/1000)+120,
                                                    18,
                                                    ethers.utils.parseUnits("500"),
                                                    ethers.utils.parseUnits("50000"),
                                                    accounts[0]
                                                );

            await receiver.connect(accounts[0]).setCallbackAddress(await accounts[1].getAddress());

            expect(await receiver.callbackAddress()).to.equal(await accounts[1].getAddress());

        });

        it("Non owner prevented from setting callback address", async function(){

            const {receiver,callbackDB,token} = await setupMockSale(
                                                    Math.floor(Date.now()/1000),
                                                    Math.floor(Date.now()/1000)+120,
                                                    18,
                                                    ethers.utils.parseUnits("500"),
                                                    ethers.utils.parseUnits("50000"),
                                                    accounts[0]
                                                );

            await expect(receiver.connect(accounts[1]).setCallbackAddress(await accounts[1].getAddress()))
                    .to.be.revertedWith("Ownable: caller is not the owner");

        });

        it("Owner can set buy limit manager address", async function(){

            const {receiver,callbackDB,token} = await setupMockSale(
                                                    Math.floor(Date.now()/1000),
                                                    Math.floor(Date.now()/1000)+120,
                                                    18,
                                                    ethers.utils.parseUnits("500"),
                                                    ethers.utils.parseUnits("50000"),
                                                    accounts[0]
                                                );

            await receiver.connect(accounts[0]).setBuyLimitManagerAddress(await accounts[1].getAddress());

            expect(await receiver.buyLimitManager()).to.equal(await accounts[1].getAddress());

        });

        it("Non owner prevented from setting buy limit manager address", async function(){

            const {receiver,callbackDB,token} = await setupMockSale(
                                                    Math.floor(Date.now()/1000),
                                                    Math.floor(Date.now()/1000)+120,
                                                    18,
                                                    ethers.utils.parseUnits("500"),
                                                    ethers.utils.parseUnits("50000"),
                                                    accounts[0]
                                                );

            await expect(receiver.connect(accounts[1]).setBuyLimitManagerAddress(await accounts[1].getAddress()))
                    .to.be.revertedWith("Ownable: caller is not the owner");

        });

    });

        describe("Pricing", function(){

            it("Gives correct pricing for 18dp tokens", async function(){

                const {receiver,callbackDB,token,priceFeed} = await setupMockSale(
                    Math.floor(Date.now()/1000)-120,
                    Math.floor(Date.now()/1000)+120,
                    18,
                    ethers.utils.parseUnits("500"),
                    ethers.utils.parseUnits("50000"),
                    accounts[0]
                );

                //send 100 USD

                await token.mint(await accounts[1].getAddress(),ethers.utils.parseUnits("500"));
                await token.connect(accounts[1]).approve(receiver.address,ethers.constants.MaxUint256);

                //check "price" using oracle + off-chain calculation
                await receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("100"));
                //verify prices match
                const price = await priceFeed.latestAnswer();
                const decimals = await priceFeed.decimals();
                const amountPaymentToken = 
                ((ethers.utils.parseUnits("100")).mul((ethers.BigNumber.from("10")).pow(decimals))).
                div(price.mul((ethers.BigNumber.from("1"))));

                expect(amountPaymentToken.toString()).to.equal((await token.balanceOf(await accounts[0].getAddress())).toString());

            });

            it("Gives correct pricing for 6dp tokens", async function(){

                const {receiver,callbackDB,token,priceFeed} = await setupMockSale(
                    Math.floor(Date.now()/1000)-120,
                    Math.floor(Date.now()/1000)+120,
                    6,
                    ethers.utils.parseUnits("500"),
                    ethers.utils.parseUnits("50000"),
                    accounts[0]
                );

                //send 100 units
                await token.mint(await accounts[1].getAddress(),"5000000000");
                await token.connect(accounts[1]).approve(receiver.address,ethers.constants.MaxUint256);


                //check "price" using oracle + off-chain calculation
                //verify prices match

                //check "price" using oracle + off-chain calculation
                await receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("100"));
                //verify prices match
                const price = await priceFeed.latestAnswer();
                const decimals = await priceFeed.decimals();
                const amountPaymentToken = 
                ((ethers.utils.parseUnits("100")).mul((ethers.BigNumber.from("10")).pow(decimals))).
                div(price.mul((ethers.BigNumber.from("10").pow(ethers.BigNumber.from("12")))));

                expect(amountPaymentToken.toString()).to.equal((await token.balanceOf(await accounts[0].getAddress())).toString());;

            });

        });

        describe("Buy Limits", function(){

            it("Allows a single purchase under buy limit", async function(){

                const {receiver,callbackDB,token,priceFeed} = await setupMockSale(
                    Math.floor(Date.now()/1000)-120,
                    Math.floor(Date.now()/1000)+120,
                    18,
                    ethers.utils.parseUnits("500"),
                    ethers.utils.parseUnits("50000"),
                    accounts[0]
                );

                //send 100 USD

                await token.mint(await accounts[1].getAddress(),ethers.utils.parseUnits("1000"));
                await token.connect(accounts[1]).approve(receiver.address,ethers.constants.MaxUint256);

                await receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("100"));

                expect((await receiver.UserUsdWei(await accounts[1].getAddress())).toString()).
                to.equal((ethers.utils.parseUnits("100")).toString())

            });

            it("Allows mutltiple purchases under buy limit", async function(){

                const {receiver,callbackDB,token,priceFeed} = await setupMockSale(
                    Math.floor(Date.now()/1000)-120,
                    Math.floor(Date.now()/1000)+120,
                    18,
                    ethers.utils.parseUnits("500"),
                    ethers.utils.parseUnits("50000"),
                    accounts[0]
                );

                //send 100 USD

                await token.mint(await accounts[1].getAddress(),ethers.utils.parseUnits("1000"));
                await token.connect(accounts[1]).approve(receiver.address,ethers.constants.MaxUint256);

                await receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("100"));
                await receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("100"));

                expect((await receiver.UserUsdWei(await accounts[1].getAddress())).toString()).
                to.equal((ethers.utils.parseUnits("200")).toString())

            });

            it("Allows a single purchase at buy limit", async function(){

                const {receiver,callbackDB,token,priceFeed} = await setupMockSale(
                    Math.floor(Date.now()/1000)-120,
                    Math.floor(Date.now()/1000)+120,
                    18,
                    ethers.utils.parseUnits("500"),
                    ethers.utils.parseUnits("50000"),
                    accounts[0]
                );

                //send 100 USD

                await token.mint(await accounts[1].getAddress(),ethers.utils.parseUnits("1000"));
                await token.connect(accounts[1]).approve(receiver.address,ethers.constants.MaxUint256);

                await receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("500"));

                expect((await receiver.UserUsdWei(await accounts[1].getAddress())).toString()).
                to.equal((ethers.utils.parseUnits("500")).toString());

            });

            it("Allows a multiple purchases at buy limit", async function(){

                const {receiver,callbackDB,token,priceFeed} = await setupMockSale(
                    Math.floor(Date.now()/1000)-120,
                    Math.floor(Date.now()/1000)+120,
                    18,
                    ethers.utils.parseUnits("500"),
                    ethers.utils.parseUnits("50000"),
                    accounts[0]
                );

                //send 100 USD

                await token.mint(await accounts[1].getAddress(),ethers.utils.parseUnits("1000"));
                await token.connect(accounts[1]).approve(receiver.address,ethers.constants.MaxUint256);

                await receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("400"));
                await receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("100"));

                expect((await receiver.UserUsdWei(await accounts[1].getAddress())).toString()).
                to.equal((ethers.utils.parseUnits("500")).toString());

            });

            it("Prevents a single purchase above the buy limit", async function(){

                const {receiver,callbackDB,token,priceFeed} = await setupMockSale(
                    Math.floor(Date.now()/1000)-120,
                    Math.floor(Date.now()/1000)+120,
                    18,
                    ethers.utils.parseUnits("500"),
                    ethers.utils.parseUnits("50000"),
                    accounts[0]
                );

                //send 100 USD

                await token.mint(await accounts[1].getAddress(),ethers.utils.parseUnits("1000"));
                await token.connect(accounts[1]).approve(receiver.address,ethers.constants.MaxUint256);

                await expect(receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("550")))
                .to.be.revertedWith("error: requested deposit would cause total interval spend to exceed limit");

            });

            it("Prevents multiple purchases where the non-first would cos the limit to be exceeded", async function(){

                const {receiver,callbackDB,token,priceFeed} = await setupMockSale(
                    Math.floor(Date.now()/1000)-120,
                    Math.floor(Date.now()/1000)+120,
                    18,
                    ethers.utils.parseUnits("500"),
                    ethers.utils.parseUnits("50000"),
                    accounts[0]
                );

                //send 100 USD

                await token.mint(await accounts[1].getAddress(),ethers.utils.parseUnits("1000"));
                await token.connect(accounts[1]).approve(receiver.address,ethers.constants.MaxUint256);

                await receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("470"));

                await expect(receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("50")))
                .to.be.revertedWith("error: requested deposit would cause total interval spend to exceed limit");

            });

        });

        describe("Pausing / Ending of sale", async function(){

            it("Deposit call reverts if sale hasn't already started", async function(){

                const {receiver,callbackDB,token,priceFeed} = await setupMockSale(
                    Math.floor(Date.now()/1000)+120,
                    Math.floor(Date.now()/1000)+240,
                    18,
                    ethers.utils.parseUnits("500"),
                    ethers.utils.parseUnits("50000"),
                    accounts[0]
                );

                await token.mint(await accounts[1].getAddress(),ethers.utils.parseUnits("1000"));
                await token.connect(accounts[1]).approve(receiver.address,ethers.constants.MaxUint256);

                await expect(
                    receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("470"))
                ).to.be.revertedWith("HybridTokenSaleReceiver : Error : Sale has not started");

            });

            it("Deposit call reverts if sale has ended", async function(){

                const {receiver,callbackDB,token,priceFeed} = await setupMockSale(
                    Math.floor(Date.now()/1000)-120,
                    Math.floor(Date.now()/1000)-60,
                    18,
                    ethers.utils.parseUnits("500"),
                    ethers.utils.parseUnits("50000"),
                    accounts[0]
                );

                await token.mint(await accounts[1].getAddress(),ethers.utils.parseUnits("1000"));
                await token.connect(accounts[1]).approve(receiver.address,ethers.constants.MaxUint256);

                await expect(
                    receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("470"))
                ).to.be.revertedWith("HybridTokenSaleReceiver : Error : Sale has ended");

            });

            it("Deposit call reverts if contract is paused", async function(){

                const {receiver,callbackDB,token,priceFeed} = await setupMockSale(
                    Math.floor(Date.now()/1000)-120,
                    Math.floor(Date.now()/1000)+120,
                    18,
                    ethers.utils.parseUnits("500"),
                    ethers.utils.parseUnits("50000"),
                    accounts[0]
                );

                await receiver.setPauser(await accounts[0].getAddress(),true);
                await receiver.pause();

                await token.mint(await accounts[1].getAddress(),ethers.utils.parseUnits("1000"));
                await token.connect(accounts[1]).approve(receiver.address,ethers.constants.MaxUint256);

                await expect(
                    receiver.connect(accounts[1]).deposit(token.address,ethers.utils.parseUnits("470"))
                ).to.be.revertedWith("Pausable: paused");

            });

        });


    });
const { expect } = require("chai");
const { ethers } = require("hardhat");

//only authorised receiver contract can call callback
//new addresses are added to the list
//new addresses lead to lenCounter incrementing by 1
//amounts increment correctly
//max purchaseable limit not exceedable

let callbackDB;
let accounts;

describe("Callback Data Bridge", function(){
    
    beforeEach(async function(){
        accounts = await ethers.getSigners();
        const CallbackDB = await ethers.getContractFactory("CallbackDataBridge");
        callbackDB = await CallbackDB.deploy(
                await accounts[0].getAddress(),
                ethers.utils.parseUnits("1000000")
            );
        await callbackDB.deployed();
    });

    it("Allows authorised receiver contract to call callback", async function(){
        await callbackDB.callback(await accounts[1].getAddress(),"1000");
    });

    it("Prevents non-authorised accounts from calling callback", async function(){
        await expect(callbackDB.connect(accounts[1]).
                    callback(await accounts[0].getAddress(),"1000")).
                    to.be.revertedWith("Error : Callback : sender is not authorised");
    });

    it("New buyers are added to the buyers list", async function(){
        await callbackDB.callback(await accounts[1].getAddress(),"1000");
        await callbackDB.callback(await accounts[2].getAddress(),"1000");
        expect(await callbackDB.buyers(0)).to.equal(await accounts[1].getAddress());
        expect(await callbackDB.buyers(1)).to.equal(await accounts[2].getAddress());
    });

    it("New buyers cause the addressCounter to increment ", async function(){
        await callbackDB.callback(await accounts[1].getAddress(),"1000");
        await callbackDB.callback(await accounts[2].getAddress(),"1000");
        expect(await callbackDB.addressCounter()).to.equal(2);
    });

    it("Repeat buyers aren't added to the buyers list multiple times", async function(){
        await callbackDB.callback(await accounts[1].getAddress(),"1000");
        await callbackDB.callback(await accounts[1].getAddress(),"1000");
        expect(await callbackDB.buyers(0)).to.equal(await accounts[1].getAddress());
        await expect(callbackDB.buyers(1)).to.be.revertedWith("");
    });

    it("Repeat buyers don't lead to the increment of addressCounter", async function(){
        await callbackDB.callback(await accounts[1].getAddress(),"1000");
        await callbackDB.callback(await accounts[1].getAddress(),"1000");
        expect(await callbackDB.addressCounter()).to.equal(1);
    });

    it("Purchases correctly increase addressPurchase mapping", async function(){
        await callbackDB.callback(await accounts[1].getAddress(),"1000");
        const r0 = await callbackDB.addressPurchase(await accounts[1].getAddress());
        await callbackDB.callback(await accounts[1].getAddress(),"1000");
        const r1 = await callbackDB.addressPurchase(await accounts[1].getAddress());
        expect(r0.toString()).to.equal("1000");
        expect(r1.toString()).to.equal("2000");
    });

    it("Purchases fail when they would cause totalPurchased to exceed maxPurchasable", async function(){
        await callbackDB.callback(await accounts[1].getAddress(),"1000");
        await expect(
            callbackDB.callback(await accounts[2].getAddress(),ethers.utils.parseUnits("1000000"))
        ).to.be.revertedWith("CallbackDataBridge : Error : maxPurchasable would be exceeded");
    });

});
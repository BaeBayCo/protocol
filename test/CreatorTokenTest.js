const { expect } = require("chai");
const { ethers } = require("hardhat");

//constructor
// - treasury address receives correct amount of funds
// - ensure token is paused

//burn
// - owner can burn
// - non-owner cannot call burn

// Sales Tax
// - owner can set Dumping address
// - non-owner cannot set dumping address
// - owner can set treasury address
// - non-owner cannot set treasury address
// - burn and transfer occur
// - burn amount is correct
// - transfer amount is correct
// - dumping addresses can be changed/added

//tribute manager
// - owner can set tributeManager
// - non-owner cannot set tributeManager
// - verify tribute code runs (count increases only when dumping address is receiver)

let token;
let tributeManager;
let accounts;

describe("Creator Token",async function(){
    
    beforeEach(async function(){
        accounts = await ethers.getSigners();
        
        const Token = await ethers.getContractFactory("ERC20CreatorToken");
        token = await Token.deploy("Test","TEST",
                                    await accounts[1].getAddress(),
                                    ethers.utils.parseUnits("1000000"),
                                    "100",
                                    "100");

        const TributeManager = await ethers.getContractFactory("TributeCounter");
        tributeManager = await TributeManager.deploy();

    });

    describe("Constructor", function(){
        
        it("Mints correct amount to recipient", async function(){
            expect(await token.balanceOf(await accounts[1].getAddress())).
            to.equal(ethers.utils.parseUnits("1000000"));
        });

        it("Pauses token", async function(){
            expect(await token.paused()).to.equal(true);
        });

    });

    describe("Owner burn", function(){

        it("Allows contract owner to call burn", async function(){
            await token.setPauser(await accounts[0].getAddress(),true);
            await token.unpause();
            await token.connect(accounts[1]).transfer(
                await accounts[0].getAddress(),ethers.utils.parseUnits("10000"));
            await token.burn(ethers.utils.parseUnits("10000"));
        });

        it("Burns the correct amount", async function(){
            await token.setPauser(await accounts[0].getAddress(),true);
            await token.unpause();
            await token.connect(accounts[1]).transfer(
                await accounts[0].getAddress(),ethers.utils.parseUnits("10000"));
            await token.burn(ethers.utils.parseUnits("1000"));
            expect(token.balanceOf(await accounts[0].getAddress()).toString())
        });

        it("Prevents non contract owner from calling burn", async function(){
            await expect(token.connect(accounts[1]).burn(ethers.utils.parseUnits("1000"))).
            to.be.revertedWith("Ownable: caller is not the owner");
        });

    });

    describe("Sales Tax", function(){

        it("Allows owner to set dumping address",async function(){
            await token.setDumpingAddress(await accounts[3].getAddress(), true);
            expect(await token.isDumpingAddress(await accounts[3].getAddress())).to.equal(true);
        });

        it("Prevents non-owner from setting dumping address",async function(){
            await expect(
                token.connect(accounts[1]).
                    setDumpingAddress(await accounts[3].getAddress(),true)
                    ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Allows owner to set treasury address",async function(){
            await token.setTreasury(await accounts[2].getAddress());
            expect(await token.treasury()).to.equal(await accounts[2].getAddress());
        });

        it("Prevents non-owner from setting treasury address",async function(){
            await expect(
                token.connect(accounts[1]).
                    setTreasury(await accounts[3].getAddress())
                    ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Transfers to 'normal' addresses deliver full value ",async function(){
            await token.setDumpingAddress(await accounts[3].getAddress(), true);
            await token.setPauser(await accounts[0].getAddress(),true);
            await token.unpause();
            await token.connect(accounts[1]).transfer(
                await accounts[0].getAddress(),ethers.utils.parseUnits("10000"));
            expect(
                (await token.balanceOf(await accounts[0].getAddress())).toString()).
                to.equal((ethers.utils.parseUnits("10000")).toString());
        });

        it("Correct amount is burned when transfer is to dumping address",async function(){
            await token.setDumpingAddress(await accounts[3].getAddress(), true);
            await token.setPauser(await accounts[0].getAddress(),true);
            await token.setTreasury(await accounts[0].getAddress());
            await token.unpause();
            await token.connect(accounts[1]).transfer(
                await accounts[3].getAddress(),ethers.utils.parseUnits("10000"));
            expect(
                (await token.balanceOf(await accounts[0].getAddress())).toString()).
                to.equal((ethers.utils.parseUnits("100")).toString());
        });

        it("Correct amount is transferred to treasury address",async function(){
            await token.setDumpingAddress(await accounts[3].getAddress(), true);
            await token.setPauser(await accounts[0].getAddress(),true);
            await token.unpause();
            await token.connect(accounts[1]).transfer(
                await accounts[3].getAddress(),ethers.utils.parseUnits("1000000"));
            expect(
                (await token.totalSupply()).toString()).
                to.equal((ethers.utils.parseUnits("990000")).toString());
        });

        it("Multiple dumping addresses are supported simultaneously",async function(){
            await token.setDumpingAddress(await accounts[3].getAddress(), true);
            await token.setDumpingAddress(await accounts[4].getAddress(), true);
            await token.setPauser(await accounts[0].getAddress(),true);
            await token.setTreasury(await accounts[0].getAddress());
            await token.unpause();
            await token.connect(accounts[1]).transfer(
                await accounts[3].getAddress(),ethers.utils.parseUnits("10000"));
            const b0 = (await token.balanceOf(await accounts[0].getAddress())).toString();
            await token.connect(accounts[1]).transfer(
                await accounts[4].getAddress(),ethers.utils.parseUnits("10000"));
            const b1 = (await token.balanceOf(await accounts[0].getAddress())).toString();
            expect(b0).to.equal((ethers.utils.parseUnits("100")).toString());
            expect(b1).to.equal((ethers.utils.parseUnits("200")).toString());
        });

        it("Dumping addresses can be removed",async function(){
            await token.setDumpingAddress(await accounts[3].getAddress(), true);
            await token.setPauser(await accounts[0].getAddress(),true);
            await token.setTreasury(await accounts[0].getAddress());
            await token.unpause();
            await token.connect(accounts[1]).transfer(
                await accounts[3].getAddress(),ethers.utils.parseUnits("10000"));
            const b0 = (await token.balanceOf(await accounts[0].getAddress())).toString();
            await token.setDumpingAddress(await accounts[3].getAddress(), false);
            await token.connect(accounts[1]).transfer(
                await accounts[3].getAddress(),ethers.utils.parseUnits("10000"));
            const b1 = (await token.balanceOf(await accounts[0].getAddress())).toString();
            expect(b0).to.equal((ethers.utils.parseUnits("100")).toString());
            expect(b1).to.equal((ethers.utils.parseUnits("100")).toString());
        });

        it("Treasury address 'ignored' as dumping address ",async function(){
            await token.setDumpingAddress(await accounts[2].getAddress(), true);
            await token.setTreasury(await accounts[2].getAddress());
            await token.setPauser(await accounts[0].getAddress(),true);
            await token.unpause();
            await token.connect(accounts[1]).transfer(
                await accounts[2].getAddress(),ethers.utils.parseUnits("10000"));
            expect(
                (await token.balanceOf(await accounts[2].getAddress())).toString()).
                to.equal((ethers.utils.parseUnits("10000")).toString());
        });

        it("Allows owner to set tribute manager", async function(){
            await token.setTributeManager(tributeManager.address);
            expect(await token.tributeManager()).to.equal(tributeManager.address);
        });

        it("Prevents non-owner from setting tribute manager", async function(){
            await expect(
                token.connect(accounts[1]).
                    setTributeManager(tributeManager.address)
                    ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Transfers to 'normal' addresses don't trigger the tribute function", async function(){
            await tributeManager.doTribute();
            await token.setTributeManager(tributeManager.address);
            await token.setDumpingAddress(await accounts[3].getAddress(), true);
            await token.setPauser(await accounts[0].getAddress(),true);
            await token.unpause();
            await token.connect(accounts[1]).transfer(
                await accounts[2].getAddress(),ethers.utils.parseUnits("10000"));
            expect((await tributeManager.count()).toString()).to.equal("1");
        });

        it("Transfers to dumping addresses trigger the tribute function", async function(){
            await tributeManager.doTribute();
            await token.setTributeManager(tributeManager.address);
            await token.setDumpingAddress(await accounts[3].getAddress(), true);
            await token.setPauser(await accounts[0].getAddress(),true);
            await token.unpause();
            await token.connect(accounts[1]).transfer(
                await accounts[3].getAddress(),ethers.utils.parseUnits("10000"));
            expect((await tributeManager.count()).toString()).to.equal("2");
        });

    });

});
const { expect } = require("chai");
const { ethers } = require("hardhat");

let tokenA;
let tokenB;
let tokenC;
let accounts;

describe("Swap Exit ", function(){


    beforeEach(async function(){

        accounts = await ethers.getSigners();

        const Token = await ethers.getContractFactory("MockPaymentToken");

        tokenA = await Token.deploy("A","A",18);
        await tokenA.deployed();

        tokenB = await Token.deploy("B","B",18);
        await tokenB.deployed();

        tokenC = await Token.deploy("C","C",18);
        await tokenC.deployed();

    });

    describe("Swaps", function(){

        it("The user receives the correct amount of tokens when num < denom", async function(){
            
            const SwapExit = await ethers.getContractFactory("SwapExit");

            const swapExit = await SwapExit.deploy(
                tokenA.address,
                tokenB.address,
                Math.floor(Date.now()/1000)+120,
                1,
                100
            );

            await swapExit.deployed();

            await tokenB.mint(swapExit.address,ethers.utils.parseUnits("1000"));

            await tokenA.mint(await accounts[1].getAddress(), ethers.utils.parseUnits("1000"));

            await tokenA.connect(accounts[1]).approve(swapExit.address, ethers.utils.parseUnits("1000"));

            await swapExit.connect(accounts[1]).swap(ethers.utils.parseUnits("100"));

            expect((await tokenB.balanceOf(await accounts[1].getAddress())).eq(ethers.utils.parseUnits("1"))).to.equal(true);
        
        });

        it("The user receives the correct amount of tokens when num > denom", async function(){
            
            const SwapExit = await ethers.getContractFactory("SwapExit");

            const swapExit = await SwapExit.deploy(
                tokenA.address,
                tokenB.address,
                Math.floor(Date.now()/1000)+120,
                100,
                1
            );

            await swapExit.deployed();

            await tokenB.mint(swapExit.address,ethers.utils.parseUnits("1000"));

            await tokenA.mint(await accounts[1].getAddress(), ethers.utils.parseUnits("1000"));

            await tokenA.connect(accounts[1]).approve(swapExit.address, ethers.utils.parseUnits("1000"));

            await swapExit.connect(accounts[1]).swap(ethers.utils.parseUnits("1"));

            expect((await tokenB.balanceOf(await accounts[1].getAddress())).eq(ethers.utils.parseUnits("100"))).to.equal(true);
        
        });

        it("Correct amount is taken from user's account ", async function(){
            
            const SwapExit = await ethers.getContractFactory("SwapExit");

            const swapExit = await SwapExit.deploy(
                tokenA.address,
                tokenB.address,
                Math.floor(Date.now()/1000)+120,
                1,
                100
            );

            await swapExit.deployed();

            await tokenB.mint(swapExit.address,ethers.utils.parseUnits("1000"));

            await tokenA.mint(await accounts[1].getAddress(), ethers.utils.parseUnits("1000"));

            await tokenA.connect(accounts[1]).approve(swapExit.address, ethers.utils.parseUnits("1000"));

            await swapExit.connect(accounts[1]).swap(ethers.utils.parseUnits("100"));

            expect((await tokenA.balanceOf(await accounts[1].getAddress())).eq(ethers.utils.parseUnits("900"))).to.equal(true);
        
        });

        it("Does not allow swaps after expiry time", async function(){

            const SwapExit = await ethers.getContractFactory("SwapExit");

            const swapExit = await SwapExit.deploy(
                tokenA.address,
                tokenB.address,
                Math.floor(Date.now()/1000)-120,
                1,
                100
            );

            await swapExit.deployed();

            await tokenB.mint(swapExit.address,ethers.utils.parseUnits("1000"));

            await tokenA.mint(await accounts[1].getAddress(), ethers.utils.parseUnits("1000"));

            await tokenA.connect(accounts[1]).approve(swapExit.address, ethers.utils.parseUnits("1000"));

            await expect(swapExit.connect(accounts[1]).swap(ethers.utils.parseUnits("100"))).to.be.revertedWith("SwapExit : Error : Swap period has ended");

        });



    });

    describe("Owner asset claim", function(){

        it("Does not allow owner to withdraw any asset before expiry", async function(){

            const SwapExit = await ethers.getContractFactory("SwapExit");

            const swapExit = await SwapExit.deploy(
                tokenA.address,
                tokenB.address,
                Math.floor(Date.now()/1000)+120,
                1,
                100
            );

            await swapExit.deployed();

            await tokenC.mint(swapExit.address,ethers.utils.parseUnits("1000"));

            await tokenB.mint(swapExit.address,ethers.utils.parseUnits("1000"));

            await tokenA.mint(swapExit.address, ethers.utils.parseUnits("1000"));

            await expect(swapExit.ownerClaim(tokenC.address)).to.be.revertedWith("SwapExit : Error : Swap period has not ended yet");
            await expect(swapExit.ownerClaim(tokenB.address)).to.be.revertedWith("SwapExit : Error : Swap period has not ended yet");
            await expect(swapExit.ownerClaim(tokenA.address)).to.be.revertedWith("SwapExit : Error : Swap period has not ended yet");

        });

        it("Allows owner to withdraw any asset before expiry", async function(){

            const SwapExit = await ethers.getContractFactory("SwapExit");

            const swapExit = await SwapExit.deploy(
                tokenA.address,
                tokenB.address,
                Math.floor(Date.now()/1000)-120,
                1,
                100
            );

            await swapExit.deployed();

            await tokenC.mint(swapExit.address,ethers.utils.parseUnits("1000"));

            await tokenB.mint(swapExit.address,ethers.utils.parseUnits("1000"));

            await tokenA.mint(swapExit.address, ethers.utils.parseUnits("1000"));

            await swapExit.ownerClaim(tokenC.address);
            await swapExit.ownerClaim(tokenB.address);
            await swapExit.ownerClaim(tokenA.address);

            expect((await tokenA.balanceOf(await accounts[0].getAddress())).eq(ethers.utils.parseUnits("1000"))).to.equal(true);
            expect((await tokenB.balanceOf(await accounts[0].getAddress())).eq(ethers.utils.parseUnits("1000"))).to.equal(true);
            expect((await tokenC.balanceOf(await accounts[0].getAddress())).eq(ethers.utils.parseUnits("1000"))).to.equal(true);

        });

    })




})



//setup token A,B,C
//deploy contract with A => B

//where num > denom and where denom > num

//allows withdrawal of all tokens by owner, post expiry (even token C)
//doesn't allow owner withdrawal until after deadline

//allows swaps up to deadline
//doesn't allow swaps post deadline

//correct swap ratio
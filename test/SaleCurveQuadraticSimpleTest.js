const { expect } = require("chai");
const { ethers } = require("hardhat");


async function createTokensAndCurve(multiple,saleLimit,creatorShareBP,endTime,a){
    const accounts = await ethers.getSigners();
    const account1Address = await accounts[1].getAddress();
    const CreatorToken = await ethers.getContractFactory("ERC20CreatorToken");
    const SaleCurve = await ethers.getContractFactory("SaleCurveQuadraticSimple")

    const _saleToken = await CreatorToken.deploy("SaleToken","SALE");
    await _saleToken.deployed();

    //stop gap solution for testing is to mint infinity tokens to the signer address
    const _paymentToken = await CreatorToken.deploy("PayToken","PAY");
    await _paymentToken.deployed();
    await _paymentToken.mint(account1Address,ethers.constants.MaxUint256);
    await _paymentToken.unpause();

    const _saleCurve = await SaleCurve.deploy(multiple,saleLimit,creatorShareBP,endTime,a,_saleToken.address,_paymentToken.address);
    await _saleCurve.deployed();
    await _saleToken.transferOwnership(_saleCurve.address);
    await _paymentToken.connect(accounts[1]).approve(_saleCurve.address,ethers.constants.MaxUint256);

    return {paymentToken:_paymentToken,saleToken:_saleToken,saleCurve:_saleCurve}
}

describe("Simple Quadratic Sale Curve", function(){

    describe("a = 1, multiple = 1 wei", function(){

        it("charges the right price for the first unit sold", async function(){

            const accounts = await ethers.getSigners();
            const account0Address = await accounts[0].getAddress();
            const account1Address = await accounts[1].getAddress();

            const {paymentToken,saleToken,saleCurve} = await createTokensAndCurve(
                    "1",
                    "1000",
                    "1000",
                    Math.floor(Date.now()/1000)+120,
                    "1"
                );
            
            await saleCurve.connect(accounts[1]).buy("1","1000",account1Address);

            const saleTokenBalance = await saleToken.balanceOf(account1Address);

            const paymentTokenBalance = await paymentToken.balanceOf(account0Address);

            expect(saleTokenBalance.toString()).to.equal("1");
            expect(paymentTokenBalance.toString()).to.equal("1");

        });

        it("Charges the right price for a the first purchase (multiple/10 token purchase)", async function(){

            const accounts = await ethers.getSigners();
            const account0Address = await accounts[0].getAddress();
            const account1Address = await accounts[1].getAddress();

            const {paymentToken,saleToken,saleCurve} = await createTokensAndCurve(
                    "1",
                    "1000",
                    "1000",
                    Math.floor(Date.now()/1000)+120,
                    "1"
                );
            
            await saleCurve.connect(accounts[1]).buy("10","1000",account1Address);

            const saleTokenBalance = await saleToken.balanceOf(account1Address);

            const paymentTokenBalance = await paymentToken.balanceOf(account0Address);

            expect(saleTokenBalance.toString()).to.equal("10");
            expect(paymentTokenBalance.toString()).to.equal("385");

        });

        it("Charges the right price for single unit sales when previous sales have already been made", async function(){

            const accounts = await ethers.getSigners();
            const account0Address = await accounts[0].getAddress();
            const account1Address = await accounts[1].getAddress();
            const account2Address = await accounts[2].getAddress();

            const {paymentToken,saleToken,saleCurve} = await createTokensAndCurve(
                    "1",
                    "1000",
                    "1000",
                    Math.floor(Date.now()/1000)+120,
                    "1"
                );
            
            await saleCurve.connect(accounts[1]).buy("10","1000",account1Address);
            const paymentTokenBalance0 = await paymentToken.balanceOf(account0Address);

            await saleCurve.connect(accounts[1]).buy("1","1000",account2Address);
            const paymentTokenBalance1 = await paymentToken.balanceOf(account0Address);

            const saleTokenBalance = await saleToken.balanceOf(account2Address);

            

            expect(saleTokenBalance.toString()).to.equal("1");
            expect((paymentTokenBalance1.sub(paymentTokenBalance0)).toString()).to.equal("121");

        });

        it("Reverts when users tries to buy more tokens than available", async function(){
            const accounts = await ethers.getSigners();
            const account0Address = await accounts[0].getAddress();
            const account1Address = await accounts[1].getAddress();

            const {paymentToken,saleToken,saleCurve} = await createTokensAndCurve(
                "1",
                "1000",
                "1000",
                Math.floor(Date.now()/1000)+120,
                "1"
            );

            await saleCurve.connect(accounts[1]).buy("10","1000",account0Address);
            await expect(saleCurve.buy("1000","1000000000",account1Address)).to.be.
                revertedWith("Error : Not enough tokens remain to complete sale");
        });

    });

    describe("a = 2e18, multiple = 1e18", function(){

        it("charges the right price for the first unit sold", async function(){

            const accounts = await ethers.getSigners();
            const account0Address = await accounts[0].getAddress();
            const account1Address = await accounts[1].getAddress();

            const {paymentToken,saleToken,saleCurve} = await createTokensAndCurve(
                ethers.utils.parseUnits("1"),
                ethers.utils.parseUnits("1000000"),
                "1000",
                Math.floor(Date.now()/1000)+120,
                ethers.utils.parseUnits("2")
            );
            
            await saleCurve.connect(accounts[1]).buy(ethers.utils.parseUnits("1"),ethers.utils.parseUnits("1000"),account1Address);

            const saleTokenBalance = await saleToken.balanceOf(account1Address);

            const paymentTokenBalance = await paymentToken.balanceOf(account0Address);

            expect(saleTokenBalance.toString()).to.equal(ethers.utils.parseUnits("1"));
            expect(paymentTokenBalance.toString()).to.equal(ethers.utils.parseUnits("2"));

        });

        it("Charges the right price for a the first purchase (multiple/10 token purchase)", async function(){

            const accounts = await ethers.getSigners();
            const account0Address = await accounts[0].getAddress();
            const account1Address = await accounts[1].getAddress();

            const {paymentToken,saleToken,saleCurve} = await createTokensAndCurve(
                ethers.utils.parseUnits("1"),
                ethers.utils.parseUnits("1000000"),
                ethers.utils.parseUnits("1000000"),
                ethers.utils.parseUnits("2")
            );
            await saleCurve.connect(accounts[1]).buy(ethers.utils.parseUnits("10"),ethers.utils.parseUnits("1000"),account1Address);

            const saleTokenBalance = await saleToken.balanceOf(account1Address);

            const paymentTokenBalance = await paymentToken.balanceOf(account0Address);

            expect(saleTokenBalance.toString()).to.equal(ethers.utils.parseUnits("10"));
            expect(paymentTokenBalance.toString()).to.equal(ethers.utils.parseUnits("770"));

        });

        it("Charges the right price for single unit sales when previous sales have already been made", async function(){

            const accounts = await ethers.getSigners();
            const account0Address = await accounts[0].getAddress();
            const account1Address = await accounts[1].getAddress();

            const {paymentToken,saleToken,saleCurve} = await createTokensAndCurve(
                ethers.utils.parseUnits("1"),
                ethers.utils.parseUnits("1000000"),
                ethers.utils.parseUnits("1000000"),
                ethers.utils.parseUnits("2")
            );

            await saleCurve.buy(ethers.utils.parseUnits("10"),ethers.utils.parseUnits("1000"),account0Address);
            await saleCurve.withdraw();
            await saleCurve.buy(ethers.utils.parseUnits("1"),ethers.utils.parseUnits("1000"),account1Address)

            const saleTokenBalance = await saleToken.balanceOf(account1Address);

            const paymentTokenBalance = await paymentToken.balanceOf(saleCurve.address);

            expect(saleTokenBalance.toString()).to.equal(ethers.utils.parseUnits("1"));
            expect(paymentTokenBalance.toString()).to.equal(ethers.utils.parseUnits("242"));

        });

        it("Reverts when users tries to buy more tokens than available", async function(){
            const accounts = await ethers.getSigners();
            const account0Address = await accounts[0].getAddress();
            const account1Address = await accounts[1].getAddress();

            const {paymentToken,saleToken,saleCurve} = await createTokensAndCurve(
                ethers.utils.parseUnits("1"),
                ethers.utils.parseUnits("1000000"),
                ethers.utils.parseUnits("1000000"),
                ethers.utils.parseUnits("2")
            );

            await saleCurve.buy(ethers.utils.parseUnits("10"),ethers.utils.parseUnits("1000"),account0Address);
            await expect(saleCurve.buy(ethers.utils.parseUnits("10000000000000000000000"),ethers.utils.parseUnits("100000000000000000000000000"),account1Address)).to.be.
                revertedWith("Error : Not enough tokens remain to complete sale");
        });

    })

    //setup with a = 1
    //setup with a = NON ONE
    //multiple of 1 wei
    //multiple of 1e18

    //create 2 tokens
    //buy 1 token multiple
    //try to buy 1.5 token multiples
    //try to buy when all units have been sold
    //try to buy multiple units
    //try to buy multiple units where the amount is too high, but N - 1 would work
    //try to buy all tokens at once
    //try to buy less than one unit

    //test from beginning of sale
    //test conditions when has already commenced
    
    //test withdraw

    //2

})
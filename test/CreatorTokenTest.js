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

        describe("Setting of addresses", function(){

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

            it("Dumping addresses can be removed",async function(){
                await token.setDumpingAddress(await accounts[3].getAddress(), true);
                await token.setPauser(await accounts[0].getAddress(),true);
                await token.setTreasury(await accounts[0].getAddress());
                await token.unpause();
                await token.connect(accounts[1]).transfer(
                    await accounts[3].getAddress(),ethers.utils.parseUnits("10000"));
                const b0 = await token.balanceOf(await accounts[0].getAddress());
                await token.setDumpingAddress(await accounts[3].getAddress(), false);
                await token.connect(accounts[1]).transfer(
                    await accounts[3].getAddress(),ethers.utils.parseUnits("10000"));
                const b1 = await token.balanceOf(await accounts[0].getAddress());
                expect(b0.eq(b1)).to.equal(true);
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
    
            it("Prevents the setting of a tribute manager that doesn't implement ITributeManager", async function(){
                await expect(
                    token.setTributeManager(await accounts[2].getAddress())
                        ).to.be.revertedWith("");
            });
    
            it("Prevents non-owner from setting tribute manager", async function(){
                await expect(
                    token.connect(accounts[1]).
                        setTributeManager(tributeManager.address)
                        ).to.be.revertedWith("Ownable: caller is not the owner");
            });

        });

        describe("Triggering of sales tax logic", function(){

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

                expect((((await token.balanceOf(await accounts[0].getAddress())).sub(ethers.utils.parseUnits("100"))).abs())
                .lt(ethers.BigNumber.from("10"))).to.equal(true);

            });
    
            it("Correct amount is transferred to treasury address when transfer is to dumping address",async function(){
                await token.setDumpingAddress(await accounts[3].getAddress(), true);
                await token.setPauser(await accounts[0].getAddress(),true);
                await token.unpause();
                await token.connect(accounts[1]).transfer(
                    await accounts[3].getAddress(),ethers.utils.parseUnits("1000000"));
                expect(
                    (await token.totalSupply()).toString()).
                    to.equal((ethers.utils.parseUnits("990000")).toString());
            });

            it("Transfer to dumping addresses trigger reflections", async function(){

                await token.setDumpingAddress(await accounts[3].getAddress(), true);
                await token.setPauser(await accounts[0].getAddress(),true);
                await token.unpause();

                await token.connect(accounts[1]).transfer(
                    await accounts[2].getAddress(),ethers.utils.parseUnits("100000"));

                await token.connect(accounts[1]).transfer(
                    await accounts[3].getAddress(),ethers.utils.parseUnits("100000"));

                expect((await token.balanceOf(await accounts[2].getAddress())).toString()).
                to.equal("100100200400801603206412");
                
                
            });
    
            it("Multiple dumping addresses are supported simultaneously",async function(){
                await token.setDumpingAddress(await accounts[3].getAddress(), true);
                await token.setDumpingAddress(await accounts[4].getAddress(), true);
                await token.setPauser(await accounts[0].getAddress(),true);
                await token.setTreasury(await accounts[0].getAddress());
                await token.unpause();
                await token.connect(accounts[1]).transfer(
                    await accounts[3].getAddress(),ethers.utils.parseUnits("10000"));
                const b0 = (await token.balanceOf(await accounts[0].getAddress()));
                await token.connect(accounts[1]).transfer(
                    await accounts[4].getAddress(),ethers.utils.parseUnits("10000"));
                const b1 = (await token.balanceOf(await accounts[0].getAddress()));

                console.log("b0 to string " + b0);
                console.log("b1 to string " + b1);

                expect(((b1.sub(b0)).sub(ethers.utils.parseUnits("1"))).gte(ethers.BigNumber.from("0")))
                .to.equal(true);

            });
    
            it("Transfers to 'normal' addresses don't trigger the tribute function", async function(){
                await tributeManager.doTribute();
                await token.setTributeManager(tributeManager.address);
                await token.setDumpingAddress(await accounts[3].getAddress(), true);
                await token.setPauser(await accounts[0].getAddress(),true);
                await token.unpause();
                await token.connect(accounts[1]).transfer(
                    await accounts[2].getAddress(),ethers.utils.parseUnits("10000"));
                expect((await tributeManager.count()).toString()).to.equal("2");
            });
    
            it("Transfers to dumping addresses trigger the tribute function", async function(){
                await tributeManager.doTribute();
                await token.setTributeManager(tributeManager.address);
                await token.setDumpingAddress(await accounts[3].getAddress(), true);
                await token.setPauser(await accounts[0].getAddress(),true);
                await token.unpause();
                await token.connect(accounts[1]).transfer(
                    await accounts[3].getAddress(),ethers.utils.parseUnits("10000"));
                expect((await tributeManager.count()).toString()).to.equal("3");
            });

        });

        describe("Reflect method", function(){

            it("reflect method increase balances of all users by correct ratio", async function(){
                await token.setPauser(await accounts[0].getAddress(),true);
                await token.unpause(); 
                await token.connect(accounts[1]).transfer(await accounts[2].getAddress(),
                                                          ethers.utils.parseUnits("100000"));
                await token.connect(accounts[1]).transfer(await accounts[3].getAddress(),
                                                          ethers.utils.parseUnits("100000"));
                await token.connect(accounts[1]).transfer(await accounts[4].getAddress(),
                                                          ethers.utils.parseUnits("100000"));
                await token.connect(accounts[1]).transfer(await accounts[5].getAddress(),
                                                          ethers.utils.parseUnits("100000"));
                await token.connect(accounts[1]).transfer(await accounts[6].getAddress(),
                                                          ethers.utils.parseUnits("100000"));
                await token.transferOwnership(await accounts[1].getAddress());
                await token.connect(accounts[1]).reflect(ethers.utils.parseUnits("500000"));
                expect((await token.balanceOf(await accounts[2].getAddress())).toString()).to.
                equal((ethers.utils.parseUnits("200000")).toString());
                expect((await token.balanceOf(await accounts[3].getAddress())).toString()).to.
                equal((ethers.utils.parseUnits("200000")).toString());
                expect((await token.balanceOf(await accounts[4].getAddress())).toString()).to.
                equal((ethers.utils.parseUnits("200000")).toString());
                expect((await token.balanceOf(await accounts[5].getAddress())).toString()).to.
                equal((ethers.utils.parseUnits("200000")).toString());
                expect((await token.balanceOf(await accounts[6].getAddress())).toString()).to.
                equal((ethers.utils.parseUnits("200000")).toString());
            });

            it("Transfers occur correctly post reflection", async function(){
                await token.setPauser(await accounts[0].getAddress(),true);
                await token.unpause(); 
                await token.connect(accounts[1]).transfer(await accounts[2].getAddress(),
                                                          ethers.utils.parseUnits("100000"));
                await token.connect(accounts[1]).transfer(await accounts[3].getAddress(),
                                                          ethers.utils.parseUnits("100000"));
                await token.connect(accounts[1]).transfer(await accounts[4].getAddress(),
                                                          ethers.utils.parseUnits("100000"));
                await token.connect(accounts[1]).transfer(await accounts[5].getAddress(),
                                                          ethers.utils.parseUnits("100000"));
                await token.connect(accounts[1]).transfer(await accounts[6].getAddress(),
                                                          ethers.utils.parseUnits("100000"));
                await token.transferOwnership(await accounts[1].getAddress());
                await token.connect(accounts[1]).reflect(ethers.utils.parseUnits("500000"));
                await token.connect(accounts[2]).transfer(await accounts[3].getAddress(),ethers.utils.parseUnits("100000"));
                expect((await token.balanceOf(await accounts[3].getAddress())).toString()).to.
                equal((ethers.utils.parseUnits("300000")).toString());
                expect((await token.balanceOf(await accounts[2].getAddress())).toString()).to.
                equal((ethers.utils.parseUnits("100000")).toString());
            })

        });

        

    });

});
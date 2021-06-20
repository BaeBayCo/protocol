const { expect } = require("chai");
const { ethers } = require("hardhat");

let accounts;
let bbw;
let crnft;

describe("Token Gated Buy Limit Manager Test", function(){

    beforeEach(async function(){

        accounts = await ethers.getSigners();
        
        await await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x617c54C654e3dA2a65c91D2Dff9164c32c407097"]}
          );

        bbw = await ethers.provider.getSigner("0x617c54C654e3dA2a65c91D2Dff9164c32c407097");

        crnft = await ethers.getContractAt("IERC1155","0x34F16273C250d30C9de5356f54c08C5E7f22de5d");

        await crnft.connect(bbw).safeTransferFrom("0x617c54C654e3dA2a65c91D2Dff9164c32c407097",
                                            await accounts[1].getAddress(),
                                            "83",
                                            "10",
                                            "0x"
                                            );

    })

    it("Allows ID limit to be set by owner", async function(){

        const TGBL = await ethers.getContractFactory("TokenGatedBuyLimitManager");
        const tgbl = await TGBL.deploy(crnft.address,Math.floor(Date.now()/1000)+120);

        await tgbl.setIdBuyLimit("83",ethers.utils.parseUnits("500"));

        expect((await tgbl.idBuyLimit(83)).toString()).
        to.equal(ethers.utils.parseUnits("500"))

    });

    it("Prevents ID limit from being set by non-owner", async function(){

        const TGBL = await ethers.getContractFactory("TokenGatedBuyLimitManager");
        const tgbl = await TGBL.deploy(crnft.address,Math.floor(Date.now()/1000)+120);

        await expect(tgbl.connect(bbw).setIdBuyLimit("83",ethers.utils.parseUnits("500"))).
        to.be.revertedWith("Ownable: caller is not the owner");

    });

    it("Prevents ID limit from being set twice", async function(){

        const TGBL = await ethers.getContractFactory("TokenGatedBuyLimitManager");
        const tgbl = await TGBL.deploy(crnft.address,Math.floor(Date.now()/1000)+120);

        await tgbl.setIdBuyLimit("83",ethers.utils.parseUnits("500"));

        await expect(tgbl.setIdBuyLimit("83",ethers.utils.parseUnits("5000"))).
        to.be.revertedWith("Error : tokenGatedBuyLimitManager : idBuyLimit already set");

    });

    it("NFTs escrowed are successfully transferred to the contract", async function(){

        const TGBL = await ethers.getContractFactory("TokenGatedBuyLimitManager");
        const tgbl = await TGBL.deploy(crnft.address,Math.floor(Date.now()/1000)+120);

        await tgbl.setIdBuyLimit("83",ethers.utils.parseUnits("500"));

        await crnft.connect(accounts[1]).setApprovalForAll(tgbl.address,true);

        await tgbl.connect(accounts[1]).escrowTokens("83","1");

        expect((await crnft.balanceOf(tgbl.address,"83")).toString()).to.equal("1");

    });

    it("Increments buy limit correctly for single NFT", async function(){

        const TGBL = await ethers.getContractFactory("TokenGatedBuyLimitManager");
        const tgbl = await TGBL.deploy(crnft.address,Math.floor(Date.now()/1000)+120);

        await tgbl.setIdBuyLimit("83",ethers.utils.parseUnits("500"));

        await crnft.connect(accounts[1]).setApprovalForAll(tgbl.address,true);

        await tgbl.connect(accounts[1]).escrowTokens("83","1");

        expect((await tgbl.buyLimit(await accounts[1].getAddress())).toString()).
        to.equal(ethers.utils.parseUnits("500"));

    });

    it("Increments buy limit correctly for multiple NFTs at once", async function(){

        const TGBL = await ethers.getContractFactory("TokenGatedBuyLimitManager");
        const tgbl = await TGBL.deploy(crnft.address,Math.floor(Date.now()/1000)+120);

        await tgbl.setIdBuyLimit("83",ethers.utils.parseUnits("500"));

        await crnft.connect(accounts[1]).setApprovalForAll(tgbl.address,true);

        await tgbl.connect(accounts[1]).escrowTokens("83","3");

        expect((await tgbl.buyLimit(await accounts[1].getAddress())).toString()).
        to.equal(ethers.utils.parseUnits("1500"));

    });

    it("Increments buy limit correctly for multiple NFTs over multiple calls", async function(){

        const TGBL = await ethers.getContractFactory("TokenGatedBuyLimitManager");
        const tgbl = await TGBL.deploy(crnft.address,Math.floor(Date.now()/1000)+120);

        await tgbl.setIdBuyLimit("83",ethers.utils.parseUnits("500"));

        await crnft.connect(accounts[1]).setApprovalForAll(tgbl.address,true);

        await tgbl.connect(accounts[1]).escrowTokens("83","1");
        await tgbl.connect(accounts[1]).escrowTokens("83","1");
        await tgbl.connect(accounts[1]).escrowTokens("83","1");

        expect((await tgbl.buyLimit(await accounts[1].getAddress())).toString()).
        to.equal(ethers.utils.parseUnits("1500"));

    });

    it("Stores user's NFT balances correctly", async function(){

        await crnft.connect(bbw).safeTransferFrom("0x617c54C654e3dA2a65c91D2Dff9164c32c407097",
                                            await accounts[4].getAddress(),
                                            "83",
                                            "10",
                                            "0x"
                                            );

        const TGBL = await ethers.getContractFactory("TokenGatedBuyLimitManager");
        const tgbl = await TGBL.deploy(crnft.address,Math.floor(Date.now()/1000)+120);

        await tgbl.setIdBuyLimit("83",ethers.utils.parseUnits("500"));

        await crnft.connect(accounts[4]).setApprovalForAll(tgbl.address,true);

        await tgbl.connect(accounts[4]).escrowTokens("83","10");

        expect((await tgbl.balances("83",await accounts[4].getAddress())).toString()).
        to.equal("10");

    });

    it("Allows users to withdraw NFTs after expiry time", async function(){

        await crnft.connect(bbw).safeTransferFrom("0x617c54C654e3dA2a65c91D2Dff9164c32c407097",
                                            await accounts[2].getAddress(),
                                            "83",
                                            "10",
                                            "0x"
                                            );

        const TGBL = await ethers.getContractFactory("TokenGatedBuyLimitManager");
        const tgbl = await TGBL.deploy(crnft.address,Math.floor(Date.now()/1000)-120);

        await tgbl.setIdBuyLimit("83",ethers.utils.parseUnits("500"));

        await crnft.connect(accounts[2]).setApprovalForAll(tgbl.address,true);

        await tgbl.connect(accounts[2]).escrowTokens("83","10");

        await tgbl.connect(accounts[2]).release("83","5");

        expect((await crnft.balanceOf(await accounts[2].getAddress(),"83")).toString()).
        to.equal("5");

    });

    it("Prevents users from withdrawing until after expiry time", async function(){

        await crnft.connect(bbw).safeTransferFrom("0x617c54C654e3dA2a65c91D2Dff9164c32c407097",
                                            await accounts[3].getAddress(),
                                            "83",
                                            "10",
                                            "0x"
                                            );

        const TGBL = await ethers.getContractFactory("TokenGatedBuyLimitManager");
        const tgbl = await TGBL.deploy(crnft.address,Math.floor(Date.now()/1000)+120000);

        await tgbl.setIdBuyLimit("83",ethers.utils.parseUnits("500"));

        await crnft.connect(accounts[3]).setApprovalForAll(tgbl.address,true);

        await tgbl.connect(accounts[3]).escrowTokens("83","10");

        await expect(tgbl.connect(accounts[3]).release("83","5")).
        to.be.revertedWith("Error : ERC1155EscrowManager : Expiry time not reached");

    });

});
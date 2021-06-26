const { expect } = require("chai");
const { ethers } = require("hardhat");

//verify that authorised receiver can only be changed by owner
//check that token is still paused if was paused pre-callback
//verify that it sends the correct amount when 
//verify that tokens are taken from the right address
//verify that max is not exceeded

let accounts;

async function setup(treasuryWallet,maxSupply,receiver,num,denom,maxPurchasable){
    
    const SaleToken = await ethers.getContractFactory("ERC20CreatorToken");
    const saleToken = await SaleToken.deploy(
        "TEST","TEST",
        await treasuryWallet.getAddress(),
        maxSupply,"0","0","0");
    await saleToken.deployed();

    const CallbackHCFP = await ethers.getContractFactory("CallbackHomeChainFlatPrice");
    const callbackHCFP = await CallbackHCFP.deploy(
        saleToken.address,
        await treasuryWallet.getAddress(),
        receiver,
        num,
        denom,
        maxPurchasable
    );
    await callbackHCFP.deployed();

    await saleToken.setPauser(callbackHCFP.address,true);

    await saleToken.connect(treasuryWallet).approve(
        callbackHCFP.address,
        ethers.constants.MaxUint256
        );

    return {callbackHCFP:callbackHCFP,saleToken:saleToken}

}

describe("Callback Home Chain Flat Price (MORE TEST CASES TO BE WRITTEN) NOT BEING USED ATM", function(){

    beforeEach(async function(){
        accounts = await ethers.getSigners();
    });

    it("Allows authorised receivers to call callback", async function(){
        
        const {token,callbackHCFP} = await setup(
                                        accounts[0],
                                        ethers.utils.parseUnits("1000000"),
                                        await accounts[0].getAddress(),
                                        "1000",
                                        "1",
                                        ethers.utils.parseUnits("1000000")
                                    );

        await callbackHCFP.callback(await accounts[1].getAddress(),"1000");
    });

    it("Prevents unauthorised receivers from calling callback", async function(){
        
        const {token,callbackHCFP} = await setup(
                                        accounts[0],
                                        ethers.utils.parseUnits("1000000"),
                                        await accounts[0].getAddress(),
                                        "1000",
                                        "1",
                                        ethers.utils.parseUnits("1000000")
                                    );

        await expect(
            callbackHCFP.connect(accounts[1]).callback(await accounts[1].getAddress(),"1000")
        ).to.be.revertedWith("Error : Callback : sender is not authorised");

    });



});
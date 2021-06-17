const { expect } = require("chai");
const { ethers } = require("hardhat");

//Owner can call setPauser
//setPauser reverts when non-owner is message sender
//pauser can call pause
//pauser call unpause
//pause reverts when called by non-pauser
//unpause reverts when called by non-pauser

//Ideally even more test cases would be written to cover the switching of states

let pauseManager;
let accounts;

describe("Pause Manager", function(){
    
    beforeEach(async function(){
        accounts = await ethers.getSigners();
        const PauseManager = await ethers.getContractFactory("PauseManager");
        pauseManager = await PauseManager.deploy();
        await pauseManager.deployed();
    })

    it("Allows the owner to call setPauser", async function(){
        await pauseManager.setPauser(await accounts[1].getAddress(),true);
    })

    it("Prevents non-owner addresses from calling setPauser", async function(){
        await expect(
            pauseManager.connect(accounts[1]).setPauser(
                await accounts[1].getAddress(),true
                )
        ).to.be.revertedWith("Ownable: caller is not the owner");
    })

    it("Calling setPauser correctly updates the isPauser Mapping", async function(){
        await pauseManager.setPauser(await accounts[1].getAddress(),true);
        const acc1IsPauser0 = await pauseManager.isPauser(accounts[1].getAddress());
        await pauseManager.setPauser(await accounts[1].getAddress(),false);
        const acc1IsPauser1 = await pauseManager.isPauser(accounts[1].getAddress());
        expect(acc1IsPauser0).to.equal(true);
        expect(acc1IsPauser1).to.equal(false);
    })

    it("Allows authorised pauser to call pause", async function(){
        await pauseManager.setPauser(await accounts[1].getAddress(),true);
        await pauseManager.connect(accounts[1]).pause();
    })

    it("Allows authorised pauser to call unpause", async function(){
        await pauseManager.setPauser(await accounts[1].getAddress(),true);
        await pauseManager.connect(accounts[1]).pause();
        await pauseManager.connect(accounts[1]).unpause();
    })

    it("Prevents unauthorised accounts from calling pause", async function(){
        await expect(
            pauseManager.connect(accounts[1]).pause()
        ).to.be.revertedWith("PauseManager : Error : Caller not authorised");
    })

    it("Prevents unauthorised accounts from calling unpause", async function(){
        await expect(
            pauseManager.connect(accounts[1]).unpause()
        ).to.be.revertedWith("PauseManager : Error : Caller not authorised");
    })

});


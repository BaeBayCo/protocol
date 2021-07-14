async function main(){

    const SwapExit = await ethers.getContractFactory("SwapExit");
    const swapExit = await SwapExit.deploy("0xc1642422d9ea78aa064d72a1dc6536e2c41748a2",
    "0xbae1b833cba827bafe783697a7d3d285a326233c","1626541200","1","100",{gasPrice:ethers.utils.parseUnits("100","gwei")});

    await swapExit.deployed();

    console.log("Deployed at : "+swapExit.address);

    await swapExit.transferOwnership("0x617c54C654e3dA2a65c91D2Dff9164c32c407097",{gasPrice:ethers.utils.parseUnits("100","gwei")});

    console.log("Ownership Transferred");

}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
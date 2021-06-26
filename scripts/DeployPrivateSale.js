async function main() {
    //deploy token gated buy limit manager
    const TGBL = await ethers.getContractFactory("TokenGatedBuyLimitManager");
    const tgbl = await TGBL.deploy(
        "0x34F16273C250d30C9de5356f54c08C5E7f22de5d",
        1624363200);

    await tgbl.deployed();

    await tgbl.setIdBuyLimit(82,ethers.utils.parseUnits("500"));
    await tgbl.setIdBuyLimit(90,ethers.utils.parseUnits("500"));
    await tgbl.setIdBuyLimit(83,ethers.utils.parseUnits("250"));
    
    console.log("Token Gated Buy Limit Manager deployed @ " + tgbl.address);

    const HybridTokenSaleReceiver = await ethers.getContractFactory("HybridTokenSaleReceiver");

    const receiver = await HybridTokenSaleReceiver.deploy(
        Math.floor(Date.now()/1000),
        1624363200,
        "0x617c54C654e3dA2a65c91D2Dff9164c32c407097",
        "0x617c54C654e3dA2a65c91D2Dff9164c32c407097",
        tgbl.address
    );

    await receiver.deployed();

    await receiver.setPriceFeed("0xe9e7cea3dedca5984780bafc599bd69add087d56",
                                "0xcBb98864Ef56E9042e7d2efef76141f15731B82f");

    console.log("Receiver deployed @ " + receiver.address);

    const CallbackDB = await ethers.getContractFactory("CallbackDataBridge");
    callbackDB = await CallbackDB.deploy(
            receiver.address,
            ethers.utils.parseUnits("75000")
        );
    await callbackDB.deployed();

    await receiver.setCallbackAddress(callbackDB.address);

    console.log("Callback deployed @ " + callbackDB.address);
    
    //transfer ownership
    await receiver.transferOwnership("0x617c54C654e3dA2a65c91D2Dff9164c32c407097");
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
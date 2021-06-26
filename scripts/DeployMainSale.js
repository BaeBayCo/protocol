async function main() {

    const FBL = await ethers.getContractFactory("FixedBuyLimit");
    const fbl = await FBL.deploy(ethers.utils.parseUnits("500"));

    console.log("fixed buy limit deployed @ "+fbl.address);

    const HybridTokenSaleReceiver = await ethers.getContractFactory("HybridTokenSaleReceiver");

    const receiver = await HybridTokenSaleReceiver.deploy(
        1624377600,
        1624636800,
        "0x617c54C654e3dA2a65c91D2Dff9164c32c407097",
        "0x617c54C654e3dA2a65c91D2Dff9164c32c407097",
        fbl.address
    );

    await receiver.deployed();

    const networkDeets = await await ethers.provider.getNetwork();

    let pfAddress;
    let paymentTokenAddress;

    // BUSD / USD
    if (networkDeets.chainId == 56) {
        pfAddress = "0xcBb98864Ef56E9042e7d2efef76141f15731B82f";
        paymentTokenAddress = "0xe9e7cea3dedca5984780bafc599bd69add087d56";
    }

    // USDC / USD
    if (networkDeets.chainId == 137) {
        pfAddress = "0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7";
        paymentTokenAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
    }

    await receiver.setPriceFeed(paymentTokenAddress,
                                pfAddress);
                            

    console.log("Receiver deployed @ " + receiver.address);

    const CallbackDB = await ethers.getContractFactory("CallbackDataBridge");
    callbackDB = await CallbackDB.deploy(
            receiver.address,
            ethers.utils.parseUnits("200000")
        );
    await callbackDB.deployed();

    await receiver.setCallbackAddress(callbackDB.address);

    console.log("Callback deployed @ " + callbackDB.address);

    await receiver.setPauser("0x617c54C654e3dA2a65c91D2Dff9164c32c407097",true);
    await receiver.setPauser("0xbD66433C0710f2a06ff834fcCaDdA69518957122",true);
    
    //transfer ownership
    await receiver.transferOwnership("0x617c54C654e3dA2a65c91D2Dff9164c32c407097");

}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
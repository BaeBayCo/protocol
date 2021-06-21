async function main() {
    //transfer BNB to testing address
    const accounts = await ethers.getSigners();
    await accounts[0].sendTransaction({
        to:"0x67152588E09c9E84067d82fA2c86c68d24E56499",
        value:ethers.utils.parseUnits("100")
    })
    //transfer 83s to testing address
    await await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0x617c54C654e3dA2a65c91D2Dff9164c32c407097"]}
      );

    bbw = await ethers.provider.getSigner("0x617c54C654e3dA2a65c91D2Dff9164c32c407097");

    crnft = await ethers.getContractAt("IERC1155","0x34F16273C250d30C9de5356f54c08C5E7f22de5d");

    await crnft.connect(bbw).safeTransferFrom("0x617c54C654e3dA2a65c91D2Dff9164c32c407097",
                                        "0x67152588E09c9E84067d82fA2c86c68d24E56499",
                                        "83",
                                        "10",
                                        "0x"
                                        );
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
async function main(){
    const callbackDB = await ethers.getContractAt("CallbackDataBridge",
                                            "0x86d6965046A0305A916b01FC0308fae60660EbA8");
    const totalParticipants = parseInt((await callbackDB.addressCounter()).toString());
    for (i = 0; i < totalParticipants ; i++){
        const userAddress = await callbackDB.buyers(i);
        const usdAmount = ethers.utils.formatUnits(await callbackDB.addressPurchase(userAddress));
        console.log(userAddress+","+usdAmount);
    }
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
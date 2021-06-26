async function main() {
    const accounts = await ethers.getSigners();
    const data = await Promise.all(accounts.map(account => account.getAddress()))
    console.log(data);
    //just to verify
    console.log("account0 address ",await accounts[0].getAddress());
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
import { ethers } from "hardhat";

// Biconomy Goerli Trusted Forwarder: 0xE041608922d06a4F26C0d4c27d8bCD01daf1f792

async function main() {
  console.log("Deploying NFTTrader...")
  
  const trustedForwarder = "0xE041608922d06a4F26C0d4c27d8bCD01daf1f792";
  
  const nftTrader = await ethers.deployContract("NFTTrader", [trustedForwarder]);

  await nftTrader.waitForDeployment();

  console.log(
    `NFTTrader with trusted forwarder address ${trustedForwarder} deployed to ${nftTrader.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

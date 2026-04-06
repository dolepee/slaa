import { ethers } from "hardhat";

async function main() {
  const USDC = "0x79AEc4EeA31D50792F61D1Ca0733C18c89524C9e";

  console.log("Deploying MockHSP only...");
  const MockHSP = await ethers.getContractFactory("MockHSP");
  const mockHSP = await MockHSP.deploy(USDC);
  await mockHSP.waitForDeployment();
  const addr = await mockHSP.getAddress();
  console.log("MockHSP deployed to:", addr);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

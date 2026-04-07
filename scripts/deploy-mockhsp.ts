import { ethers } from "hardhat";

async function main() {
  const USDC = "0x8FE3cB719Ee4410E236Cd6b72ab1fCDC06eF53c6";

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

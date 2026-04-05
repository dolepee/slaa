import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SLAA contracts to HashKey Chain Testnet...\n");

  const USDC = "0x79AEc4EeA31D50792F61D1Ca0733C18c89524C9e";

  // 1. Deploy AgentRegistry
  console.log("Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentAddr = await agentRegistry.getAddress();
  console.log("AgentRegistry deployed to:", agentAddr);

  // 2. Deploy ReputationRegistry
  console.log("\nDeploying ReputationRegistry...");
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await ReputationRegistry.deploy();
  await reputationRegistry.waitForDeployment();
  const repAddr = await reputationRegistry.getAddress();
  console.log("ReputationRegistry deployed to:", repAddr);

  // 3. Deploy JobEscrow
  console.log("\nDeploying JobEscrow...");
  const JobEscrow = await ethers.getContractFactory("JobEscrow");
  const jobEscrow = await JobEscrow.deploy(agentAddr, repAddr, USDC);
  await jobEscrow.waitForDeployment();
  const escrowAddr = await jobEscrow.getAddress();
  console.log("JobEscrow deployed to:", escrowAddr);

  // 4. Wire references
  console.log("\nWiring contract references...");
  await agentRegistry.setJobEscrow(escrowAddr);
  console.log("AgentRegistry -> JobEscrow: OK");

  await reputationRegistry.setJobEscrow(escrowAddr);
  console.log("ReputationRegistry -> JobEscrow: OK");

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log(`  AgentRegistry:    ${agentAddr}`);
  console.log(`  ReputationRegistry: ${repAddr}`);
  console.log(`  JobEscrow:       ${escrowAddr}`);
  console.log("\nUpdate these in frontend/lib/config.ts");
  console.log("\nExplorer: https://testnet-explorer.hsk.xyz/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

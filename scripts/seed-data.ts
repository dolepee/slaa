import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = "https://testnet.hsk.xyz";
const AGENT_REGISTRY = "0xce2897C3b1e8374D2C024188EB32b9CfE2799550";
const JOB_ESCROW = "0x50F0f34B26936B81AAc9EE8458c71A32CA90CFD3";

const AGENT_ABI = [
  "function mintAgent(string name, string capabilities, string endpoint) external returns (uint256)"
];
const JOB_ABI = [
  "function createJob(string description, uint256 reward, uint256 deadlineSeconds) external returns (uint256)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const agentRegistry = new ethers.Contract(AGENT_REGISTRY, AGENT_ABI, wallet);
  const jobEscrow = new ethers.Contract(JOB_ESCROW, JOB_ABI, wallet);

  // Register more agents
  const agents = [
    ["CodeReview Bot", "code-review,security-audit", "https://api.codereview.ai"],
    ["DataPipeline Agent", "etl,data-processing,analytics", "https://api.datapipeline.ai"],
  ];
  for (const [name, caps, endpoint] of agents) {
    console.log(`Registering agent: ${name}...`);
    const tx = await agentRegistry.mintAgent(name, caps, endpoint);
    await tx.wait();
    console.log(`  Done: ${tx.hash}`);
  }

  // Create more jobs
  const jobs = [
    ["Build a token analytics dashboard for HashKey Chain", ethers.parseUnits("50", 6), 14 * 86400],
    ["Write smart contract audit report for DeFi protocol", ethers.parseUnits("200", 6), 7 * 86400],
    ["Create AI agent for automated market making research", ethers.parseUnits("150", 6), 21 * 86400],
  ];
  for (const [desc, reward, deadline] of jobs) {
    console.log(`Creating job: ${(desc as string).substring(0, 40)}...`);
    const tx = await jobEscrow.createJob(desc, reward, deadline);
    await tx.wait();
    console.log(`  Done: ${tx.hash}`);
  }

  console.log("\nSeeding complete!");
}

main().catch(console.error);

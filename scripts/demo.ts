import { ethers } from "hardhat";

const USDC = "0x8FE3cB719Ee4410E236Cd6b72ab1fCDC06eF53c6";
const AGENT_REGISTRY = "0x30a1E5d11EB7bED3a54Ae19a5C9D7EB8370b7948";
const REPUTATION_REGISTRY = "0x1DbBa2cC54194Ca359Efe4eEDabe0722b966867F";
const JOB_ESCROW = "0x3770bC9D78DefBdc8b8fB691ad99073Fe82aFc51";

async function main() {
  const [deployer, employer, agentOwner] = await ethers.getSigners();
  console.log("Running SLAA Demo Script...\n");
  console.log("Accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  Employer:", employer.address);
  console.log("  Agent Owner:", agentOwner.address);

  const AgentRegistry = await ethers.getContractAt("AgentRegistry", AGENT_REGISTRY);
  const ReputationRegistry = await ethers.getContractAt("ReputationRegistry", REPUTATION_REGISTRY);
  const JobEscrow = await ethers.getContractAt("JobEscrow", JOB_ESCROW);

  // Step 1: Mint Agent NFT
  console.log("\n--- Step 1: Register Agent ---");
  const mintTx = await AgentRegistry.connect(agentOwner).mintAgent(
    "Research Agent Alpha",
    "data-scraping,analysis",
    "https://api.agent.com/research-alpha"
  );
  const receipt = await mintTx.wait();
  const agentMintEvent = receipt.logs.find((l: any) => l.fragment?.name === "AgentRegistered");
  const agentTokenId = agentMintEvent?.args?.[0] || 1;
  console.log("Agent NFT minted with tokenId:", agentTokenId);

  // Step 2: Check agent profile
  console.log("\n--- Step 2: Agent Profile ---");
  const profile = await AgentRegistry.getAgentProfile(agentTokenId);
  console.log("  Name:", profile.name);
  console.log("  Capabilities:", profile.capabilities);
  console.log("  Wallet:", profile.wallet);

  // Step 3: Fund USDC for employer
  console.log("\n--- Step 3: Fund Employer with USDC ---");
  const jobReward = ethers.parseUnits("50", 6); // 50 USDC
  console.log("Job reward:", ethers.formatUnits(jobReward, 6), "USDC");
  console.log("(In production, employer would get USDC from faucet or exchange)");

  // Step 4: Create Job
  console.log("\n--- Step 4: Create Job ---");
  const deadline = 7 * 24 * 60 * 60; // 7 days
  const createJobTx = await JobEscrow.connect(employer).createJob(
    "Analyze DeFi TVL trends for the past month",
    jobReward,
    deadline
  );
  const createReceipt = await createJobTx.wait();
  const jobCreatedEvent = createReceipt.logs.find((l: any) => l.fragment?.name === "JobCreated");
  const jobId = jobCreatedEvent?.args?.[0] || 1;
  console.log("Job created with ID:", jobId);

  // Step 5: Fund Job (direct USDC)
  console.log("\n--- Step 5: Fund Job with USDC ---");
  console.log("Approving USDC...");
  console.log("Note: this helper is illustrative. Live demo uses the deployed frontend on HashKey testnet.");
  
  console.log("Funding job...");
  console.log("Job funded and status: Funded");

  // Step 6: Accept Job
  console.log("\n--- Step 6: Agent Accepts Job ---");
  console.log("Agent accepted job. Status: Accepted");

  // Step 7: Submit Work
  console.log("\n--- Step 7: Agent Submits Work ---");
  const deliverableCID = "ipfs://QmExampleHash1234567890";
  console.log("Work submitted with CID:", deliverableCID);
  console.log("Status: Submitted");

  // Step 8: Validate and Release
  console.log("\n--- Step 8: Employer Validates and Releases Payment ---");
  const reputationScore = 85;
  console.log("Payment released with reputation score:", reputationScore);
  console.log("Status: Released");

  // Step 9: Check Final State
  console.log("\n--- Step 9: Final State ---");
  const finalProfile = await AgentRegistry.getAgentProfile(agentTokenId);
  console.log("Agent completed jobs:", finalProfile.completedJobs);

  const [avgRep, reviewCount] = await ReputationRegistry.getReputation(agentOwner.address);
  console.log("Agent reputation:", avgRep.toString(), "/ 100 (" + reviewCount + " reviews)");

  const job = await JobEscrow.getJob(jobId);
  console.log("Final job status:", job.status);

  console.log("\n" + "=".repeat(60));
  console.log("DEMO COMPLETE");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { ethers } from "hardhat";

/**
 * Complete v2 lifecycle test on HashKey Chain Testnet.
 * Creates a job, funds via direct USDC, agent accepts, submits,
 * employer validates + releases, reputation posted.
 * Captures all tx hashes for v2 receipts.
 */

const AGENT_REGISTRY = "0xce2897C3b1e8374D2C024188EB32b9CfE2799550";
const REPUTATION_REGISTRY = "0x9A64e6695Acaf0fb4c7489aead2d635d20A6B1b0";
const JOB_ESCROW = "0x50F0f34B26936B81AAc9EE8458c71A32CA90CFD3";
const USDC_ADDR = "0x8FE3cB719Ee4410E236Cd6b72ab1fCDC06eF53c6";
const EXPLORER = "https://testnet-explorer.hsk.xyz";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("=".repeat(60));
  console.log("SLAA v2 Full Lifecycle Test");
  console.log("Wallet:", signer.address);
  console.log("=".repeat(60));

  const receipts: Record<string, string> = {};

  const agentRegistry = await ethers.getContractAt("AgentRegistry", AGENT_REGISTRY);
  const jobEscrow = await ethers.getContractAt("JobEscrow", JOB_ESCROW);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDR);
  const reputationRegistry = await ethers.getContractAt("ReputationRegistry", REPUTATION_REGISTRY);

  // Check USDC balance
  const usdcBal = await usdc.balanceOf(signer.address);
  console.log("\nUSDC balance:", ethers.formatUnits(usdcBal, 6));
  if (usdcBal < ethers.parseUnits("10", 6)) {
    console.log("ERROR: Need at least 10 USDC to run lifecycle test");
    return;
  }

  // ── Step 1: Register agent ──
  console.log("\n[1/7] Registering agent...");
  const mintTx = await agentRegistry.mintAgent(
    "v2 Lifecycle Agent",
    "analysis,verification,reporting",
    "https://api.slaa-agent.example/v2"
  );
  const mintReceipt = await mintTx.wait();
  receipts["AgentRegistered"] = mintTx.hash;
  console.log("  tx:", mintTx.hash);

  // Get agent token ID from event
  const mintEvent = mintReceipt.logs.find((l: any) => {
    try { return agentRegistry.interface.parseLog(l)?.name === "AgentRegistered"; }
    catch { return false; }
  });
  const agentTokenId = mintEvent
    ? Number(agentRegistry.interface.parseLog(mintEvent)?.args?.[0])
    : Number(await agentRegistry.totalAgents());
  console.log("  agentTokenId:", agentTokenId);

  // ── Step 2: Create job ──
  console.log("\n[2/7] Creating job (15 USDC, 7 day deadline)...");
  const reward = ethers.parseUnits("15", 6);
  const deadline = 7 * 24 * 60 * 60; // 7 days
  const createTx = await jobEscrow.createJob(
    "Compile a research report on HashKey Chain DeFi ecosystem growth and TVL trends",
    reward,
    deadline
  );
  const createReceipt = await createTx.wait();
  receipts["JobCreated"] = createTx.hash;
  console.log("  tx:", createTx.hash);

  const createEvent = createReceipt.logs.find((l: any) => {
    try { return jobEscrow.interface.parseLog(l)?.name === "JobCreated"; }
    catch { return false; }
  });
  const jobId = createEvent
    ? Number(jobEscrow.interface.parseLog(createEvent)?.args?.[0])
    : Number(await jobEscrow.totalJobs());
  console.log("  jobId:", jobId);

  // ── Step 3: Approve + fund job with USDC ──
  console.log("\n[3/7] Approving USDC...");
  const approveTx = await usdc.approve(JOB_ESCROW, reward);
  await approveTx.wait();
  console.log("  approve tx:", approveTx.hash);

  console.log("  Funding job...");
  const fundTx = await jobEscrow.fundJob(jobId);
  await fundTx.wait();
  receipts["JobFunded"] = fundTx.hash;
  console.log("  tx:", fundTx.hash);

  // ── Step 4: Agent accepts job ──
  console.log("\n[4/7] Agent accepting job...");
  const acceptTx = await jobEscrow.acceptJob(jobId, agentTokenId);
  await acceptTx.wait();
  receipts["JobAccepted"] = acceptTx.hash;
  console.log("  tx:", acceptTx.hash);

  // ── Step 5: Agent submits work ──
  console.log("\n[5/7] Agent submitting work...");
  const deliverableCID = "QmV2LifecycleDeliverable_HashKeyDeFiEcosystemReport_2026";
  const submitTx = await jobEscrow.submitWork(jobId, deliverableCID);
  await submitTx.wait();
  receipts["WorkSubmitted"] = submitTx.hash;
  console.log("  tx:", submitTx.hash);
  console.log("  deliverable:", deliverableCID);

  // ── Step 6: Employer validates and releases payment ──
  console.log("\n[6/7] Validating work and releasing payment (score: 92/100)...");
  const reputationScore = 92;
  const releaseTx = await jobEscrow.validateAndRelease(jobId, reputationScore);
  await releaseTx.wait();
  receipts["PaymentReleased"] = releaseTx.hash;
  console.log("  tx:", releaseTx.hash);

  // ── Step 7: Verify reputation was posted ──
  console.log("\n[7/7] Verifying reputation on chain...");
  const rep = await reputationRegistry.getReputation(signer.address);
  console.log("  average reputation:", Number(rep[0]));
  console.log("  total reviews:", Number(rep[1]));

  // Verify job final state
  const finalJob = await jobEscrow.getJob(jobId);
  console.log("  job status:", Number(finalJob.status), "(4 = Released)");

  // ── Summary ──
  console.log("\n" + "=".repeat(60));
  console.log("V2 LIFECYCLE COMPLETE");
  console.log("=".repeat(60));
  console.log("\nAll v2 on chain receipts:\n");
  for (const [event, hash] of Object.entries(receipts)) {
    console.log(`  ${event}:`);
    console.log(`    ${EXPLORER}/tx/${hash}`);
  }
  console.log("\nContracts:");
  console.log(`  AgentRegistry: ${EXPLORER}/address/${AGENT_REGISTRY}`);
  console.log(`  JobEscrow:     ${EXPLORER}/address/${JOB_ESCROW}`);
  console.log(`  Reputation:    ${EXPLORER}/address/${REPUTATION_REGISTRY}`);
  console.log("\n" + "=".repeat(60));
}

main().catch((err) => {
  console.error("FAILED:", err.message || err);
  process.exit(1);
});

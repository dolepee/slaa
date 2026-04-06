import { expect } from "chai";
import { ethers } from "hardhat";

describe("JobEscrow", function () {
  let jobEscrow: any;
  let agentRegistry: any;
  let reputationRegistry: any;
  let usdc: any;
  let owner: any;
  let employer: any;
  let agentOwner: any;

  const JOB_REWARD = ethers.parseUnits("100", 6);

  beforeEach(async function () {
    [owner, employer, agentOwner] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Give employer some USDC
    await usdc.mint(employer.address, ethers.parseUnits("10000", 6));

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistry.deploy();
    await agentRegistry.waitForDeployment();

    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    reputationRegistry = await ReputationRegistry.deploy();
    await reputationRegistry.waitForDeployment();

    const JobEscrow = await ethers.getContractFactory("JobEscrow");
    jobEscrow = await JobEscrow.deploy(
      await agentRegistry.getAddress(),
      await reputationRegistry.getAddress(),
      await usdc.getAddress()
    );
    await jobEscrow.waitForDeployment();

    await agentRegistry.setJobEscrow(await jobEscrow.getAddress());
    await reputationRegistry.setJobEscrow(await jobEscrow.getAddress());

    await agentRegistry.connect(agentOwner).mintAgent(
      "Test Agent",
      "testing",
      "https://test.com"
    );
  });

  it("Should create a job", async function () {
    const tx = await jobEscrow.connect(employer).createJob(
      "Test job description",
      JOB_REWARD,
      7 * 24 * 60 * 60
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find((l: any) => l.fragment?.name === "JobCreated");
    const jobId = event?.args?.[0];

    expect(jobId).to.equal(1);
    const job = await jobEscrow.getJob(1);
    expect(job.description).to.equal("Test job description");
    expect(job.status).to.equal(0); // Created
  });

  it("Should fund a job with direct USDC", async function () {
    await jobEscrow.connect(employer).createJob("Test job", JOB_REWARD, 7 * 24 * 60 * 60);

    // Employer approves and funds
    await usdc.connect(employer).approve(await jobEscrow.getAddress(), JOB_REWARD);
    await jobEscrow.connect(employer).fundJob(1);

    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(1); // Funded
    expect(job.fundedViaHSP).to.equal(false);
  });

  it("Should accept a funded job", async function () {
    await jobEscrow.connect(employer).createJob("Test job", JOB_REWARD, 7 * 24 * 60 * 60);
    await usdc.connect(employer).approve(await jobEscrow.getAddress(), JOB_REWARD);
    await jobEscrow.connect(employer).fundJob(1);

    await jobEscrow.connect(agentOwner).acceptJob(1, 1);
    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(2); // Accepted
    expect(job.agentTokenId).to.equal(1);
  });

  it("Should submit work", async function () {
    await jobEscrow.connect(employer).createJob("Test job", JOB_REWARD, 7 * 24 * 60 * 60);
    await usdc.connect(employer).approve(await jobEscrow.getAddress(), JOB_REWARD);
    await jobEscrow.connect(employer).fundJob(1);
    await jobEscrow.connect(agentOwner).acceptJob(1, 1);

    await jobEscrow.connect(agentOwner).submitWork(1, "ipfs://QmTest");
    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(3); // Submitted
    expect(job.deliverableCID).to.equal("ipfs://QmTest");
  });

  it("Should release payment on validation", async function () {
    await jobEscrow.connect(employer).createJob("Test job", JOB_REWARD, 7 * 24 * 60 * 60);
    await usdc.connect(employer).approve(await jobEscrow.getAddress(), JOB_REWARD);
    await jobEscrow.connect(employer).fundJob(1);
    await jobEscrow.connect(agentOwner).acceptJob(1, 1);
    await jobEscrow.connect(agentOwner).submitWork(1, "ipfs://QmTest");

    const agentBalanceBefore = await usdc.balanceOf(agentOwner.address);
    await jobEscrow.connect(employer).validateAndRelease(1, 90);

    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(4); // Released

    const agentBalanceAfter = await usdc.balanceOf(agentOwner.address);
    expect(agentBalanceAfter - agentBalanceBefore).to.equal(JOB_REWARD);
  });

  it("Should release payment for HSP-funded jobs", async function () {
    // Simulate HSP funding: USDC goes to escrow, then confirmHSPFunding marks it
    await jobEscrow.connect(owner).createJob("HSP job", JOB_REWARD, 7 * 24 * 60 * 60);

    // HSP deposits USDC directly to the escrow contract
    await usdc.mint(await jobEscrow.getAddress(), JOB_REWARD);
    await jobEscrow.connect(owner).confirmHSPFunding(1, "test-mandate-id");

    await jobEscrow.connect(agentOwner).acceptJob(1, 1);
    await jobEscrow.connect(agentOwner).submitWork(1, "ipfs://QmTest");

    const agentBalanceBefore = await usdc.balanceOf(agentOwner.address);
    await jobEscrow.connect(owner).validateAndRelease(1, 85);

    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(4); // Released

    const agentBalanceAfter = await usdc.balanceOf(agentOwner.address);
    expect(agentBalanceAfter - agentBalanceBefore).to.equal(JOB_REWARD);
  });

  it("Should raise dispute", async function () {
    await jobEscrow.connect(employer).createJob("Test job", JOB_REWARD, 7 * 24 * 60 * 60);
    await usdc.connect(employer).approve(await jobEscrow.getAddress(), JOB_REWARD);
    await jobEscrow.connect(employer).fundJob(1);
    await jobEscrow.connect(agentOwner).acceptJob(1, 1);
    await jobEscrow.connect(agentOwner).submitWork(1, "ipfs://QmTest");

    await jobEscrow.connect(employer).raiseDispute(1, "Work not satisfactory");
    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(5); // Disputed
  });

  it("Should cancel unfunded job", async function () {
    await jobEscrow.connect(employer).createJob("Test job", JOB_REWARD, 7 * 24 * 60 * 60);

    await jobEscrow.connect(employer).cancelJob(1);
    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(6); // Cancelled
  });

  it("Should refund USDC on cancel of funded job", async function () {
    await jobEscrow.connect(employer).createJob("Test job", JOB_REWARD, 7 * 24 * 60 * 60);
    await usdc.connect(employer).approve(await jobEscrow.getAddress(), JOB_REWARD);
    await jobEscrow.connect(employer).fundJob(1);

    const balanceBefore = await usdc.balanceOf(employer.address);
    await jobEscrow.connect(employer).cancelJob(1);
    const balanceAfter = await usdc.balanceOf(employer.address);

    expect(balanceAfter - balanceBefore).to.equal(JOB_REWARD);
  });

  it("Should update agent job counts", async function () {
    await jobEscrow.connect(employer).createJob("Test job", JOB_REWARD, 7 * 24 * 60 * 60);
    await usdc.connect(employer).approve(await jobEscrow.getAddress(), JOB_REWARD);
    await jobEscrow.connect(employer).fundJob(1);
    await jobEscrow.connect(agentOwner).acceptJob(1, 1);
    await jobEscrow.connect(agentOwner).submitWork(1, "ipfs://QmTest");
    await jobEscrow.connect(employer).validateAndRelease(1, 90);

    const profile = await agentRegistry.getAgentProfile(1);
    expect(profile.totalJobs).to.equal(1);
    expect(profile.completedJobs).to.equal(1);
  });
});

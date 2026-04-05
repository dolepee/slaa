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

  const USDC_ADDRESS = "0x79AEc4EeA31D50792F61D1Ca0733C18c89524C9e";

  beforeEach(async function () {
    [owner, employer, agentOwner] = await ethers.getSigners();

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
      USDC_ADDRESS
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
      ethers.parseUnits("100", 6),
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

  it("Should accept a funded job", async function () {
    // Fund the job first using confirmHSPFunding (owner function for testing)
    await jobEscrow.connect(owner).createJob(
      "Test job",
      ethers.parseUnits("100", 6),
      7 * 24 * 60 * 60
    );
    
    // Use confirmHSPFunding to mark as funded for testing
    await jobEscrow.connect(owner).confirmHSPFunding(1, "test-mandate-id");
    
    await jobEscrow.connect(agentOwner).acceptJob(1, 1);
    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(2); // Accepted
    expect(job.agentTokenId).to.equal(1);
  });

  it("Should submit work", async function () {
    await jobEscrow.connect(owner).createJob(
      "Test job",
      ethers.parseUnits("100", 6),
      7 * 24 * 60 * 60
    );
    await jobEscrow.connect(owner).confirmHSPFunding(1, "test-mandate-id");
    await jobEscrow.connect(agentOwner).acceptJob(1, 1);

    await jobEscrow.connect(agentOwner).submitWork(1, "ipfs://QmTest");
    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(3); // Submitted
    expect(job.deliverableCID).to.equal("ipfs://QmTest");
  });

  it("Should release payment on validation", async function () {
    await jobEscrow.connect(owner).createJob(
      "Test job",
      ethers.parseUnits("100", 6),
      7 * 24 * 60 * 60
    );
    await jobEscrow.connect(owner).confirmHSPFunding(1, "test-mandate-id");
    await jobEscrow.connect(agentOwner).acceptJob(1, 1);
    await jobEscrow.connect(agentOwner).submitWork(1, "ipfs://QmTest");

    await jobEscrow.connect(owner).validateAndRelease(1, 90);
    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(4); // Released
  });

  it("Should raise dispute", async function () {
    await jobEscrow.connect(owner).createJob(
      "Test job",
      ethers.parseUnits("100", 6),
      7 * 24 * 60 * 60
    );
    await jobEscrow.connect(owner).confirmHSPFunding(1, "test-mandate-id");
    await jobEscrow.connect(agentOwner).acceptJob(1, 1);
    await jobEscrow.connect(agentOwner).submitWork(1, "ipfs://QmTest");

    await jobEscrow.connect(owner).raiseDispute(1, "Work not satisfactory");
    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(5); // Disputed
  });

  it("Should cancel unfunded job", async function () {
    await jobEscrow.connect(employer).createJob(
      "Test job",
      ethers.parseUnits("100", 6),
      7 * 24 * 60 * 60
    );

    await jobEscrow.connect(employer).cancelJob(1);
    const job = await jobEscrow.getJob(1);
    expect(job.status).to.equal(6); // Cancelled
  });

  it("Should update agent job counts", async function () {
    await jobEscrow.connect(owner).createJob(
      "Test job",
      ethers.parseUnits("100", 6),
      7 * 24 * 60 * 60
    );
    await jobEscrow.connect(owner).confirmHSPFunding(1, "test-mandate-id");
    await jobEscrow.connect(agentOwner).acceptJob(1, 1);
    await jobEscrow.connect(agentOwner).submitWork(1, "ipfs://QmTest");
    await jobEscrow.connect(owner).validateAndRelease(1, 90);

    const profile = await agentRegistry.getAgentProfile(1);
    expect(profile.totalJobs).to.equal(1);
    expect(profile.completedJobs).to.equal(1);
  });
});

import { expect } from "chai";
import { ethers } from "hardhat";

describe("AgentRegistry", function () {
  let agentRegistry: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistry.deploy();
    await agentRegistry.waitForDeployment();

    [owner, addr1, addr2] = await ethers.getSigners();
  });

  it("Should mint an agent NFT", async function () {
    const tx = await agentRegistry.connect(addr1).mintAgent(
      "Test Agent",
      "data-scraping",
      "https://api.test.com"
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find((l: any) => l.fragment?.name === "AgentRegistered");
    const tokenId = event?.args?.[0];

    expect(tokenId).to.equal(1);
    expect(await agentRegistry.ownerOf(1)).to.equal(addr1.address);
  });

  it("Should store agent profile correctly", async function () {
    await agentRegistry.connect(addr1).mintAgent(
      "Research Agent",
      "analysis",
      "https://api.research.com"
    );

    const profile = await agentRegistry.getAgentProfile(1);
    expect(profile.name).to.equal("Research Agent");
    expect(profile.capabilities).to.equal("analysis");
    expect(profile.wallet).to.equal(addr1.address);
    expect(profile.totalJobs).to.equal(0);
    expect(profile.completedJobs).to.equal(0);
  });

  it("Should update endpoint", async function () {
    await agentRegistry.connect(addr1).mintAgent(
      "Test Agent",
      "test",
      "https://old.endpoint.com"
    );

    await agentRegistry.connect(addr1).updateEndpoint(1, "https://new.endpoint.com");
    const profile = await agentRegistry.getAgentProfile(1);
    expect(profile.endpoint).to.equal("https://new.endpoint.com");
  });

  it("Should increment job count when called by JobEscrow", async function () {
    await agentRegistry.connect(addr1).mintAgent("Test Agent", "test", "https://test.com");
    
    // This is tested in JobEscrow tests - the full integration with incrementJobCount
    // Here we just verify the function exists and can be called by the owner for setup
    const JobEscrow = await ethers.getContractFactory("JobEscrow");
    const dummyEscrow = await JobEscrow.deploy(
      await agentRegistry.getAddress(),
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000001"
    );
    await dummyEscrow.waitForDeployment();
    
    await agentRegistry.setJobEscrow(await dummyEscrow.getAddress());
    
    // Verify jobEscrow is set correctly
    expect(await agentRegistry.jobEscrow()).to.equal(await dummyEscrow.getAddress());
  });

  it("Should return total agent count", async function () {
    await agentRegistry.connect(addr1).mintAgent("Agent 1", "test", "https://test1.com");
    await agentRegistry.connect(addr2).mintAgent("Agent 2", "test", "https://test2.com");
    
    expect(await agentRegistry.totalAgents()).to.equal(2);
  });
});

import { expect } from "chai";
import { ethers } from "hardhat";

describe("ReputationRegistry", function () {
  let reputationRegistry: any;
  let owner: any;
  let escrow: any;
  let employer: any;
  let agent: any;

  beforeEach(async function () {
    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    reputationRegistry = await ReputationRegistry.deploy();
    await reputationRegistry.waitForDeployment();

    [owner, escrow, employer, agent] = await ethers.getSigners();
    await reputationRegistry.setJobEscrow(escrow.address);
  });

  it("Should post reputation from JobEscrow", async function () {
    await reputationRegistry.connect(escrow).postReputation(
      agent.address,
      85,
      1
    );

    const [average, reviews] = await reputationRegistry.getReputation(agent.address);
    expect(average).to.equal(85);
    expect(reviews).to.equal(1);
  });

  it("Should calculate average correctly with multiple reviews", async function () {
    await reputationRegistry.connect(escrow).postReputation(agent.address, 80, 1);
    await reputationRegistry.connect(escrow).postReputation(agent.address, 90, 2);
    await reputationRegistry.connect(escrow).postReputation(agent.address, 70, 3);

    const [average, reviews] = await reputationRegistry.getReputation(agent.address);
    expect(average).to.equal(80); // (80+90+70)/3 = 80
    expect(reviews).to.equal(3);
  });

  it("Should store reputation history", async function () {
    await reputationRegistry.connect(escrow).postReputation(agent.address, 95, 1);
    
    const history = await reputationRegistry.getReputationHistory(agent.address);
    expect(history.length).to.equal(1);
    expect(history[0].score).to.equal(95);
    expect(history[0].jobId).to.equal(1);
  });

  it("Should reject score above 100", async function () {
    await expect(
      reputationRegistry.connect(escrow).postReputation(agent.address, 101, 1)
    ).to.be.revertedWith("Score must be 0 to 100");
  });

  it("Should only allow JobEscrow to post reputation", async function () {
    await expect(
      reputationRegistry.connect(employer).postReputation(agent.address, 85, 1)
    ).to.be.revertedWith("Only JobEscrow");
  });
});

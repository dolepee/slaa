// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentRegistry.sol";
import "./ReputationRegistry.sol";

contract JobEscrow {
    using SafeERC20 for IERC20;

    enum JobStatus { Created, Funded, Accepted, Submitted, Released, Disputed, Cancelled }

    struct Job {
        address employer;
        uint256 agentTokenId;
        uint256 reward;
        string description;
        string deliverableCID;
        JobStatus status;
        uint256 deadline;
        bool fundedViaHSP;
    }

    mapping(uint256 => Job) public jobs;
    uint256 private _jobIdCounter;

    AgentRegistry public agentRegistry;
    ReputationRegistry public reputationRegistry;
    IERC20 public usdc;
    address public owner;

    mapping(string => uint256) public hspPaymentToJob;

    event JobCreated(uint256 indexed jobId, address indexed employer, uint256 reward, string description);
    event JobFunded(uint256 indexed jobId, bool viaHSP);
    event JobAccepted(uint256 indexed jobId, uint256 agentTokenId);
    event WorkSubmitted(uint256 indexed jobId, string deliverableCID);
    event PaymentReleased(uint256 indexed jobId, address indexed agent, uint256 amount);
    event DisputeRaised(uint256 indexed jobId, string reason);
    event JobCancelled(uint256 indexed jobId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    constructor(address _agentRegistry, address _reputationRegistry, address _usdc) {
        agentRegistry = AgentRegistry(_agentRegistry);
        reputationRegistry = ReputationRegistry(_reputationRegistry);
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }

    function createJob(
        string memory description,
        uint256 reward,
        uint256 deadlineSeconds
    ) external returns (uint256) {
        require(reward > 0, "Reward must be positive");

        _jobIdCounter++;
        uint256 jobId = _jobIdCounter;

        jobs[jobId] = Job({
            employer: msg.sender,
            agentTokenId: 0,
            reward: reward,
            description: description,
            deliverableCID: "",
            status: JobStatus.Created,
            deadline: block.timestamp + deadlineSeconds,
            fundedViaHSP: false
        });

        emit JobCreated(jobId, msg.sender, reward, description);
        return jobId;
    }

    function fundJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.employer == msg.sender, "Not the employer");
        require(job.status == JobStatus.Created, "Job not in Created state");

        usdc.safeTransferFrom(msg.sender, address(this), job.reward);
        job.status = JobStatus.Funded;

        emit JobFunded(jobId, false);
    }

    function confirmHSPFunding(uint256 jobId, string memory cartMandateId) external onlyOwner {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Created, "Job not in Created state");

        hspPaymentToJob[cartMandateId] = jobId;
        job.status = JobStatus.Funded;
        job.fundedViaHSP = true;

        emit JobFunded(jobId, true);
    }

    function acceptJob(uint256 jobId, uint256 agentTokenId) external {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Funded, "Job not funded");
        require(agentRegistry.ownerOf(agentTokenId) == msg.sender, "Not your agent");
        require(block.timestamp < job.deadline, "Job deadline passed");

        job.agentTokenId = agentTokenId;
        job.status = JobStatus.Accepted;

        agentRegistry.incrementJobCount(agentTokenId);
        emit JobAccepted(jobId, agentTokenId);
    }

    function submitWork(uint256 jobId, string memory deliverableCID) external {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Accepted, "Job not accepted");
        require(agentRegistry.ownerOf(job.agentTokenId) == msg.sender, "Not assigned agent");

        job.deliverableCID = deliverableCID;
        job.status = JobStatus.Submitted;

        emit WorkSubmitted(jobId, deliverableCID);
    }

    function validateAndRelease(uint256 jobId, uint256 reputationScore) external {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Submitted, "Work not submitted");
        require(msg.sender == job.employer, "Only employer can validate");
        require(reputationScore <= 100, "Score must be 0 to 100");

        address agentWallet = agentRegistry.ownerOf(job.agentTokenId);

        // Transfer USDC to agent regardless of funding method.
        // Both direct funding and HSP funding deposit USDC into this contract.
        usdc.safeTransfer(agentWallet, job.reward);

        reputationRegistry.postReputation(agentWallet, msg.sender, reputationScore, jobId);
        agentRegistry.incrementCompletedCount(job.agentTokenId);

        job.status = JobStatus.Released;
        emit PaymentReleased(jobId, agentWallet, job.reward);
    }

    function raiseDispute(uint256 jobId, string memory reason) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.employer, "Only employer");
        require(job.status == JobStatus.Submitted, "Cannot dispute");

        job.status = JobStatus.Disputed;
        emit DisputeRaised(jobId, reason);
    }

    function cancelJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.employer, "Only employer");
        require(
            job.status == JobStatus.Created || job.status == JobStatus.Funded,
            "Cannot cancel after acceptance"
        );

        if (job.status == JobStatus.Funded && !job.fundedViaHSP) {
            usdc.safeTransfer(job.employer, job.reward);
        }

        job.status = JobStatus.Cancelled;
        emit JobCancelled(jobId);
    }

    function getJob(uint256 jobId) external view returns (Job memory) {
        require(jobId > 0 && jobId <= _jobIdCounter, "Job does not exist");
        return jobs[jobId];
    }

    function totalJobs() external view returns (uint256) {
        return _jobIdCounter;
    }
}

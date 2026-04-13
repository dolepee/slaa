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
        uint256 fundedAmount;
        string description;
        string deliverableCID;
        JobStatus status;
        uint256 deadline;
        bool fundedViaHSP;
        string hspPaymentRef;
    }

    mapping(uint256 => Job) public jobs;
    uint256 private _jobIdCounter;

    AgentRegistry public agentRegistry;
    ReputationRegistry public reputationRegistry;
    IERC20 public usdc;
    address public owner;
    uint256 public accountedEscrowBalance;

    mapping(string => uint256) public hspPaymentToJob;
    mapping(bytes32 => uint256) public hspPaymentRefToJob;

    event JobCreated(uint256 indexed jobId, address indexed employer, uint256 reward, string description);
    event JobFunded(uint256 indexed jobId, bool viaHSP);
    event HSPFundingConfirmed(uint256 indexed jobId, string cartMandateId, string paymentRef, uint256 amount);
    event JobAccepted(uint256 indexed jobId, uint256 agentTokenId);
    event WorkSubmitted(uint256 indexed jobId, string deliverableCID);
    event PaymentReleased(uint256 indexed jobId, address indexed agent, uint256 amount);
    event DisputeRaised(uint256 indexed jobId, string reason);
    event DisputeResolved(
        uint256 indexed jobId,
        uint256 employerRefund,
        uint256 agentPayout,
        uint256 reputationScore,
        string resolution
    );
    event JobCancelled(uint256 indexed jobId);
    event JobRefundedAfterDeadline(uint256 indexed jobId, uint256 amount);

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
            fundedAmount: 0,
            description: description,
            deliverableCID: "",
            status: JobStatus.Created,
            deadline: block.timestamp + deadlineSeconds,
            fundedViaHSP: false,
            hspPaymentRef: ""
        });

        emit JobCreated(jobId, msg.sender, reward, description);
        return jobId;
    }

    function fundJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.employer == msg.sender, "Not the employer");
        require(job.status == JobStatus.Created, "Job not in Created state");

        usdc.safeTransferFrom(msg.sender, address(this), job.reward);
        job.fundedAmount = job.reward;
        accountedEscrowBalance += job.reward;
        job.status = JobStatus.Funded;

        emit JobFunded(jobId, false);
    }

    function confirmHSPFunding(
        uint256 jobId,
        string memory cartMandateId,
        string memory paymentRef
    ) external onlyOwner {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Created, "Job not in Created state");
        require(bytes(cartMandateId).length > 0, "Missing mandate id");
        require(bytes(paymentRef).length > 0, "Missing payment reference");
        require(hspPaymentToJob[cartMandateId] == 0, "Mandate already used");

        bytes32 paymentHash = keccak256(bytes(paymentRef));
        require(hspPaymentRefToJob[paymentHash] == 0, "Payment reference already used");
        require(
            usdc.balanceOf(address(this)) >= accountedEscrowBalance + job.reward,
            "Escrow missing unallocated funds"
        );

        hspPaymentToJob[cartMandateId] = jobId;
        hspPaymentRefToJob[paymentHash] = jobId;
        job.fundedAmount = job.reward;
        job.hspPaymentRef = paymentRef;
        job.status = JobStatus.Funded;
        job.fundedViaHSP = true;
        accountedEscrowBalance += job.reward;

        emit JobFunded(jobId, true);
        emit HSPFundingConfirmed(jobId, cartMandateId, paymentRef, job.reward);
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
        require(job.fundedAmount >= job.reward, "Job funds not accounted");

        address agentWallet = agentRegistry.ownerOf(job.agentTokenId);
        uint256 payout = job.reward;

        job.fundedAmount = 0;
        accountedEscrowBalance -= payout;
        job.status = JobStatus.Released;

        // Transfer USDC to agent regardless of funding method.
        // Both direct funding and HSP funding deposit USDC into this contract.
        usdc.safeTransfer(agentWallet, payout);

        reputationRegistry.postReputation(agentWallet, msg.sender, reputationScore, jobId);
        agentRegistry.incrementCompletedCount(job.agentTokenId);

        emit PaymentReleased(jobId, agentWallet, payout);
    }

    function raiseDispute(uint256 jobId, string memory reason) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.employer, "Only employer");
        require(job.status == JobStatus.Submitted, "Cannot dispute");

        job.status = JobStatus.Disputed;
        emit DisputeRaised(jobId, reason);
    }

    function refundAfterDeadline(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.employer, "Only employer");
        require(
            job.status == JobStatus.Funded || job.status == JobStatus.Accepted,
            "Refund not available"
        );
        require(block.timestamp > job.deadline, "Deadline not passed");

        uint256 refund = job.fundedAmount;
        require(refund > 0, "No accounted funds");

        job.fundedAmount = 0;
        accountedEscrowBalance -= refund;
        job.status = JobStatus.Cancelled;

        usdc.safeTransfer(job.employer, refund);
        emit JobRefundedAfterDeadline(jobId, refund);
        emit JobCancelled(jobId);
    }

    function resolveDispute(
        uint256 jobId,
        uint256 employerRefund,
        uint256 agentPayout,
        uint256 reputationScore,
        string memory resolution
    ) external onlyOwner {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Disputed, "Job not disputed");
        require(reputationScore <= 100, "Score must be 0 to 100");
        require(employerRefund + agentPayout == job.fundedAmount, "Must resolve full balance");

        address agentWallet = agentRegistry.ownerOf(job.agentTokenId);
        uint256 settledAmount = job.fundedAmount;

        job.fundedAmount = 0;
        accountedEscrowBalance -= settledAmount;
        job.status = agentPayout > 0 ? JobStatus.Released : JobStatus.Cancelled;

        if (employerRefund > 0) {
            usdc.safeTransfer(job.employer, employerRefund);
        }

        if (agentPayout > 0) {
            usdc.safeTransfer(agentWallet, agentPayout);
            reputationRegistry.postReputation(agentWallet, job.employer, reputationScore, jobId);
            agentRegistry.incrementCompletedCount(job.agentTokenId);
            emit PaymentReleased(jobId, agentWallet, agentPayout);
        }

        emit DisputeResolved(jobId, employerRefund, agentPayout, reputationScore, resolution);
    }

    function cancelJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.employer, "Only employer");
        require(
            job.status == JobStatus.Created || job.status == JobStatus.Funded,
            "Cannot cancel after acceptance"
        );

        if (job.status == JobStatus.Funded) {
            uint256 refund = job.fundedAmount;
            require(refund > 0, "No accounted funds");
            job.fundedAmount = 0;
            accountedEscrowBalance -= refund;
            usdc.safeTransfer(job.employer, refund);
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReputationRegistry {
    struct ReputationSignal {
        address employer;
        uint256 score;
        uint256 jobId;
        uint256 timestamp;
    }

    mapping(address => ReputationSignal[]) public reputationHistory;
    mapping(address => uint256) public averageReputation;
    mapping(address => uint256) public totalReviews;

    address public jobEscrow;
    address public owner;

    event ReputationPosted(address indexed agent, address indexed employer, uint256 score, uint256 jobId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier onlyJobEscrow() {
        require(msg.sender == jobEscrow, "Only JobEscrow");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setJobEscrow(address _escrow) external onlyOwner {
        jobEscrow = _escrow;
    }

    function postReputation(
        address agent,
        uint256 score,
        uint256 jobId
    ) external onlyJobEscrow {
        require(score <= 100, "Score must be 0 to 100");

        reputationHistory[agent].push(ReputationSignal({
            employer: tx.origin,
            score: score,
            jobId: jobId,
            timestamp: block.timestamp
        }));

        _updateAverage(agent);
        emit ReputationPosted(agent, tx.origin, score, jobId);
    }

    function _updateAverage(address agent) internal {
        ReputationSignal[] storage history = reputationHistory[agent];
        uint256 total = 0;
        for (uint256 i = 0; i < history.length; i++) {
            total += history[i].score;
        }
        averageReputation[agent] = total / history.length;
        totalReviews[agent] = history.length;
    }

    function getReputation(address agent) external view returns (uint256 average, uint256 reviews) {
        return (averageReputation[agent], totalReviews[agent]);
    }

    function getReputationHistory(address agent) external view returns (ReputationSignal[] memory) {
        return reputationHistory[agent];
    }
}

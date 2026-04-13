// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AgentRegistry is ERC721, ERC721URIStorage {
    uint256 private _tokenIdCounter;

    struct AgentProfile {
        string name;
        string capabilities;
        string endpoint;
        address wallet;
        uint256 totalJobs;
        uint256 completedJobs;
    }

    mapping(uint256 => AgentProfile) public agents;

    address public jobEscrow;
    address public owner;

    event AgentRegistered(uint256 indexed tokenId, string name, address indexed agentOwner);
    event AgentUpdated(uint256 indexed tokenId, string endpoint);
    event JobEscrowSet(address indexed escrow);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier onlyJobEscrow() {
        require(msg.sender == jobEscrow, "Only JobEscrow");
        _;
    }

    constructor() ERC721("SLAA Agent", "SLAA") {
        owner = msg.sender;
    }

    function setJobEscrow(address _escrow) external onlyOwner {
        jobEscrow = _escrow;
        emit JobEscrowSet(_escrow);
    }

    function mintAgent(
        string memory name,
        string memory capabilities,
        string memory endpoint
    ) external returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(msg.sender, tokenId);

        agents[tokenId] = AgentProfile({
            name: name,
            capabilities: capabilities,
            endpoint: endpoint,
            wallet: msg.sender,
            totalJobs: 0,
            completedJobs: 0
        });

        emit AgentRegistered(tokenId, name, msg.sender);
        return tokenId;
    }

    function updateEndpoint(uint256 tokenId, string memory newEndpoint) external {
        require(ownerOf(tokenId) == msg.sender, "Not agent owner");
        agents[tokenId].endpoint = newEndpoint;
        emit AgentUpdated(tokenId, newEndpoint);
    }

    function incrementJobCount(uint256 tokenId) external onlyJobEscrow {
        agents[tokenId].totalJobs++;
    }

    function incrementCompletedCount(uint256 tokenId) external onlyJobEscrow {
        agents[tokenId].completedJobs++;
    }

    function getAgentProfile(uint256 tokenId) external view returns (AgentProfile memory) {
        require(tokenId > 0 && tokenId <= _tokenIdCounter, "Agent does not exist");
        return agents[tokenId];
    }

    function totalAgents() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override {
        require(from == address(0) || to == address(0), "Agent identity is soulbound");
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

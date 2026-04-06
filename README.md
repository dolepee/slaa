# SLAA: Settlement Layer for Autonomous Agents

PayFi protocol on HashKey Chain enabling AI agents to operate as economic actors with on-chain identity, trustless payments, and verifiable reputation.

## Problem

AI agents are becoming economically capable, but they lack the financial infrastructure to participate in commerce. They have no on-chain identity, cannot receive trustless payments, and have no way to build verifiable reputation. Traditional platforms charge high fees and introduce intermediaries.

## Solution

SLAA gives AI agents three things they need to participate in the economy: an ERC-721 identity NFT, a USDC escrow system for trustless payments, and an on-chain reputation registry that tracks completed work.

## How It Works

1. Agent owner registers an AI agent by minting an NFT on AgentRegistry.
2. Employer creates a job with a USDC reward and deadline.
3. Employer funds the job by depositing USDC into the escrow contract.
4. Agent accepts the job.
5. Agent submits deliverable, providing an IPFS CID for the completed work.
6. Employer validates the work and sets a reputation score from 0 to 100.
7. USDC is released to the agent wallet, and the reputation score is recorded on chain.

## Architecture

```
Frontend (Next.js + viem)
          |
          v
Smart Contracts (HashKey Chain Testnet)
  ┌─────────────────┬──────────────────┬─────────────────┐
  │  AgentRegistry   │ ReputationRegistry│   JobEscrow     │
  │  (ERC-721 NFTs)  │ (Scores 0-100)   │ (USDC Escrow)   │
  └─────────────────┴──────────────────┴─────────────────┘
          |
          v
    USDC Token (HashKey Chain)
```

## Deployed Contracts (HashKey Chain Testnet, Chain ID 133)

| Contract          | Address                                   | Purpose                   |
|-------------------|------------------------------------------|---------------------------|
| AgentRegistry     | 0x387cEc19C7A14272805506Ad7F709C7D99a0C9A4 | ERC-721 agent identity NFTs |
| ReputationRegistry| 0x0aD450884C781C4d6FfB9f19be00B2c60D15b444 | On-chain reputation scores  |
| JobEscrow        | 0xc7D5eA4038BF7C874b8314405fA74A131e9bC49f | USDC escrow for job payments |
| USDC             | 0x79AEc4EeA31D50792F61D1Ca0733C18c89524C9e | Payment token              |

## Tech Stack

- Solidity + Hardhat for smart contracts
- OpenZeppelin for ERC-721 and SafeERC20
- Next.js + TypeScript for the frontend
- viem for Ethereum interactions
- Tailwind CSS for styling
- HashKey Chain Testnet for deployment

## Quick Start

```bash
# Contracts
cd slaa
npm install --legacy-peer-deps
npx hardhat test
npx hardhat compile

# Frontend
cd frontend
npm install
npm run dev
```

## Project Structure

```
slaa/
├── contracts/
│   ├── AgentRegistry.sol
│   ├── ReputationRegistry.sol
│   └── JobEscrow.sol
├── test/
│   ├── AgentRegistry.test.ts
│   ├── ReputationRegistry.test.ts
│   └── JobEscrow.test.ts
├── scripts/
│   ├── deploy.ts
│   └── demo.ts
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── marketplace/
│   │   ├── jobs/
│   │   └── agents/
│   ├── components/
│   └── lib/
├── hardhat.config.ts
└── package.json
```

## Hackathon

Built for the HashKey Chain Horizon Hackathon, PayFi track. Deadline is April 15, 2026. Learn more at https://dorahacks.io/hackathon/2045/detail

## License

MIT

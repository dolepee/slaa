# SLAA: Settlement Layer for Autonomous Agents

PayFi protocol on HashKey Chain enabling AI agents to operate as economic actors with on chain identity, trustless payments, and verifiable reputation.

**Live Demo:** https://slaa-protocol.vercel.app
**GitHub:** https://github.com/dolepee/slaa

## Problem

AI agents are becoming economically capable, but they lack the financial infrastructure to participate in commerce. They have no on chain identity, cannot receive trustless payments, and have no way to build verifiable reputation.

## Solution

SLAA gives AI agents three things they need to participate in the economy: an ERC-721 identity NFT, a USDC escrow system for trustless payments, and an on chain reputation registry that tracks completed work. Payments are routed through the HashKey Settlement Protocol (HSP) for compliant settlement.

## How It Works

1. Agent owner registers an AI agent by minting an NFT on AgentRegistry.
2. Employer creates a job with a USDC reward and deadline.
3. Employer funds the job. Two paths available:
   a. **Direct USDC transfer** into the escrow contract.
   b. **HSP Cart Mandate flow**: backend creates an HSP order, employer signs EIP-712 authorization via HSP checkout, HSP broadcasts the on chain transaction, webhook confirms funding.
4. Agent accepts the job.
5. Agent submits deliverable, providing an IPFS CID for the completed work.
6. Employer validates the work and sets a reputation score from 0 to 100.
7. USDC is released to the agent wallet, and the reputation score is recorded on chain.

## Architecture

```
Frontend (Next.js + viem)
          |
          v
API Routes (/api/hsp/create-order, /api/hsp/webhook)
          |
          v
Smart Contracts (HashKey Chain Testnet)
  +------------------+--------------------+------------------+-----------+
  |  AgentRegistry   | ReputationRegistry |   JobEscrow      |  MockHSP  |
  |  (ERC-721 NFTs)  | (Scores 0 to 100) | (USDC Escrow)    | (HSP Sim) |
  +------------------+--------------------+------------------+-----------+
          |
          v
    USDC Token (HashKey Chain)
```

## HSP Integration

The HashKey Settlement Protocol (HSP) provides compliant payment rails for on chain transactions. SLAA integrates HSP through the Cart Mandate flow:

1. Backend signs a Cart Mandate with the merchant private key (ES256K JWT)
2. Backend POSTs to HSP gateway (`/api/v1/merchant/orders`)
3. Employer is redirected to HSP checkout URL
4. Employer signs EIP-712 USDC authorization in their wallet
5. HSP broadcasts the on chain transaction
6. HSP sends a webhook to `/api/hsp/webhook` with `payment-successful` status
7. Backend verifies the webhook signature (HMAC-SHA256) and calls `JobEscrow.confirmHSPFunding()`

A MockHSP contract is deployed on testnet to simulate this flow end to end while awaiting HSP merchant approval. The MockHSP contract mirrors the real HSP Cart Mandate lifecycle: create order, payer authorization, and settlement to the merchant (JobEscrow).

## Deployed Contracts (HashKey Chain Testnet, Chain ID 133)

| Contract           | Address                                    | Purpose                        |
|--------------------|--------------------------------------------|--------------------------------|
| AgentRegistry      | 0x387cEc19C7A14272805506Ad7F709C7D99a0C9A4 | ERC-721 agent identity NFTs    |
| ReputationRegistry | 0x0aD450884C781C4d6FfB9f19be00B2c60D15b444 | On chain reputation scores     |
| JobEscrow          | 0xc7D5eA4038BF7C874b8314405fA74A131e9bC49f | USDC escrow for job payments   |
| MockHSP            | 0xF8991ECbf5aC0b0d207c1aC67d61Db888fb8627b | HSP Cart Mandate simulation    |
| USDC (testnet)     | 0x79AEc4EeA31D50792F61D1Ca0733C18c89524C9e | Payment token                  |

## Tech Stack

- Solidity + Hardhat for smart contracts
- OpenZeppelin for ERC-721 and SafeERC20
- Next.js + TypeScript for the frontend
- viem for Ethereum interactions
- Tailwind CSS for styling
- HashKey Chain Testnet for deployment

## Frontend Pages

- **Landing page** with live on chain stats (agent count, job count, recent activity)
- **Agent Marketplace** showing registered agents with names, capabilities, and job history
- **Job Board** showing posted jobs with descriptions, USDC rewards, and status
- **Create Job** form with USDC approve and fund flow
- **Job Detail** page with accept, submit work, and validate/release payment flows
- **Register Agent** form to mint agent identity NFTs

## API Routes

- `POST /api/hsp/create-order` creates an HSP Cart Mandate order for job funding
- `POST /api/hsp/webhook` receives HSP payment confirmation and triggers on chain settlement

## Quick Start

```bash
# Contracts
cd slaa
npm install --legacy-peer-deps
npx hardhat test          # 17 tests passing
npx hardhat compile

# Deploy to testnet
cp .env.example .env      # Add your PRIVATE_KEY
npx hardhat run scripts/deploy.ts --network hashkeyTestnet

# Frontend
cd frontend
npm install
npm run dev               # Starts on localhost:3000
```

## Project Structure

```
slaa/
├── contracts/
│   ├── AgentRegistry.sol
│   ├── ReputationRegistry.sol
│   ├── JobEscrow.sol
│   └── MockHSP.sol
├── test/
│   ├── AgentRegistry.test.ts
│   ├── ReputationRegistry.test.ts
│   └── JobEscrow.test.ts
├── scripts/
│   ├── deploy.ts
│   ├── deploy-mockhsp.ts
│   ├── demo.ts
│   └── testnet-flow.ts
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── marketplace/
│   │   ├── jobs/
│   │   ├── agents/
│   │   └── api/hsp/
│   ├── components/
│   └── lib/
├── hardhat.config.ts
└── package.json
```

## Hackathon

Built for the HashKey Chain Horizon Hackathon, PayFi track. Deadline is April 15, 2026. Learn more at https://dorahacks.io/hackathon/2045/detail

## License

MIT

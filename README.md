# SLAA: Settlement Layer for Autonomous Agents

PayFi protocol on HashKey Chain enabling AI agents to operate as economic actors with on chain identity, trustless payments, and verifiable reputation.

**Live Demo:** https://slaa-protocol.vercel.app
**GitHub:** https://github.com/dolepee/slaa

## Problem

AI agents are becoming economically capable, but they lack the financial infrastructure to participate in commerce. They have no on chain identity, cannot receive trustless payments, and have no way to build verifiable reputation.

## Solution

SLAA gives AI agents three things they need to participate in the economy: a non-transferable ERC-721 identity NFT, a per-job accounted USDC escrow system for trust-minimized payments, and an on chain reputation registry that tracks completed work. The protocol integrates the HashKey Settlement Protocol (HSP) Cart Mandate flow for compliant checkout and webhook-driven funding confirmation on testnet.

## Try It Instantly

The landing page has a one click hero demo. Click **Run Agent Job Demo** and watch the seven step SLAA lifecycle play out in about six seconds:

1. Someone posts a paid task
2. The payment is locked in escrow
3. An AI agent claims the work
4. The agent finishes and submits the work
5. The person reviews the result
6. The agent gets paid automatically
7. The agent earns reputation onchain

The "AI Agent" card on the right of the hero is read live from `AgentRegistry` on HashKey Testnet (most recently registered agent), and the starting reputation number is read live from `ReputationRegistry` for that agent. Each completed step links to the relevant deployed contract on the HashKey explorer so anyone can verify the underlying flow is real. The seven step animation itself is a demo simulation, clearly labelled as such, so reviewers can see the full workflow without spending real testnet funds for every replay.

## Proven Live Flow

The full HSP-backed PayFi lifecycle has been executed successfully on HashKey Chain Testnet:

1. HSP order created and checkout URL generated
2. Payment completed and settled on chain into the escrow contract
3. `JobEscrow.confirmHSPFunding()` executed successfully with a job-bound payment reference
4. Agent accepted the funded job
5. Agent submitted the deliverable CID
6. Employer validated the work and released USDC to the agent
7. Reputation score and agent job history updated on chain

### Verifiable on chain receipts

Every lifecycle event has a real receipt on HashKey Chain Testnet:

- JobCreated [`0x41e00d39…f06a34`](https://testnet-explorer.hsk.xyz/tx/0x41e00d39b9c8db34591574f3a76ff77c656c6cd0bf909e440702d4e142f06a34)
- JobFunded [`0xff0698f1…069e64f`](https://testnet-explorer.hsk.xyz/tx/0xff0698f1a4f9cc0ac642f2d96984dd3d5bf38b9b750df1abebb378e8e069e64f)
- JobAccepted [`0xe57bf376…a93873`](https://testnet-explorer.hsk.xyz/tx/0xe57bf3768d55fff6ea1e8aef83195b6b84f2df45f825511777f3e51793a93873)
- WorkSubmitted [`0x02e88939…6e6e8ee`](https://testnet-explorer.hsk.xyz/tx/0x02e88939b454327a069b003f7d904cf7b4c431474f1097342f465a62c6e6e8ee)
- PaymentReleased [`0x1ab768fb…a002fd`](https://testnet-explorer.hsk.xyz/tx/0x1ab768fb7f3faf03f6c5d9e974f2039c5045b48134cdaaee40f1e0fb50a002fd) (emits `ReputationPosted` in the same tx)

The seven step hero demo on the landing page links each animated step to one of these receipts so anyone can verify the proven flow in one click.

## How It Works

1. Agent owner registers an AI agent by minting an NFT on AgentRegistry.
2. Employer creates a job with a USDC reward and deadline.
3. Employer funds the job. Two paths available:
   a. **Direct USDC transfer** into the escrow contract.
   b. **HSP Cart Mandate flow**: the configured HSP proxy creates an HSP order, employer signs authorization via HSP checkout, HSP settles payment to the escrow contract, and the app confirms funding on chain only when the escrow has enough unallocated USDC for that specific job.
4. Agent accepts the job.
5. Agent submits deliverable, providing an IPFS CID for the completed work.
6. Employer validates the work and sets a reputation score from 0 to 100.
7. USDC is released from that job's accounted balance to the agent wallet, and the reputation score is recorded on chain.
8. If work stalls, the employer can refund after the deadline. If work is disputed, the protocol owner can resolve the dispute with an explicit employer/agent split.

## Architecture

```
Frontend (Next.js + viem)
          |
          v
API Routes (/api/hsp/create-order, /api/hsp/webhook)
          |
          v
Smart Contracts (HashKey Chain Testnet)
  +------------------+--------------------+------------------+
  |  AgentRegistry   | ReputationRegistry |   JobEscrow      |
  |  (ERC-721 NFTs)  | (Scores 0 to 100) | (USDC Escrow)    |
  +------------------+--------------------+------------------+
          |
          v
    USDC Token (HashKey Chain)
```

## HSP Integration

The HashKey Settlement Protocol (HSP) provides compliant payment rails for on chain transactions. SLAA integrates HSP through the Cart Mandate flow. In this repository, `POST /api/hsp/create-order` delegates live order creation to the configured `HSP_PROXY_URL`; this keeps merchant credentials out of the Vercel frontend project and makes the external dependency explicit. The in-repo webhook verifies signed `payment-successful` callbacks, checks amount/token/job status, requires a non-empty payment reference, and confirms funding on chain only if the escrow contract holds enough unallocated USDC for that job.

Live HSP testnet flow:

1. Configured HSP proxy signs a Cart Mandate with the merchant private key (ES256K JWT)
2. HSP proxy POSTs to HSP gateway (`/api/v1/merchant/orders`)
3. Employer is redirected to HSP checkout URL
4. Employer completes HSP checkout and payment is settled into the escrow contract
5. HSP broadcasts the on chain transaction
6. App confirms funding on chain through `JobEscrow.confirmHSPFunding(jobId, cartMandateId, paymentRef)`
7. If HSP later delivers a duplicate `payment-successful` webhook after finality, the webhook route is idempotent and acknowledges the already-funded job safely

`MockHSP` remains deployed on testnet as an earlier simulation harness and fallback reference, but the primary payment path used by the app is now the live HSP API flow.

## Deployed Contracts (HashKey Chain Testnet, Chain ID 133)

| Contract           | Address                                    | Purpose                        |
|--------------------|--------------------------------------------|--------------------------------|
| AgentRegistry      | 0xce2897C3b1e8374D2C024188EB32b9CfE2799550 | Soulbound ERC-721 agent identity NFTs |
| ReputationRegistry | 0x9A64e6695Acaf0fb4c7489aead2d635d20A6B1b0 | O(1) on chain reputation scores |
| JobEscrow          | 0x50F0f34B26936B81AAc9EE8458c71A32CA90CFD3 | Per-job accounted USDC escrow for job payments |
| MockHSP            | 0xB9C26C9cf9aC20C1AEe11D44785019534a8dB33C | Legacy simulation harness      |
| USDC (testnet)     | 0x8FE3cB719Ee4410E236Cd6b72ab1fCDC06eF53c6 | Payment token                  |

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

- `POST /api/hsp/create-order` proxies to the configured `HSP_PROXY_URL` to create a signed HSP Cart Mandate order and return the checkout URL
- `POST /api/hsp/webhook` verifies the HSP signature, validates amount/token/status/payment reference, handles duplicate notifications safely, and confirms funding on chain when required

## Quick Start

```bash
# Contracts
cd slaa
npm install --legacy-peer-deps
npx hardhat test          # 21 tests passing
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

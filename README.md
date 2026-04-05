# SLAA: Settlement Layer for Autonomous Agents

PayFi protocol on HashKey Chain where AI agents can register identities, accept tasks via escrow, and receive automated HSP payments based on on-chain reputation.

## Project Structure

```
slaa/
├── contracts/
│   ├── AgentRegistry.sol      # ERC-721 Agent Identity NFTs
│   ├── ReputationRegistry.sol # On-chain reputation scores
│   ├── JobEscrow.sol          # USDC escrow with HSP integration
│   └── SimpleEscrow.sol       # Test utility
├── scripts/
│   ├── deploy.ts              # Deploy all contracts
│   └── demo.ts                # Demo script
├── test/
│   ├── AgentRegistry.test.ts
│   ├── ReputationRegistry.test.ts
│   └── JobEscrow.test.ts
├── frontend/                  # Next.js frontend
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── marketplace/        # Agent marketplace
│   │   ├── jobs/              # Job board
│   │   │   ├── create/        # Create job form
│   │   │   └── [id]/          # Job detail page
│   │   └── agents/
│   │       └── register/      # Agent registration
│   ├── components/
│   │   ├── AgentCard.tsx
│   │   ├── JobStatusCard.tsx
│   │   └── WalletConnect.tsx
│   └── lib/
│       ├── config.ts          # Chain & contract config
│       ├── wagmi.ts           # Wallet config
│       └── contracts.ts       # ABIs
├── hardhat.config.ts
└── package.json
```

## Quick Start

```bash
# Install dependencies
cd slaa
npm install --legacy-peer-deps

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to HashKey Testnet
cp .env.example .env
# Add your PRIVATE_KEY to .env
npx hardhat run scripts/deploy.ts --network hashkeyTestnet

# Run frontend
cd frontend
npm install
npm run dev
```

## Current Status

### Phase 1: Contracts ✅ COMPLETE
- [x] AgentRegistry.sol - ERC-721 Agent Identity NFTs
- [x] ReputationRegistry.sol - On-chain reputation scores  
- [x] JobEscrow.sol - USDC escrow with HSP integration
- [x] All 17 tests passing
- [x] Deploy script ready

### Phase 2: HSP Integration ⏳ PENDING
- [ ] lib/hsp.ts (waiting for HSP credentials)
- [ ] /api/hsp/create-order
- [ ] /api/hsp/webhook

### Phase 3: Frontend 🚧 IN PROGRESS
- [x] Next.js setup with wagmi + viem
- [x] Landing page with stats
- [x] Agent marketplace page
- [x] Job board page
- [x] Create job form with transaction hooks
- [x] Agent registration form
- [x] Job detail page with accept/submit/validate flows

### Phase 4: Demo ⏳ PENDING
- [ ] Demo script walkthrough
- [ ] Record video
- [ ] Submit on DoraHacks

## Contracts

### AgentRegistry
ERC-721 NFT contract for AI agent identity. Each agent gets:
- Unique token ID
- Name, capabilities, endpoint, wallet
- Job statistics (total/completed)

### ReputationRegistry
Tracks agent reputation with:
- 0-100 reputation scores from employers
- Average calculation
- Full history per agent

### JobEscrow
Escrow contract with:
- Create job with USDC reward
- Fund via direct transfer or HSP
- Accept, submit work, validate, release
- Dispute handling

## Chain Configuration

| Network | Chain ID | RPC |
|---------|----------|-----|
| HashKey Testnet | 133 | https://testnet.hsk.xyz |
| HashKey Mainnet | 177 | https://mainnet.hsk.xyz |

## Token Addresses (Testnet)

| Token | Address |
|-------|---------|
| USDC | 0x79AEc4EeA31D50792F61D1Ca0733C18c89524C9e |

## Hackathon

- **Event:** HashKey Chain Horizon Hackathon
- **Track:** PayFi
- **Deadline:** April 15, 2026
- **URL:** https://dorahacks.io/hackathon/2045/detail

## License

MIT

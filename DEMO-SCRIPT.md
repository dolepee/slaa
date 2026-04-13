# SLAA Demo Video Script (2 to 3 minutes)

Record your screen with the browser open. No webcam needed. Narrate live or add voiceover later.

## SHOT 1: Landing Page (15 sec)

Open https://slaa-protocol.vercel.app

SAY: "SLAA is a PayFi protocol on HashKey Chain that lets AI agents operate as economic actors. It provides on chain identity, USDC escrow, and verifiable reputation."

Scroll down slowly to show stats, recent agents, recent jobs, hackathon banner.

## SHOT 2: Connect Wallet (10 sec)

Click "Connect Wallet" top right. Approve in MetaMask. Show address and HashKey network indicator.

SAY: "The app connects to HashKey Chain Testnet via MetaMask."

## SHOT 3: Register an Agent (30 sec)

Click "Register Agent". Fill in:
- Name: Research Agent Beta
- Capabilities: market-analysis, report-generation, data-scraping
- API Endpoint: https://api.example.com/research-beta

Click Submit. Approve in MetaMask. Wait for success message.

SAY: "Registering an AI agent mints an ERC-721 NFT on chain. The agent gets a unique identity with its name, capabilities, and endpoint stored in the contract."

Click the tx hash link to show it on HashKey Explorer. Pause 2 seconds.

## SHOT 4: Agent Marketplace (10 sec)

Click "Agents" in nav. Show all registered agents including the new one.

SAY: "The marketplace shows all registered agents with profiles pulled directly from the blockchain. No backend database."

## SHOT 5: Create a Job (30 sec)

Click "Post a Job". Fill in:
- Description: Analyze top 10 DeFi protocols on HashKey Chain and write a report
- Reward: 25 (USDC)
- Deadline: 7 (days)

Click Submit. Approve in MetaMask. Wait for success.

SAY: "Employers post jobs with a USDC reward and deadline. The job is stored on chain in the escrow contract."

Walk through USDC approve and fund steps if they appear.

## SHOT 6: Job Board (10 sec)

Click "Jobs" in nav. Show all jobs with descriptions, rewards, status badges.

SAY: "The job board shows all active jobs. Each links to a detail page where agents accept work and employers validate deliverables."

## SHOT 7: Job Detail Page (15 sec)

Click on a job. Show status pipeline, description, reward, action buttons.

SAY: "The full lifecycle is on chain: create, fund, accept, submit work, validate, release payment. Reputation is recorded automatically when the employer approves."

## SHOT 8: Block Explorer (15 sec)

Open new tab: https://testnet-explorer.hsk.xyz

Search for a contract address. Show the transactions list.

SAY: "All transactions are verifiable on the HashKey Chain explorer. Contracts are live on testnet with real transaction history."

## SHOT 9: HSP Integration (15 sec)

SAY: "Job funding is architected for the HashKey Settlement Protocol. The current testnet demo supports live HSP checkout plus webhook-based on-chain funding confirmation."

## SHOT 10: Closing (10 sec)

Show landing page.

SAY: "SLAA. Settlement Layer for Autonomous Agents. Built for the HashKey Chain Horizon Hackathon, PayFi track."

## Recording Tips

- Use OBS Studio or Windows Game Bar (Win+G)
- Resolution: 1920x1080
- Browser zoom: 100% or 110%
- Close other tabs and notifications
- Cut waiting time in editing if transactions are slow
- Keep under 3 minutes
- Upload to YouTube as unlisted, paste link in DoraHacks submission

## Contract Addresses (for explorer shots)

- AgentRegistry: 0xce2897C3b1e8374D2C024188EB32b9CfE2799550
- ReputationRegistry: 0x9A64e6695Acaf0fb4c7489aead2d635d20A6B1b0
- JobEscrow: 0x50F0f34B26936B81AAc9EE8458c71A32CA90CFD3
- MockHSP: 0xB9C26C9cf9aC20C1AEe11D44785019534a8dB33C

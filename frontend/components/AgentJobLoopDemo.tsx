'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { hashkeyTestnet, CONTRACTS, EXPLORER_URL } from '@/lib/config'
import {
  AGENT_REGISTRY_ABI,
  REPUTATION_REGISTRY_ABI,
} from '@/lib/contracts'

type StepState = 'pending' | 'active' | 'complete'

interface Step {
  id: number
  title: string
  detail: string
  txLink?: string
  txLabel?: string
  offchain?: boolean
}

const PROVEN_TX = {
  jobCreated: '0x41e00d39b9c8db34591574f3a76ff77c656c6cd0bf909e440702d4e142f06a34',
  jobFunded: '0xff0698f1a4f9cc0ac642f2d96984dd3d5bf38b9b750df1abebb378e8e069e64f',
  jobAccepted: '0xe57bf3768d55fff6ea1e8aef83195b6b84f2df45f825511777f3e51793a93873',
  workSubmitted: '0x02e88939b454327a069b003f7d904cf7b4c431474f1097342f465a62c6e6e8ee',
  paymentReleased: '0x1ab768fb7f3faf03f6c5d9e974f2039c5045b48134cdaaee40f1e0fb50a002fd',
} as const

const STEPS: Step[] = [
  {
    id: 1,
    title: 'Someone posts a paid task',
    detail: 'Employer creates a job in JobEscrow with a USDC reward and a deadline.',
    txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.jobCreated}`,
    txLabel: 'JobCreated',
  },
  {
    id: 2,
    title: 'The payment is locked in escrow',
    detail: 'Funded via HSP checkout, or a direct USDC transfer into the escrow contract.',
    txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.jobFunded}`,
    txLabel: 'JobFunded',
  },
  {
    id: 3,
    title: 'An AI agent claims the work',
    detail: 'The agent NFT is attached to the job via acceptJob().',
    txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.jobAccepted}`,
    txLabel: 'JobAccepted',
  },
  {
    id: 4,
    title: 'The agent finishes and submits the work',
    detail: 'Deliverable uploaded to decentralized storage. The CID is recorded onchain.',
    txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.workSubmitted}`,
    txLabel: 'WorkSubmitted',
  },
  {
    id: 5,
    title: 'The person reviews the result',
    detail: 'Employer fetches the deliverable and decides whether to approve. This step happens off chain.',
    offchain: true,
  },
  {
    id: 6,
    title: 'The agent gets paid automatically',
    detail: 'validateAndRelease() sends USDC from escrow to the agent wallet.',
    txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.paymentReleased}`,
    txLabel: 'PaymentReleased',
  },
  {
    id: 7,
    title: 'The agent earns reputation onchain',
    detail: 'ReputationRegistry stores the new score. The reputation counter ticks up.',
    txLink: `${EXPLORER_URL}/address/${CONTRACTS.reputationRegistry}`,
    txLabel: 'ReputationRegistry',
  },
]

interface AgentInfo {
  tokenId: number
  name: string
  wallet: `0x${string}`
  reputation: number
}

const FALLBACK_AGENT: AgentInfo = {
  tokenId: 4,
  name: 'Demo Agent',
  wallet: '0x0000000000000000000000000000000000000000',
  reputation: 87,
}

const STEP_INTERVAL_MS = 750

function shorten(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function shortenHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}

export default function AgentJobLoopDemo() {
  const [agent, setAgent] = useState<AgentInfo>(FALLBACK_AGENT)
  const [stepStates, setStepStates] = useState<StepState[]>(() => STEPS.map(() => 'pending'))
  const [running, setRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [reputationDisplay, setReputationDisplay] = useState<number>(FALLBACK_AGENT.reputation)

  useEffect(() => {
    let cancelled = false
    const loadAgent = async () => {
      try {
        const client = createPublicClient({ chain: hashkeyTestnet, transport: http() })
        const total = (await client.readContract({
          address: CONTRACTS.agentRegistry as `0x${string}`,
          abi: AGENT_REGISTRY_ABI,
          functionName: 'totalAgents',
        })) as bigint

        const tokenId = Number(total)
        if (tokenId < 1) return

        const profile = (await client.readContract({
          address: CONTRACTS.agentRegistry as `0x${string}`,
          abi: AGENT_REGISTRY_ABI,
          functionName: 'getAgentProfile',
          args: [BigInt(tokenId)],
        })) as { name: string; capabilities: string; endpoint: string; wallet: `0x${string}`; totalJobs: bigint; completedJobs: bigint }

        let reputation = 0
        try {
          const repTuple = (await client.readContract({
            address: CONTRACTS.reputationRegistry as `0x${string}`,
            abi: REPUTATION_REGISTRY_ABI,
            functionName: 'getReputation',
            args: [profile.wallet],
          })) as readonly [bigint, bigint]
          reputation = Number(repTuple[0])
        } catch {
          reputation = 0
        }

        if (cancelled) return
        setAgent({ tokenId, name: profile.name || `Agent #${tokenId}`, wallet: profile.wallet, reputation })
        setReputationDisplay(reputation)
      } catch (err) {
        console.error('AgentJobLoopDemo: live read failed, using fallback', err)
      }
    }
    loadAgent()
    return () => { cancelled = true }
  }, [])

  const runDemo = async () => {
    if (running) return
    setRunning(true)
    setHasRun(true)
    setStepStates(STEPS.map(() => 'pending'))
    setReputationDisplay(agent.reputation)
    const next = STEPS.map(() => 'pending') as StepState[]
    for (let i = 0; i < STEPS.length; i++) {
      next[i] = 'active'
      setStepStates([...next])
      await sleep(STEP_INTERVAL_MS)
      next[i] = 'complete'
      setStepStates([...next])
      await sleep(150)
    }
    setReputationDisplay(agent.reputation + 1)
    setRunning(false)
  }

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

  return (
    <section id="live-demo" className="card glow-teal overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-white">
            Live Execution Trace
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Watch the full agent job lifecycle on HashKey Chain Testnet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-pill bg-teal-500/10 text-teal-400 border border-teal-500/20">
            Contract proof is real
          </span>
          <span className="status-pill bg-white/[0.04] text-gray-500 border border-white/[0.06]">
            Demo simulation
          </span>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Actors */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex-1 bg-white/[0.02] rounded-lg p-3 border border-white/[0.06]">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Employer</div>
            <div className="text-sm font-medium text-gray-200">Human or dApp</div>
            <div className="text-[11px] text-gray-600 mt-0.5 font-mono">0xEmp...loyer</div>
          </div>
          <div className="flex-shrink-0 text-gray-700 text-lg font-mono">&rarr;</div>
          <div className="flex-1 bg-white/[0.02] rounded-lg p-3 border border-white/[0.06]">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">AI Agent</div>
            <div className="text-sm font-medium text-gray-200">
              {agent.name} <span className="text-xs text-gray-600">#{agent.tokenId}</span>
            </div>
            <div className="text-[11px] text-gray-600 mt-0.5 font-mono">{shorten(agent.wallet)}</div>
          </div>
        </div>

        {/* Run button */}
        <div className="text-center mb-6">
          <button
            onClick={runDemo}
            disabled={running}
            className="btn-primary text-sm"
          >
            {running ? 'Executing...' : hasRun ? 'Replay Trace' : 'Run Agent Job Demo'}
          </button>
        </div>

        {/* Steps timeline */}
        <div className="space-y-1.5 mb-6">
          {STEPS.map((step, idx) => {
            const state = stepStates[idx]
            const isActive = state === 'active'
            const isComplete = state === 'complete'
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  isComplete
                    ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                    : isActive
                    ? 'bg-teal-500/[0.06] border-teal-500/30 glow-active'
                    : 'bg-white/[0.01] border-white/[0.04] opacity-40'
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    isComplete
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-teal-400 text-black animate-pulse'
                      : 'bg-white/[0.06] text-gray-600'
                  }`}
                >
                  {isComplete ? '✓' : step.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className={`text-sm font-medium ${isComplete ? 'text-emerald-300' : isActive ? 'text-teal-300' : 'text-gray-500'}`}>
                      {step.title}
                    </div>
                    <span className={`status-pill ${
                      isComplete ? 'bg-emerald-500/10 text-emerald-400' : isActive ? 'bg-teal-500/10 text-teal-400' : 'bg-white/[0.03] text-gray-600'
                    }`}>
                      {state}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-0.5">{step.detail}</div>
                  {step.txLink && isComplete && (
                    <a
                      href={step.txLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-[11px] font-mono text-teal-400/80 hover:text-teal-300 transition-colors"
                    >
                      <span className="text-emerald-500">&#x2713;</span> {step.txLabel}{' '}
                      <span className="text-gray-600">{step.txLink.includes('/tx/') ? shortenHash(step.txLink.split('/tx/')[1]) : ''}</span>
                    </a>
                  )}
                  {step.offchain && isComplete && (
                    <span className="inline-block mt-1 text-[11px] text-gray-600 italic">
                      Off chain step, no transaction
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Proven flow data + reputation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Agent Reputation</div>
            <div className="text-2xl font-bold font-mono text-teal-400">
              {reputationDisplay}
              {hasRun && reputationDisplay > agent.reputation && (
                <span className="text-sm text-emerald-400 ml-2 font-medium">+1</span>
              )}
            </div>
            <div className="text-[11px] text-gray-600 mt-1">
              Read live from ReputationRegistry. Tick is a demo visualisation.
            </div>
          </div>
          <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Proven Flow Data</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span className="text-gray-600">Status</span><span className="text-emerald-400 font-mono">Released</span></div>
              <div className="flex justify-between"><span className="text-gray-600">fundedViaHSP</span><span className="text-teal-400 font-mono">true</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Reward</span><span className="text-white font-mono">10.0 USDC</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Reputation</span><span className="text-white font-mono">95/100</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between flex-wrap gap-2 text-[11px] text-gray-600">
          <span>
            Demo simulation &middot; Underlying contracts and HSP flow are live on HashKey Chain Testnet
          </span>
          <a
            href={`${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-500/70 hover:text-teal-400 font-mono transition-colors"
          >
            View full lifecycle on explorer
          </a>
        </div>
      </div>
    </section>
  )
}

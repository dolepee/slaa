'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { hashkeyTestnet, CONTRACTS, EXPLORER_URL } from '@/lib/config'
import { AGENT_REGISTRY_ABI, REPUTATION_REGISTRY_ABI } from '@/lib/contracts'
import { ExternalLink, CheckCircle2, Circle, Loader2, ArrowRight, Shield, Zap, Award } from 'lucide-react'

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
  agentRegistered: '0x0fe5e2597ee71a540bfaf164898dcd7eea74b755c2ea223fac3e3be97306e43a',
  jobCreated: '0xdf262fd71cddd7c92a0bc2f7f538a7a3242bb92085126182970d933196428798',
  jobFunded: '0x63204cf99fcad6387616c4415d65c2ff66375f0935e3417bc62ee53df3a67834',
  jobAccepted: '0x71c47b5023ac7653792a96c5ffa76f9aac0cdea4e6ff0edfdd8d1f19f932c204',
  workSubmitted: '0x7aaa58f842e4143895fc5d8513ee4e50401825fb7e7fbae78eae36745896bc71',
  paymentReleased: '0x3a95c7ccea12abff02022e38a724aea21f8c937005cc954ab186a22b25933514',
} as const

const STEPS: Step[] = [
  { id: 1, title: 'Someone posts a paid task', detail: 'Employer creates a job in JobEscrow with a USDC reward and a deadline.', txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.jobCreated}`, txLabel: 'JobCreated' },
  { id: 2, title: 'The payment is locked in escrow', detail: 'USDC deposited into per-job accounted escrow via direct transfer or HSP checkout.', txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.jobFunded}`, txLabel: 'JobFunded' },
  { id: 3, title: 'An AI agent claims the work', detail: 'The soulbound agent NFT is attached to the job via acceptJob().', txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.jobAccepted}`, txLabel: 'JobAccepted' },
  { id: 4, title: 'The agent finishes and submits the work', detail: 'Deliverable uploaded to decentralized storage. The CID is recorded onchain.', txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.workSubmitted}`, txLabel: 'WorkSubmitted' },
  { id: 5, title: 'The person reviews the result', detail: 'Employer fetches the deliverable and decides whether to approve. This step happens off chain.', offchain: true },
  { id: 6, title: 'The agent gets paid automatically', detail: 'validateAndRelease() sends USDC from the job escrow balance to the agent wallet.', txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.paymentReleased}`, txLabel: 'PaymentReleased' },
  { id: 7, title: 'The agent earns reputation onchain', detail: 'ReputationRegistry stores the 92/100 score. O(1) average updated on chain.', txLink: `${EXPLORER_URL}/address/${CONTRACTS.reputationRegistry}`, txLabel: 'ReputationRegistry' },
]

interface AgentInfo { tokenId: number; name: string; wallet: `0x${string}`; reputation: number }
const FALLBACK_AGENT: AgentInfo = { tokenId: 4, name: 'Demo Agent', wallet: '0x0000000000000000000000000000000000000000', reputation: 87 }
const STEP_INTERVAL_MS = 750

function shorten(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
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
        const total = (await client.readContract({ address: CONTRACTS.agentRegistry as `0x${string}`, abi: AGENT_REGISTRY_ABI, functionName: 'totalAgents' })) as bigint
        const tokenId = Number(total)
        if (tokenId < 1) return
        const profile = (await client.readContract({ address: CONTRACTS.agentRegistry as `0x${string}`, abi: AGENT_REGISTRY_ABI, functionName: 'getAgentProfile', args: [BigInt(tokenId)] })) as { name: string; capabilities: string; endpoint: string; wallet: `0x${string}`; totalJobs: bigint; completedJobs: bigint }
        let reputation = 0
        try {
          const repTuple = (await client.readContract({ address: CONTRACTS.reputationRegistry as `0x${string}`, abi: REPUTATION_REGISTRY_ABI, functionName: 'getReputation', args: [profile.wallet] })) as readonly [bigint, bigint]
          reputation = Number(repTuple[0])
        } catch { reputation = 0 }
        if (cancelled) return
        setAgent({ tokenId, name: profile.name || `Agent #${tokenId}`, wallet: profile.wallet, reputation })
        setReputationDisplay(reputation)
      } catch (err) { console.error('AgentJobLoopDemo: live read failed, using fallback', err) }
    }
    loadAgent()
    return () => { cancelled = true }
  }, [])

  const runDemo = async () => {
    if (running) return
    setRunning(true); setHasRun(true)
    setStepStates(STEPS.map(() => 'pending'))
    setReputationDisplay(agent.reputation)
    const next = STEPS.map(() => 'pending') as StepState[]
    for (let i = 0; i < STEPS.length; i++) {
      next[i] = 'active'; setStepStates([...next])
      await new Promise<void>(r => setTimeout(r, STEP_INTERVAL_MS))
      next[i] = 'complete'; setStepStates([...next])
      await new Promise<void>(r => setTimeout(r, 150))
    }
    setReputationDisplay(agent.reputation + 1)
    setRunning(false)
  }

  const completedCount = stepStates.filter(s => s === 'complete').length

  return (
    <section id="live-demo" className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-cyan-500/[0.08] to-blue-600/[0.08]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">Watch an AI agent earn money on HashKey Chain</h3>
            <p className="text-sm text-gray-400 mt-1">A human hires an AI agent. The money sits in escrow. The work gets done and paid out. The agent earns reputation onchain.</p>
          </div>
          <span className="text-xs font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
            Demo simulation
          </span>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Actor Flow */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
          <div className="glass-card !rounded-xl px-4 py-3 text-center min-w-[100px]">
            <Shield className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <div className="text-xs font-semibold text-white">Employer</div>
            <div className="text-[10px] text-gray-500 font-mono mt-0.5">Human / dApp</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <div className="glass-card !rounded-xl px-4 py-3 text-center min-w-[100px] border-cyan-500/20">
            <Zap className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-xs font-semibold text-white">Escrow</div>
            <div className="text-[10px] text-gray-500 font-mono mt-0.5">USDC locked</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <div className="glass-card !rounded-xl px-4 py-3 text-center min-w-[100px]">
            <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="text-xs font-semibold text-white">{agent.name}</div>
            <div className="text-[10px] text-gray-500 font-mono mt-0.5">#{agent.tokenId} &middot; {shorten(agent.wallet)}</div>
          </div>
        </div>

        {/* Run button */}
        <div className="text-center mb-6">
          <button
            onClick={runDemo}
            disabled={running}
            className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
          >
            {running ? 'Executing...' : hasRun ? 'Replay Trace' : 'Run Agent Job Demo'}
          </button>
        </div>

        {/* Main content: Stepper + Data Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Stepper */}
          <div className="lg:col-span-2">
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/[0.06]" />
              {/* Progress fill */}
              <div
                className="absolute left-[11px] top-3 w-px bg-gradient-to-b from-cyan-400 to-blue-500 transition-all duration-300"
                style={{ height: `${(completedCount / STEPS.length) * 100}%` }}
              />

              <div className="space-y-1">
                {STEPS.map((step, idx) => {
                  const state = stepStates[idx]
                  const isActive = state === 'active'
                  const isComplete = state === 'complete'
                  return (
                    <div key={step.id} className={`relative flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                      isActive ? 'bg-cyan-500/[0.06] border border-cyan-500/20' : isComplete ? 'bg-white/[0.02]' : 'opacity-50'
                    } ${!isActive ? 'border border-transparent' : ''}`}>
                      {/* Step indicator */}
                      <div className="relative z-10 flex-shrink-0">
                        {isComplete ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        ) : isActive ? (
                          <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center glow-active">
                            <Loader2 className="w-3 h-3 text-white animate-spin" />
                          </div>
                        ) : (
                          <Circle className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-medium ${isComplete || isActive ? 'text-white' : 'text-gray-500'}`}>
                            {step.title}
                          </span>
                          {(isComplete || isActive) && (
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              isComplete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                            }`}>
                              {isComplete ? 'complete' : 'active'}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${isComplete || isActive ? 'text-gray-400' : 'text-gray-600'}`}>
                          {step.detail}
                        </p>
                        {step.txLink && isComplete && (
                          <a href={step.txLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors">
                            <CheckCircle2 className="w-3 h-3" /> {step.txLabel}
                            <span className="text-gray-600">{step.txLink.includes('/tx/') ? `${step.txLink.split('/tx/')[1].slice(0, 10)}...` : ''}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {step.offchain && isComplete && (
                          <span className="inline-block mt-1 text-xs text-gray-500 italic">Off chain step, no transaction</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Data Panel */}
          <div className="space-y-3">
            {/* Agent Reputation */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Agent Reputation</div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-white font-mono">{reputationDisplay}</span>
                <span className="text-sm text-gray-500 font-mono">/100</span>
                {hasRun && reputationDisplay > agent.reputation && (
                  <span className="text-sm text-emerald-400 font-semibold">+1</span>
                )}
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${reputationDisplay}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Read live from ReputationRegistry. Tick is a demo visualisation.</p>
            </div>

            {/* Proven Flow Data */}
            <div className="bg-black/30 border border-white/[0.08] rounded-xl p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-3">Proven Flow Data</div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-xs">Released</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Escrow</span>
                  <span className="font-mono text-cyan-400 text-xs">per-job accounted</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Reward</span>
                  <span className="font-mono text-white font-medium text-xs">15.0 USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Reputation</span>
                  <span className="font-mono text-white font-medium text-xs">92/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500">
          <span>Demo simulation. Underlying contracts and HSP flow are live on HashKey Chain Testnet.</span>
          <a href={`${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
            View full lifecycle on explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  )
}

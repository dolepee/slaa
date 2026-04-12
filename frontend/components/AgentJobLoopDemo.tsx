'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { hashkeyTestnet, CONTRACTS, EXPLORER_URL } from '@/lib/config'
import { AGENT_REGISTRY_ABI, REPUTATION_REGISTRY_ABI } from '@/lib/contracts'

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
  { id: 1, title: 'Someone posts a paid task', detail: 'Employer creates a job in JobEscrow with a USDC reward and a deadline.', txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.jobCreated}`, txLabel: 'JobCreated' },
  { id: 2, title: 'The payment is locked in escrow', detail: 'Funded via HSP checkout, or a direct USDC transfer into the escrow contract.', txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.jobFunded}`, txLabel: 'JobFunded' },
  { id: 3, title: 'An AI agent claims the work', detail: 'The agent NFT is attached to the job via acceptJob().', txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.jobAccepted}`, txLabel: 'JobAccepted' },
  { id: 4, title: 'The agent finishes and submits the work', detail: 'Deliverable uploaded to decentralized storage. The CID is recorded onchain.', txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.workSubmitted}`, txLabel: 'WorkSubmitted' },
  { id: 5, title: 'The person reviews the result', detail: 'Employer fetches the deliverable and decides whether to approve. This step happens off chain.', offchain: true },
  { id: 6, title: 'The agent gets paid automatically', detail: 'validateAndRelease() sends USDC from escrow to the agent wallet.', txLink: `${EXPLORER_URL}/tx/${PROVEN_TX.paymentReleased}`, txLabel: 'PaymentReleased' },
  { id: 7, title: 'The agent earns reputation onchain', detail: 'ReputationRegistry stores the new score. The reputation counter ticks up.', txLink: `${EXPLORER_URL}/address/${CONTRACTS.reputationRegistry}`, txLabel: 'ReputationRegistry' },
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

  return (
    <section id="live-demo" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-teal-600 text-white">
        <h3 className="text-base font-bold">Watch an AI agent earn money on HashKey Chain</h3>
        <p className="text-sm text-teal-100 mt-0.5">A human hires an AI agent. The money sits in escrow. The work gets done and paid out. The agent earns reputation onchain.</p>
        <span className="inline-block mt-2 text-xs font-medium bg-teal-700 px-2 py-0.5 rounded-full">Demo simulation</span>
      </div>

      <div className="px-6 py-6">
        {/* Actors */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Employer</div>
            <div className="font-semibold text-gray-900 text-sm">Human or dApp</div>
            <div className="text-xs text-gray-400 mt-1 font-mono">0xEmp...loyer</div>
          </div>
          <div className="flex-shrink-0 text-gray-300 text-xl">&rarr;</div>
          <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">AI Agent</div>
            <div className="font-semibold text-gray-900 text-sm">{agent.name} <span className="text-xs text-gray-400 font-normal">#{agent.tokenId}</span></div>
            <div className="text-xs text-gray-400 mt-1 font-mono">{shorten(agent.wallet)}</div>
          </div>
        </div>

        {/* Run button */}
        <div className="text-center mb-6">
          <button onClick={runDemo} disabled={running} className="px-8 py-2.5 bg-teal-600 text-white rounded-lg font-semibold text-sm hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm">
            {running ? 'Executing...' : hasRun ? 'Replay Trace' : 'Run Agent Job Demo'}
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-2 mb-6">
          {STEPS.map((step, idx) => {
            const state = stepStates[idx]
            const isActive = state === 'active'
            const isComplete = state === 'complete'
            return (
              <div key={step.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                isComplete ? 'bg-green-50 border-green-200' : isActive ? 'bg-teal-50 border-teal-300 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-50'
              }`}>
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isComplete ? 'bg-green-500 text-white' : isActive ? 'bg-teal-500 text-white animate-pulse' : 'bg-gray-200 text-gray-500'
                }`}>
                  {isComplete ? '✓' : step.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-medium text-gray-900 text-sm">{step.title}</div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isComplete ? 'bg-green-100 text-green-700' : isActive ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'
                    }`}>{state}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{step.detail}</div>
                  {step.txLink && isComplete && (
                    <a href={step.txLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-xs font-mono text-teal-600 hover:text-teal-800 hover:underline">
                      &#10003; {step.txLabel} <span className="text-gray-400">{step.txLink.includes('/tx/') ? `${step.txLink.split('/tx/')[1].slice(0, 10)}...` : ''}</span>
                    </a>
                  )}
                  {step.offchain && isComplete && (
                    <span className="inline-block mt-1.5 text-xs text-gray-400 italic">Off chain step, no transaction</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Agent Reputation</div>
            <div className="text-2xl font-bold text-teal-700 font-mono">
              {reputationDisplay}
              {hasRun && reputationDisplay > agent.reputation && <span className="text-sm text-green-600 ml-2 font-medium">+1</span>}
            </div>
            <div className="text-xs text-gray-400 mt-1">Read live from ReputationRegistry. Tick is a demo visualisation.</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Proven Flow Data</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="text-green-600 font-mono font-medium">Released</span></div>
              <div className="flex justify-between"><span className="text-gray-500">fundedViaHSP</span><span className="text-teal-600 font-mono font-medium">true</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reward</span><span className="text-gray-900 font-mono font-medium">10.0 USDC</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reputation</span><span className="text-gray-900 font-mono font-medium">95/100</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-400">
          <span>Demo simulation. Underlying contracts and HSP flow are live on HashKey Chain Testnet.</span>
          <a href={`${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 hover:underline font-medium">
            View full lifecycle on explorer
          </a>
        </div>
      </div>
    </section>
  )
}

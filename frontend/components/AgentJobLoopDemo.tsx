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
}

const STEPS: Step[] = [
  {
    id: 1,
    title: 'Someone posts a paid task',
    detail: 'Employer creates a job in JobEscrow with a USDC reward and a deadline.',
    txLink: `${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`,
    txLabel: 'JobEscrow contract',
  },
  {
    id: 2,
    title: 'The payment is locked in escrow',
    detail: 'Funded via HSP checkout, or a direct USDC transfer into the escrow contract.',
    txLink: `${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`,
    txLabel: 'View funding txs',
  },
  {
    id: 3,
    title: 'An AI agent claims the work',
    detail: 'The agent NFT is attached to the job via acceptJob().',
    txLink: `${EXPLORER_URL}/address/${CONTRACTS.agentRegistry}`,
    txLabel: 'AgentRegistry',
  },
  {
    id: 4,
    title: 'The agent finishes and submits the work',
    detail: 'Deliverable uploaded to decentralized storage. The link is recorded onchain.',
    txLink: `${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`,
    txLabel: 'View submission txs',
  },
  {
    id: 5,
    title: 'The person reviews the result',
    detail: 'Employer fetches the deliverable and decides whether to approve.',
    txLink: `${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`,
    txLabel: 'JobEscrow contract',
  },
  {
    id: 6,
    title: 'The agent gets paid automatically',
    detail: 'validateAndRelease() sends USDC from escrow to the agent wallet.',
    txLink: `${EXPLORER_URL}/address/${CONTRACTS.usdc}`,
    txLabel: 'USDC token',
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

export default function AgentJobLoopDemo() {
  const [agent, setAgent] = useState<AgentInfo>(FALLBACK_AGENT)
  const [stepStates, setStepStates] = useState<StepState[]>(
    () => STEPS.map(() => 'pending')
  )
  const [running, setRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [reputationDisplay, setReputationDisplay] = useState<number>(
    FALLBACK_AGENT.reputation
  )

  useEffect(() => {
    let cancelled = false
    const loadAgent = async () => {
      try {
        const client = createPublicClient({
          chain: hashkeyTestnet,
          transport: http(),
        })

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
        })) as {
          name: string
          capabilities: string
          endpoint: string
          wallet: `0x${string}`
          totalJobs: bigint
          completedJobs: bigint
        }

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
        setAgent({
          tokenId,
          name: profile.name || `Agent #${tokenId}`,
          wallet: profile.wallet,
          reputation,
        })
        setReputationDisplay(reputation)
      } catch (err) {
        console.error('AgentJobLoopDemo: live read failed, using fallback', err)
      }
    }
    loadAgent()
    return () => {
      cancelled = true
    }
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

    // Animate reputation tick at the end
    setReputationDisplay(agent.reputation + 1)
    setRunning(false)
  }

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms))

  return (
    <section className="mb-12 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-white">
              Watch an AI agent earn money on HashKey Chain
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              A human hires an AI agent. The money sits in escrow. The work
              gets done and paid out. The agent earns reputation onchain.
            </p>
          </div>
          <span className="px-3 py-1 bg-white/20 text-white text-xs font-medium rounded-full backdrop-blur">
            Demo simulation
          </span>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Employer
            </div>
            <div className="font-semibold text-gray-900">Human or dApp</div>
            <div className="text-xs text-gray-500 mt-1 font-mono">
              0xEmp...loyer
            </div>
          </div>
          <div className="flex-shrink-0 text-gray-400 text-2xl">⇄</div>
          <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              AI Agent
            </div>
            <div className="font-semibold text-gray-900">
              {agent.name}{' '}
              <span className="text-xs text-gray-400 font-normal">
                #{agent.tokenId}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 font-mono">
              {shorten(agent.wallet)}
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <button
            onClick={runDemo}
            disabled={running}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {running ? 'Running...' : hasRun ? 'Run again' : '▶ Run Agent Job Demo'}
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {STEPS.map((step, idx) => {
            const state = stepStates[idx]
            const isActive = state === 'active'
            const isComplete = state === 'complete'
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  isComplete
                    ? 'bg-green-50 border-green-200'
                    : isActive
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div
                  className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isComplete
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {isComplete ? '✓' : step.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-medium text-gray-900 text-sm">
                      {step.title}
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isComplete
                          ? 'bg-green-100 text-green-800'
                          : isActive
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {state}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{step.detail}</div>
                  {step.txLink && isComplete && (
                    <a
                      href={step.txLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      🔗 {step.txLabel}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Agent reputation
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {reputationDisplay}
              {hasRun && reputationDisplay > agent.reputation && (
                <span className="text-sm text-green-600 ml-2 font-medium">
                  +1
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500 max-w-xs text-right">
            On chain reputation read live from ReputationRegistry. Tick is a demo
            visualisation, the underlying contract is live on HashKey Testnet.
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500">
          <span>
            Demo simulation. Underlying contracts and HSP flow are live on
            HashKey Chain Testnet.
          </span>
          <a
            href={`${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            View full lifecycle on explorer →
          </a>
        </div>
      </div>
    </section>
  )
}

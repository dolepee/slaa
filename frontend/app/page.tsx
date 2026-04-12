'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http, formatUnits } from 'viem'
import { hashkeyTestnet, CONTRACTS, EXPLORER_URL } from '@/lib/config'
import { AGENT_REGISTRY_ABI, JOB_ESCROW_ABI } from '@/lib/contracts'
import SiteNav from '@/components/SiteNav'
import AgentJobLoopDemo from '@/components/AgentJobLoopDemo'
import Link from 'next/link'

const PROTOCOL_MODULES = [
  { name: 'AgentRegistry', desc: 'ERC-721 identity for AI agents storing name, capabilities, API endpoint, and job history', address: CONTRACTS.agentRegistry },
  { name: 'ReputationRegistry', desc: 'Employer scored reputation 0 to 100 after each completed job', address: CONTRACTS.reputationRegistry },
  { name: 'JobEscrow', desc: 'USDC escrow lifecycle: create, fund, accept, submit, validate, release, dispute, cancel', address: CONTRACTS.jobEscrow },
  { name: 'HSP Integration', desc: 'Live HSP Cart Mandate checkout and funding path. MockHSP remains as legacy fallback reference.', address: CONTRACTS.mockHSP },
]

const DEPLOYMENT_TABLE = [
  { name: 'AgentRegistry', role: 'ERC-721 agent identity NFTs', address: CONTRACTS.agentRegistry },
  { name: 'ReputationRegistry', role: 'On chain reputation scores', address: CONTRACTS.reputationRegistry },
  { name: 'JobEscrow', role: 'USDC escrow for job payments', address: CONTRACTS.jobEscrow },
  { name: 'MockHSP', role: 'Legacy simulation harness', address: CONTRACTS.mockHSP },
  { name: 'USDC (testnet)', role: 'Payment token', address: CONTRACTS.usdc },
]

export default function Home() {
  const [agentCount, setAgentCount] = useState<number>(0)
  const [jobCount, setJobCount] = useState<number>(0)
  const [totalVolume, setTotalVolume] = useState<number>(0)
  const [recentAgents, setRecentAgents] = useState<any[]>([])
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    try {
      const publicClient = createPublicClient({ chain: hashkeyTestnet, transport: http() })
      const agentTotal = await publicClient.readContract({ address: CONTRACTS.agentRegistry as `0x${string}`, abi: AGENT_REGISTRY_ABI, functionName: 'totalAgents' }) as bigint
      const jobTotal = await publicClient.readContract({ address: CONTRACTS.jobEscrow as `0x${string}`, abi: JOB_ESCROW_ABI, functionName: 'totalJobs' }) as bigint
      setAgentCount(Number(agentTotal))
      setJobCount(Number(jobTotal))

      const agentNum = Number(agentTotal)
      const agentResults: any[] = []
      for (let i = agentNum; i >= Math.max(1, agentNum - 2); i--) {
        try {
          const profile = await publicClient.readContract({ address: CONTRACTS.agentRegistry as `0x${string}`, abi: AGENT_REGISTRY_ABI, functionName: 'getAgentProfile', args: [BigInt(i)] }) as any
          agentResults.push({ tokenId: i, name: profile.name ?? profile[0] ?? `Agent #${i}`, capabilities: profile.capabilities ?? profile[1] ?? '', completedJobs: profile.completedJobs ?? profile[5] ?? BigInt(0) })
        } catch (err) { console.error(`Failed to load agent ${i}:`, err) }
      }
      setRecentAgents(agentResults)

      const jobNum = Number(jobTotal)
      const jobResults: any[] = []
      let fundedVolume = BigInt(0)
      for (let i = jobNum; i >= 1; i--) {
        try {
          const job = await publicClient.readContract({ address: CONTRACTS.jobEscrow as `0x${string}`, abi: JOB_ESCROW_ABI, functionName: 'getJob', args: [BigInt(i)] }) as any
          const reward = job.reward ?? job[2] ?? BigInt(0)
          const status = job.status ?? job[5] ?? 0
          if (Number(status) >= 1 && Number(status) <= 4) fundedVolume += reward
          if (jobResults.length < 3) jobResults.push({ jobId: i, description: job.description ?? job[3] ?? `Job #${i}`, reward, status })
        } catch (err) { console.error(`Failed to load job ${i}:`, err) }
      }
      setRecentJobs(jobResults)
      setTotalVolume(Number(formatUnits(fundedVolume, 6)))
    } catch (err) { console.error('Failed to load stats:', err) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <SiteNav current="home" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <section className="pt-16 pb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight max-w-3xl leading-tight">
            Settlement Layer for Autonomous Agents
          </h2>
          <p className="text-lg text-gray-500 mt-4 max-w-2xl leading-relaxed">
            SLAA lets AI agents register on chain, accept work, receive escrowed USDC payments, and build verifiable reputation on HashKey Chain.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <a href="#live-demo" className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm">Run Live Demo</a>
            <Link href="/jobs/create" className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Post a Job</Link>
            <Link href="/agents/register" className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Register Agent</Link>
            <a href="#contracts" className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">View Contracts</a>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            {['HashKey Chain Testnet', 'HSP checkout proven', 'USDC escrow', 'Agent NFT identity', 'On chain reputation'].map((chip) => (
              <span key={chip} className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1">{chip}</span>
            ))}
          </div>
          {/* Protocol flow */}
          <div className="mt-10 flex items-center gap-2 overflow-x-auto pb-2">
            {['Employer', 'HSP Checkout', 'JobEscrow', 'Agent', 'Reputation'].map((node, i, arr) => (
              <div key={node} className="flex items-center gap-2 flex-shrink-0">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 font-medium shadow-sm">{node}</div>
                {i < arr.length - 1 && <span className="text-gray-300 font-mono">&rarr;</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Demo */}
        <section className="pb-12"><AgentJobLoopDemo /></section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-12">
          {[
            { label: 'Registered Agents', value: agentCount, color: 'text-teal-700' },
            { label: 'Jobs Created', value: jobCount, color: 'text-green-700' },
            { label: 'Total Volume', value: `$${totalVolume}`, color: 'text-gray-900' },
            { label: 'Chain ID', value: '133', color: 'text-gray-700' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              {loading ? <div className="skeleton h-8 w-16 mb-1" /> : <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>}
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Recent Agents / Jobs */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-14">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Recent Agents</h3>
              <Link href="/marketplace" className="text-xs text-teal-600 hover:text-teal-800">View all</Link>
            </div>
            {loading ? <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"><div className="skeleton h-4 w-32" /></div> : recentAgents.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center text-sm text-gray-400">No agents registered yet</div>
            ) : (
              <div className="space-y-2">
                {recentAgents.map((agent) => (
                  <div key={agent.tokenId} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{agent.name || `Agent #${agent.tokenId}`}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{agent.capabilities || 'No capabilities listed'}</div>
                      </div>
                      <span className="text-xs font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">#{agent.tokenId}</span>
                    </div>
                    <div className="mt-1.5 text-xs text-gray-400 font-mono">{agent.completedJobs?.toString() || '0'} jobs completed</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Recent Jobs</h3>
              <Link href="/jobs" className="text-xs text-teal-600 hover:text-teal-800">View all</Link>
            </div>
            {loading ? <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"><div className="skeleton h-4 w-32" /></div> : recentJobs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center text-sm text-gray-400">No jobs posted yet</div>
            ) : (
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <Link key={job.jobId} href={`/jobs/${job.jobId}`}>
                    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.description || `Job #${job.jobId}`}</div>
                          <div className="text-xs text-gray-500 mt-0.5 font-mono">{formatUnits(job.reward || BigInt(0), 6)} USDC</div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          Number(job.status) === 4 ? 'bg-green-100 text-green-700' : Number(job.status) >= 1 ? 'bg-teal-100 text-teal-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {['Created','Funded','Accepted','Submitted','Released','Disputed','Cancelled'][Number(job.status)] || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Protocol Modules */}
        <section className="pb-14">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Protocol Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROTOCOL_MODULES.map((mod) => (
              <div key={mod.name} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="text-sm font-bold text-gray-900 mb-1">{mod.name}</div>
                <div className="text-xs text-gray-500 mb-3 leading-relaxed">{mod.desc}</div>
                <a href={`${EXPLORER_URL}/address/${mod.address}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-teal-600 hover:text-teal-800 hover:underline break-all">{mod.address}</a>
              </div>
            ))}
          </div>
        </section>

        {/* Deployment Table */}
        <section id="contracts" className="pb-14">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Deployed Contracts</h3>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Contract</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 hidden sm:table-cell">Role</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Address</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">Explorer</th>
                </tr>
              </thead>
              <tbody>
                {DEPLOYMENT_TABLE.map((row) => (
                  <tr key={row.name} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-900 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{row.role}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.address.slice(0, 10)}...{row.address.slice(-6)}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={`${EXPLORER_URL}/address/${row.address}`} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:text-teal-800 font-mono hover:underline">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-400 mt-2">HashKey Chain Testnet, Chain ID 133</div>
        </section>

        {/* Hackathon CTA */}
        <section className="pb-14">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Built for HashKey Chain Horizon Hackathon</h3>
            <p className="text-sm text-gray-500 mb-1">PayFi track &middot; Agent Identity &middot; HSP Integration</p>
            <p className="text-xs text-gray-400 mb-4">Live testnet demo supports both direct USDC escrow funding and HSP checkout with webhook based funding confirmation.</p>
            <a href="https://dorahacks.io/hackathon/2045/detail" target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 text-teal-700 border border-teal-300 rounded-lg text-sm font-medium hover:bg-teal-50 transition-colors">View on DoraHacks</a>
          </div>
        </section>
      </main>
    </div>
  )
}

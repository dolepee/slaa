'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http, formatUnits } from 'viem'
import { hashkeyTestnet, CONTRACTS } from '@/lib/config'
import { AGENT_REGISTRY_ABI, JOB_ESCROW_ABI } from '@/lib/contracts'
import SiteNav from '@/components/SiteNav'
import AgentJobLoopDemo from '@/components/AgentJobLoopDemo'
import Link from 'next/link'

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
        <section className="pt-16 pb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Settlement Layer for Autonomous Agents
          </h2>
          <p className="text-base text-gray-500 mt-4 leading-relaxed">
            AI agents need PayFi infrastructure. SLAA provides on chain identity, escrow with validation triggers, and live HSP payment rails on HashKey Chain.
          </p>
          <div className="flex justify-center gap-3 mt-8">
            <Link href="/agents/register" className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm">Register Agent</Link>
            <Link href="/jobs/create" className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Post a Job</Link>
          </div>
        </section>

        {/* Demo */}
        <section className="pb-12"><AgentJobLoopDemo /></section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-4 pb-12">
          {[
            { label: 'Registered Agents', value: agentCount, color: 'text-teal-700' },
            { label: 'Jobs Created', value: jobCount, color: 'text-green-700' },
            { label: 'Total Volume', value: `$${totalVolume}`, color: 'text-gray-900' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
              {loading ? <div className="skeleton h-8 w-16 mx-auto mb-1" /> : <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>}
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

      </main>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http, formatUnits } from 'viem'
import { hashkeyTestnet, CONTRACTS } from '@/lib/config'
import { AGENT_REGISTRY_ABI, JOB_ESCROW_ABI } from '@/lib/contracts'
import SiteNav from '@/components/SiteNav'
import AgentJobLoopDemo from '@/components/AgentJobLoopDemo'
import Link from 'next/link'
import { Users, Briefcase, DollarSign, ArrowUpRight } from 'lucide-react'

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
        <section className="pt-20 pb-16 text-center hero-glow">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            <span className="text-white">Settlement Layer for </span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Autonomous Agents
            </span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400 mt-5 max-w-2xl mx-auto leading-relaxed">
            AI agents need PayFi infrastructure. SLAA provides on chain identity, escrow with validation triggers, and live HSP payment rails on HashKey Chain.
          </p>
          <div className="flex justify-center gap-3 mt-8">
            <Link href="/jobs/create"
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all">
              Post a Job
            </Link>
            <Link href="/agents/register"
              className="px-6 py-3 rounded-xl text-sm font-medium text-gray-300 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all">
              Register Agent
            </Link>
          </div>
        </section>

        {/* Demo */}
        <section className="pb-16"><AgentJobLoopDemo /></section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-16">
          {[
            { label: 'Registered Agents', value: agentCount, icon: Users, gradient: 'from-cyan-500/20 to-cyan-500/0' },
            { label: 'Jobs Created', value: jobCount, icon: Briefcase, gradient: 'from-blue-500/20 to-blue-500/0' },
            { label: 'Total Volume', value: `$${totalVolume}`, icon: DollarSign, gradient: 'from-purple-500/20 to-purple-500/0' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card !rounded-xl p-5 relative overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-b ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <stat.icon className="w-5 h-5 text-gray-500 mb-3" />
                {loading ? (
                  <div className="skeleton h-9 w-20 mb-1" />
                ) : (
                  <div className="text-3xl font-bold text-white font-mono">{stat.value}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Recent Activity */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          {/* Recent Agents */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Recent Agents</h3>
              <Link href="/marketplace" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="glass-card !rounded-xl p-6"><div className="skeleton h-4 w-32" /></div>
            ) : recentAgents.length === 0 ? (
              <div className="glass-card !rounded-xl p-6 text-center text-sm text-gray-500">No agents registered yet</div>
            ) : (
              <div className="space-y-2">
                {recentAgents.map((agent) => (
                  <div key={agent.tokenId} className="glass-card !rounded-xl p-4 group cursor-default">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-cyan-400">{(agent.name || 'A')[0]}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{agent.name || `Agent #${agent.tokenId}`}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{agent.capabilities || 'No capabilities listed'}</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-cyan-400/60">#{agent.tokenId}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 font-mono">{agent.completedJobs?.toString() || '0'} jobs completed</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Jobs */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Recent Jobs</h3>
              <Link href="/jobs" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="glass-card !rounded-xl p-6"><div className="skeleton h-4 w-32" /></div>
            ) : recentJobs.length === 0 ? (
              <div className="glass-card !rounded-xl p-6 text-center text-sm text-gray-500">No jobs posted yet</div>
            ) : (
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <Link key={job.jobId} href={`/jobs/${job.jobId}`}>
                    <div className="glass-card !rounded-xl p-4 group">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">{job.description || `Job #${job.jobId}`}</div>
                          <div className="text-xs text-gray-500 mt-0.5 font-mono">{formatUnits(job.reward || BigInt(0), 6)} USDC</div>
                        </div>
                        <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${
                          Number(job.status) === 4 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : Number(job.status) >= 1 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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

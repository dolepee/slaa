'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http } from 'viem'
import { hashkeyTestnet, CONTRACTS, EXPLORER_URL } from '@/lib/config'
import SiteNav from '@/components/SiteNav'
import Link from 'next/link'
import { AGENT_REGISTRY_ABI } from '@/lib/contracts'

export default function Marketplace() {
  const [agentProfiles, setAgentProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAgents() }, [])

  const loadAgents = async () => {
    try {
      const publicClient = createPublicClient({ chain: hashkeyTestnet, transport: http() })
      const count = await publicClient.readContract({
        address: CONTRACTS.agentRegistry as `0x${string}`,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'totalAgents',
      }) as bigint

      const profiles = []
      for (let i = 1; i <= Number(count); i++) {
        try {
          const profile = await publicClient.readContract({
            address: CONTRACTS.agentRegistry as `0x${string}`,
            abi: AGENT_REGISTRY_ABI,
            functionName: 'getAgentProfile',
            args: [BigInt(i)],
          }) as any
          profiles.push({ tokenId: i, name: profile.name || profile[0], capabilities: profile.capabilities || profile[1], endpoint: profile.endpoint || profile[2], wallet: profile.wallet || profile[3], totalJobs: profile.totalJobs || profile[4], completedJobs: profile.completedJobs || profile[5] })
        } catch {
          profiles.push({ tokenId: i, name: `Agent #${i}`, capabilities: 'Unknown', endpoint: '', wallet: '', totalJobs: BigInt(0), completedJobs: BigInt(0) })
        }
      }
      setAgentProfiles(profiles)
    } catch (err) {
      console.error('Failed to load agents:', err)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <SiteNav current="agents" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-white">Agent Marketplace</h1>
          <span className="text-xs text-gray-600 font-mono">{agentProfiles.length} registered</span>
        </div>

        {loading ? (
          <div className="card p-8 text-center"><div className="skeleton h-4 w-32 mx-auto" /></div>
        ) : agentProfiles.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500 mb-3">No agents registered yet.</p>
            <Link href="/agents/register" className="text-sm text-teal-400 hover:text-teal-300">Be the first to register</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agentProfiles.map((agent) => (
              <div key={agent.tokenId} className="card card-hover p-4 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-200">{agent.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{agent.capabilities}</div>
                  </div>
                  <span className="text-[11px] font-mono text-teal-400/60 bg-teal-500/[0.06] px-1.5 py-0.5 rounded">
                    #{agent.tokenId}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.04] flex justify-between items-center">
                  <span className="text-xs text-gray-600 font-mono">
                    {Number(agent.completedJobs)}/{Number(agent.totalJobs)} completed
                  </span>
                  <a href={`${EXPLORER_URL}/address/${agent.wallet}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-teal-500/60 hover:text-teal-400 font-mono transition-colors">
                    Wallet
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

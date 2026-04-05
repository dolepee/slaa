'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http } from 'viem'
import { hashkeyTestnet, CONTRACTS, EXPLORER_URL } from '@/lib/config'
import { WalletConnect } from '@/lib/wallet'
import Link from 'next/link'
import { AGENT_REGISTRY_ABI } from '@/lib/contracts'

export default function Marketplace() {
  const [agents, setAgents] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const publicClient = createPublicClient({
        chain: hashkeyTestnet,
        transport: http()
      })

      const count = await publicClient.readContract({
        address: CONTRACTS.agentRegistry as `0x${string}`,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'totalAgents',
      }) as bigint

      const agentIds = Array.from({ length: Number(count) }, (_, i) => i + 1)
      setAgents(agentIds)
    } catch (err) {
      console.error('Failed to load agents:', err)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">SLAA</Link>
              <span className="ml-4 text-sm text-gray-500">Agent Marketplace</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/agents/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Register Agent
              </Link>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Agent Marketplace</h1>
          <span className="text-gray-500">{agents.length} agents registered</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 mb-4">No agents registered yet.</p>
            <Link href="/agents/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Be the first to register →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((tokenId) => (
              <div key={tokenId} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Agent #{tokenId}</h3>
                    <p className="text-sm text-gray-500">Connect to view details</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    ID #{tokenId}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a href={`${EXPLORER_URL}/address/${CONTRACTS.agentRegistry}`} className="text-sm text-blue-600 hover:text-blue-800">
                    View Contract →
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

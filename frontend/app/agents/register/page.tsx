'use client'

import { useState } from 'react'
import { createWalletClient, custom } from 'viem'
import { hashkeyTestnet, CONTRACTS } from '@/lib/config'
import Link from 'next/link'
import { AGENT_REGISTRY_ABI } from '@/lib/contracts'

export default function RegisterAgent() {
  const [name, setName] = useState('')
  const [capabilities, setCapabilities] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setTxHash(null)

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask')
      }

      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: hashkeyTestnet,
        transport: custom(window.ethereum)
      })

      const hash = await walletClient.writeContract({
        account: address as `0x${string}`,
        address: CONTRACTS.agentRegistry as `0x${string}`,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'mintAgent',
        args: [name, capabilities, endpoint],
      })

      setTxHash(hash)
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">SLAA</Link>
              <span className="ml-4 text-sm text-gray-500">Register Agent</span>
            </div>
            <Link href="/marketplace" className="text-sm text-gray-600 hover:text-gray-900">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Register Your Agent</h1>
          <p className="text-gray-600 mb-6">
            Create an on-chain identity for your AI agent. Agents can accept jobs and receive payments.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Research Agent Alpha"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capabilities
              </label>
              <input
                type="text"
                value={capabilities}
                onChange={(e) => setCapabilities(e.target.value)}
                placeholder="data-scraping, analysis, reporting"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Comma-separated list of what your agent can do
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Endpoint
              </label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://api.agent.com/your-agent"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                URL where the agent can be reached
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Waiting for wallet...' : 'Register Agent'}
              </button>
            </div>

            {txHash && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Transaction submitted!</p>
                <a 
                  href={`${hashkeyTestnet.blockExplorers?.default?.url}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  View on Explorer →
                </a>
              </div>
            )}
          </form>
        </div>

        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-medium text-purple-900 mb-2">What you get:</h3>
          <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
            <li>Unique agent NFT identity on HashKey Chain</li>
            <li>Reputation scores from completed jobs</li>
            <li>Direct USDC payments via escrow</li>
            <li>Discoverable in the agent marketplace</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { createWalletClient, custom } from 'viem'
import { hashkeyTestnet, CONTRACTS } from '@/lib/config'
import SiteNav from '@/components/SiteNav'
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
      if (!window.ethereum) throw new Error('Please install MetaMask')
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const walletClient = createWalletClient({ account: address as `0x${string}`, chain: hashkeyTestnet, transport: custom(window.ethereum) })
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
    <div className="min-h-screen">
      <SiteNav current="register" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white mb-1">Register Your Agent</h1>
          <p className="text-sm text-gray-500 mb-6">
            Create an on chain identity for your AI agent. Agents can accept jobs and receive payments.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Agent Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Research Agent Alpha"
                className="input-dark w-full"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Capabilities</label>
              <input
                type="text"
                value={capabilities}
                onChange={(e) => setCapabilities(e.target.value)}
                placeholder="data-scraping, analysis, reporting"
                className="input-dark w-full"
                required
              />
              <p className="mt-1 text-[11px] text-gray-600">Comma separated list of what your agent can do</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">API Endpoint</label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://api.agent.com/your-agent"
                className="input-dark w-full font-mono text-sm"
                required
              />
              <p className="mt-1 text-[11px] text-gray-600">URL where the agent can be reached</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Waiting for wallet...' : 'Register Agent'}
            </button>

            {txHash && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-emerald-400 font-medium text-sm">Transaction submitted!</p>
                <a
                  href={`${hashkeyTestnet.blockExplorers?.default?.url}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-500/60 hover:text-teal-400 text-xs font-mono"
                >
                  View on Explorer
                </a>
              </div>
            )}
          </form>
        </div>

        <div className="card p-4 mt-4">
          <h3 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">What you get</h3>
          <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
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

'use client'

import { WalletConnect } from '@/lib/wallet'
import Link from 'next/link'

// Agent Card Component
function AgentCard({ tokenId }: { tokenId: number }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Agent #{tokenId}</h3>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          ID #{tokenId}
        </span>
      </div>
    </div>
  )
}

// Job Card Component  
function JobCard({ jobId }: { jobId: number }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900">Job #{jobId}</h3>
      <p className="text-sm text-gray-500 mt-1">Loading...</p>
      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
        USDC
      </span>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SLAA</h1>
              <span className="ml-2 text-xs text-gray-500">HashKey Chain</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/marketplace" className="text-sm text-gray-600 hover:text-gray-900">
                Agents
              </Link>
              <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900">
                Jobs
              </Link>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Settlement Layer for Autonomous Agents
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI agents need PayFi infrastructure. SLAA provides on-chain identity, 
            escrow with validation triggers, and HSP payment rails on HashKey Chain.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/agents/register"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Register Agent
            </Link>
            <Link
              href="/jobs/create"
              className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Post a Job
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">--</div>
            <div className="text-gray-600 mt-1">Registered Agents</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600">--</div>
            <div className="text-gray-600 mt-1">Active Jobs</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">$0</div>
            <div className="text-gray-600 mt-1">Total Volume</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Recent Agents</h3>
              <Link href="/marketplace" className="text-blue-600 hover:text-blue-800 text-sm">
                View all →
              </Link>
            </div>
            <div className="text-center py-8 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">Connect wallet to see agents</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Recent Jobs</h3>
              <Link href="/jobs" className="text-blue-600 hover:text-blue-800 text-sm">
                View all →
              </Link>
            </div>
            <div className="text-center py-8 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">Connect wallet to see jobs</p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-2">Built for HashKey Chain Horizon Hackathon</h3>
          <p className="text-blue-100 mb-4">
            PayFi track • ERC-8004 Agent Identity • HSP Integration • KYC Gated
          </p>
          <a
            href="https://dorahacks.io/hackathon/2045/detail"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            View on DoraHacks →
          </a>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { createWalletClient, createPublicClient, http, custom, parseUnits } from 'viem'
import { hashkeyTestnet, CONTRACTS } from '@/lib/config'
import { WalletConnect } from '@/lib/wallet'
import Link from 'next/link'
import { JOB_ESCROW_ABI, USDC_ABI } from '@/lib/contracts'

export default function CreateJob() {
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [deadline, setDeadline] = useState('7')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
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
      const publicClient = createPublicClient({
        chain: hashkeyTestnet,
        transport: http()
      })

      const rewardInWei = parseUnits(reward, 6) // USDC has 6 decimals
      const deadlineSeconds = BigInt(parseInt(deadline) * 24 * 60 * 60)

      // Step 1: Create job
      setStatusMsg('Creating job...')
      const createHash = await walletClient.writeContract({
        account: address as `0x${string}`,
        address: CONTRACTS.jobEscrow as `0x${string}`,
        abi: JOB_ESCROW_ABI,
        functionName: 'createJob',
        args: [description, rewardInWei, deadlineSeconds],
      })
      await publicClient.waitForTransactionReceipt({ hash: createHash })
      setStatusMsg('Job created! Approving USDC...')

      // Step 2: Approve USDC
      const approveHash = await walletClient.writeContract({
        account: address as `0x${string}`,
        address: CONTRACTS.usdc as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACTS.jobEscrow as `0x${string}`, rewardInWei],
      })
      await publicClient.waitForTransactionReceipt({ hash: approveHash })
      setStatusMsg('USDC approved! Funding job...')

      // Step 3: Fund job
      const fundHash = await walletClient.writeContract({
        account: address as `0x${string}`,
        address: CONTRACTS.jobEscrow as `0x${string}`,
        abi: JOB_ESCROW_ABI,
        functionName: 'fundJob',
        args: [BigInt(1)], // jobId 1 for demo
      })
      await publicClient.waitForTransactionReceipt({ hash: fundHash })
      
      setStatusMsg('Done!')
      setTxHash(fundHash)
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
              <span className="ml-4 text-sm text-gray-500">Post a Job</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900">
                Back to Jobs
              </Link>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Job</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task you need completed..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reward (USDC)
              </label>
              <input
                type="number"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="50.00"
                step="0.01"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Amount in USDC that will be held in escrow
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline (days)
              </label>
              <input
                type="number"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="7"
                min="1"
                max="90"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
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
                {isLoading ? statusMsg || 'Processing...' : 'Create Job'}
              </button>
            </div>

            {txHash && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Job created and funded successfully!</p>
                <a 
                  href={`${hashkeyTestnet.blockExplorers?.default?.url}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  View on Explorer →
                </a>
                <Link href="/jobs" className="block mt-2 text-green-600 hover:text-green-800 text-sm">
                  View all jobs →
                </Link>
              </div>
            )}
          </form>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Create job and fund with USDC</li>
            <li>Agent accepts the job</li>
            <li>Agent submits work with deliverable</li>
            <li>You validate and release payment</li>
          </ol>
        </div>
      </main>
    </div>
  )
}

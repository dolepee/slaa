'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, createWalletClient, http, custom } from 'viem'
import { hashkeyTestnet, CONTRACTS, EXPLORER_URL } from '@/lib/config'
import { WalletConnect } from '@/lib/wallet'
import Link from 'next/link'
import { JOB_STATUS, JOB_ESCROW_ABI } from '@/lib/contracts'

export default function JobDetail({ params }: { params: { id: string } }) {
  const jobId = parseInt(params.id)
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliverableCID, setDeliverableCID] = useState('')
  const [reputationScore, setReputationScore] = useState('85')

  useEffect(() => {
    loadJob()
  }, [jobId])

  const loadJob = async () => {
    try {
      const publicClient = createPublicClient({
        chain: hashkeyTestnet,
        transport: http()
      })

      const jobData = await publicClient.readContract({
        address: CONTRACTS.jobEscrow as `0x${string}`,
        abi: JOB_ESCROW_ABI,
        functionName: 'getJob',
        args: [BigInt(jobId)],
      })

      setJob(jobData)
    } catch (err) {
      console.error('Failed to load job:', err)
    }
    setLoading(false)
  }

  const handleSubmitWork = async () => {
    if (!window.ethereum || !deliverableCID) return
    
    setIsSubmitting(true)
    try {
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: hashkeyTestnet,
        transport: custom(window.ethereum)
      })

      const hash = await walletClient.writeContract({
        account: address as `0x${string}`,
        address: CONTRACTS.jobEscrow as `0x${string}`,
        abi: JOB_ESCROW_ABI,
        functionName: 'submitWork',
        args: [BigInt(jobId), deliverableCID],
      })

      console.log('Work submitted:', hash)
      await loadJob()
    } catch (err) {
      console.error('Failed to submit work:', err)
    }
    setIsSubmitting(false)
  }

  const handleValidateAndRelease = async () => {
    if (!window.ethereum) return
    
    setIsSubmitting(true)
    try {
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: hashkeyTestnet,
        transport: custom(window.ethereum)
      })

      const hash = await walletClient.writeContract({
        account: address as `0x${string}`,
        address: CONTRACTS.jobEscrow as `0x${string}`,
        abi: JOB_ESCROW_ABI,
        functionName: 'validateAndRelease',
        args: [BigInt(jobId), BigInt(parseInt(reputationScore))],
      })

      console.log('Payment released:', hash)
      await loadJob()
    } catch (err) {
      console.error('Failed to validate:', err)
    }
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Job not found</p>
      </div>
    )
  }

  const status = Number(job.status)
  const reward = Number(job.reward) / 1e6

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">SLAA</Link>
              <span className="ml-4 text-sm text-gray-500">Job #{jobId}</span>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job #{jobId}</h1>
              <p className="text-gray-600 mt-2">{job.description}</p>
            </div>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
              {reward} USDC
            </span>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold mb-4">Status: {JOB_STATUS[status as keyof typeof JOB_STATUS] || status}</h2>
            
            <div className="flex items-center space-x-2 mb-6">
              {[0, 1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      status >= s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {s + 1}
                  </div>
                  {s < 4 && (
                    <div className={`w-8 h-0.5 mx-1 ${status > s ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Employer:</span>
                <span className="ml-2 font-mono">{job.employer}</span>
              </div>
              <div>
                <span className="text-gray-500">Agent:</span>
                <span className="ml-2">{job.agentTokenId > 0 ? `Agent #${job.agentTokenId}` : 'Not assigned'}</span>
              </div>
            </div>
          </div>

          {status === 1 && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">Accept This Job</h3>
              <p className="text-sm text-yellow-800 mb-3">This job is funded and waiting for an agent. Enter your Agent Token ID to accept.</p>
              <div className="flex gap-3 mb-3">
                <input
                  type="number"
                  id="agentTokenId"
                  placeholder="Agent Token ID"
                  min="1"
                  className="w-40 px-4 py-2 border border-yellow-300 rounded-lg"
                />
                <button
                  onClick={async () => {
                    if (!window.ethereum) return
                    setIsSubmitting(true)
                    try {
                      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
                      const walletClient = createWalletClient({
                        account: address as `0x${string}`,
                        chain: hashkeyTestnet,
                        transport: custom(window.ethereum)
                      })
                      const tokenIdInput = (document.getElementById('agentTokenId') as HTMLInputElement).value
                      const hash = await walletClient.writeContract({
                        account: address as `0x${string}`,
                        address: CONTRACTS.jobEscrow as `0x${string}`,
                        abi: JOB_ESCROW_ABI,
                        functionName: 'acceptJob',
                        args: [BigInt(jobId), BigInt(tokenIdInput)],
                      })
                      console.log('Job accepted:', hash)
                      await loadJob()
                    } catch (err) {
                      console.error('Failed to accept job:', err)
                    }
                    setIsSubmitting(false)
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Accepting...' : 'Accept Job'}
                </button>
              </div>
            </div>
          )}

          {status === 2 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Submit Work</h3>
              <input
                type="text"
                value={deliverableCID}
                onChange={(e) => setDeliverableCID(e.target.value)}
                placeholder="ipfs://Qm..."
                className="w-full px-4 py-2 border border-green-300 rounded-lg mb-3"
              />
              <button
                onClick={handleSubmitWork}
                disabled={!deliverableCID || isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          )}

          {status === 3 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Validate & Release Payment</h3>
              <div className="flex gap-3 mb-3">
                <input
                  type="number"
                  value={reputationScore}
                  onChange={(e) => setReputationScore(e.target.value)}
                  placeholder="85"
                  min="0"
                  max="100"
                  className="w-24 px-4 py-2 border border-blue-300 rounded-lg"
                />
                <button
                  onClick={handleValidateAndRelease}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Processing...' : 'Validate & Release'}
                </button>
              </div>
              <p className="text-sm text-blue-700">Rate the agent&apos;s work (0-100)</p>
            </div>
          )}

          {status === 4 && (
            <div className="mt-6 p-4 bg-green-100 rounded-lg">
              <p className="text-green-800 font-medium">✓ Payment released successfully!</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <a
              href={`${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Contract on Explorer →
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

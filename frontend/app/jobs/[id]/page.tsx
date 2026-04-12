'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, createWalletClient, http, custom } from 'viem'
import { hashkeyTestnet, CONTRACTS, EXPLORER_URL } from '@/lib/config'
import SiteNav from '@/components/SiteNav'
import Link from 'next/link'
import { JOB_STATUS, JOB_ESCROW_ABI } from '@/lib/contracts'

export default function JobDetail({ params }: { params: { id: string } }) {
  const jobId = parseInt(params.id)
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [acceptTokenId, setAcceptTokenId] = useState('')
  const [deliverableCID, setDeliverableCID] = useState('')
  const [reputationScore, setReputationScore] = useState('85')

  useEffect(() => { loadJob() }, [jobId])

  const loadJob = async () => {
    try {
      const publicClient = createPublicClient({ chain: hashkeyTestnet, transport: http() })
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
      const walletClient = createWalletClient({ account: address as `0x${string}`, chain: hashkeyTestnet, transport: custom(window.ethereum) })
      await walletClient.writeContract({
        account: address as `0x${string}`,
        address: CONTRACTS.jobEscrow as `0x${string}`,
        abi: JOB_ESCROW_ABI,
        functionName: 'submitWork',
        args: [BigInt(jobId), deliverableCID],
      })
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
      const walletClient = createWalletClient({ account: address as `0x${string}`, chain: hashkeyTestnet, transport: custom(window.ethereum) })
      await walletClient.writeContract({
        account: address as `0x${string}`,
        address: CONTRACTS.jobEscrow as `0x${string}`,
        abi: JOB_ESCROW_ABI,
        functionName: 'validateAndRelease',
        args: [BigInt(jobId), BigInt(parseInt(reputationScore))],
      })
      await loadJob()
    } catch (err) {
      console.error('Failed to validate:', err)
    }
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteNav current="jobs" />
        <div className="flex items-center justify-center py-20"><div className="skeleton h-4 w-32" /></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen">
        <SiteNav current="jobs" />
        <div className="flex items-center justify-center py-20"><p className="text-gray-500 text-sm">Job not found</p></div>
      </div>
    )
  }

  const status = Number(job.status)
  const reward = Number(job.reward) / 1e6

  return (
    <div className="min-h-screen">
      <SiteNav current="jobs" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/jobs" className="inline-flex items-center text-xs text-gray-400 hover:text-gray-600 mb-4">
          &larr; Back to Job Board
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Job <span className="font-mono">#{jobId}</span></h1>
              <p className="text-sm text-gray-500 mt-1">{job.description}</p>
            </div>
            <span className="text-lg font-bold font-mono text-teal-700">{reward} USDC</span>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Status: <span className="text-teal-600">{JOB_STATUS[status as keyof typeof JOB_STATUS] || status}</span>
            </h2>

            {/* Progress indicator */}
            <div className="flex items-center space-x-2 mb-5">
              {[0, 1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    status >= s ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {status > s ? '\u2713' : s + 1}
                  </div>
                  {s < 4 && <div className={`w-6 h-0.5 mx-1 ${status > s ? 'bg-teal-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Employer</span>
                <div className="font-mono text-xs text-gray-600 mt-0.5 break-all">{job.employer}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Agent</span>
                <div className="text-xs text-gray-600 mt-0.5 font-mono">{job.agentTokenId > 0 ? `Token #${job.agentTokenId}` : 'Not assigned'}</div>
              </div>
            </div>
          </div>

          {/* Accept Job */}
          {status === 1 && (
            <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-medium text-amber-800 mb-2">Accept This Job</h3>
              <p className="text-xs text-gray-500 mb-3">This job is funded and waiting for an agent.</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={acceptTokenId}
                  onChange={(e) => setAcceptTokenId(e.target.value)}
                  placeholder="Agent Token ID"
                  min="1"
                  className="px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm w-36 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  onClick={async () => {
                    if (!window.ethereum) return
                    setIsSubmitting(true)
                    try {
                      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
                      const walletClient = createWalletClient({ account: address as `0x${string}`, chain: hashkeyTestnet, transport: custom(window.ethereum) })
                      if (!acceptTokenId) throw new Error('Agent token ID is required')
                      await walletClient.writeContract({
                        account: address as `0x${string}`,
                        address: CONTRACTS.jobEscrow as `0x${string}`,
                        abi: JOB_ESCROW_ABI,
                        functionName: 'acceptJob',
                        args: [BigInt(jobId), BigInt(acceptTokenId)],
                      })
                      await loadJob()
                    } catch (err) {
                      console.error('Failed to accept job:', err)
                    }
                    setIsSubmitting(false)
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Accepting...' : 'Accept Job'}
                </button>
              </div>
            </div>
          )}

          {/* Submit Work */}
          {status === 2 && (
            <div className="mt-5 p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <h3 className="text-sm font-medium text-teal-800 mb-2">Submit Work</h3>
              <input
                type="text"
                value={deliverableCID}
                onChange={(e) => setDeliverableCID(e.target.value)}
                placeholder="ipfs://Qm..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm mb-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                onClick={handleSubmitWork}
                disabled={!deliverableCID || isSubmitting}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          )}

          {/* Validate & Release */}
          {status === 3 && (
            <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-2">Validate & Release Payment</h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={reputationScore}
                  onChange={(e) => setReputationScore(e.target.value)}
                  placeholder="85"
                  min="0"
                  max="100"
                  className="px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm w-24 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  onClick={handleValidateAndRelease}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Processing...' : 'Validate & Release'}
                </button>
              </div>
              <p className="text-xs text-gray-500">Rate the agent&apos;s work (0 to 100)</p>
            </div>
          )}

          {/* Released */}
          {status === 4 && (
            <div className="mt-5 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium text-sm">Payment released successfully</p>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gray-100">
            {job.fundedViaHSP && (
              <p className="mb-2 text-xs text-teal-600">This job was funded through HSP checkout.</p>
            )}
            <a
              href={`${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-600 hover:text-teal-800 font-mono hover:underline transition-colors"
            >
              View Contract on Explorer
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

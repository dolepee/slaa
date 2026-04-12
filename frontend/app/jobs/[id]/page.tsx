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
        <div className="flex items-center justify-center py-20"><p className="text-gray-600">Job not found</p></div>
      </div>
    )
  }

  const status = Number(job.status)
  const reward = Number(job.reward) / 1e6

  return (
    <div className="min-h-screen">
      <SiteNav current="jobs" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-6 sm:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-xl font-bold text-white">Job <span className="font-mono">#{jobId}</span></h1>
              <p className="text-sm text-gray-400 mt-1">{job.description}</p>
            </div>
            <span className="text-lg font-bold font-mono text-teal-400">{reward} USDC</span>
          </div>

          <div className="border-t border-white/[0.06] pt-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              Status: <span className="text-teal-400">{JOB_STATUS[status as keyof typeof JOB_STATUS] || status}</span>
            </h2>

            {/* Progress indicator */}
            <div className="flex items-center space-x-2 mb-5">
              {[0, 1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    status >= s ? 'bg-teal-500 text-black' : 'bg-white/[0.06] text-gray-600'
                  }`}>
                    {s + 1}
                  </div>
                  {s < 4 && <div className={`w-6 h-0.5 mx-1 ${status > s ? 'bg-teal-500' : 'bg-white/[0.06]'}`} />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                <span className="text-[11px] text-gray-600 uppercase tracking-wider">Employer</span>
                <div className="font-mono text-xs text-gray-400 mt-0.5">{job.employer}</div>
              </div>
              <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                <span className="text-[11px] text-gray-600 uppercase tracking-wider">Agent</span>
                <div className="text-xs text-gray-400 mt-0.5 font-mono">{job.agentTokenId > 0 ? `Token #${job.agentTokenId}` : 'Not assigned'}</div>
              </div>
            </div>
          </div>

          {/* Accept Job */}
          {status === 1 && (
            <div className="mt-5 p-4 bg-amber-500/[0.04] border border-amber-500/20 rounded-lg">
              <h3 className="text-sm font-medium text-amber-300 mb-2">Accept This Job</h3>
              <p className="text-xs text-gray-500 mb-3">This job is funded and waiting for an agent.</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={acceptTokenId}
                  onChange={(e) => setAcceptTokenId(e.target.value)}
                  placeholder="Agent Token ID"
                  min="1"
                  className="input-dark w-36 font-mono text-sm"
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
                  className="btn-primary text-sm !bg-amber-500 hover:!bg-amber-400"
                >
                  {isSubmitting ? 'Accepting...' : 'Accept Job'}
                </button>
              </div>
            </div>
          )}

          {/* Submit Work */}
          {status === 2 && (
            <div className="mt-5 p-4 bg-teal-500/[0.04] border border-teal-500/20 rounded-lg">
              <h3 className="text-sm font-medium text-teal-300 mb-2">Submit Work</h3>
              <input
                type="text"
                value={deliverableCID}
                onChange={(e) => setDeliverableCID(e.target.value)}
                placeholder="ipfs://Qm..."
                className="input-dark w-full mb-3 font-mono text-sm"
              />
              <button
                onClick={handleSubmitWork}
                disabled={!deliverableCID || isSubmitting}
                className="btn-primary text-sm"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          )}

          {/* Validate & Release */}
          {status === 3 && (
            <div className="mt-5 p-4 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-lg">
              <h3 className="text-sm font-medium text-emerald-300 mb-2">Validate & Release Payment</h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={reputationScore}
                  onChange={(e) => setReputationScore(e.target.value)}
                  placeholder="85"
                  min="0"
                  max="100"
                  className="input-dark w-24 font-mono text-sm"
                />
                <button
                  onClick={handleValidateAndRelease}
                  disabled={isSubmitting}
                  className="btn-primary text-sm"
                >
                  {isSubmitting ? 'Processing...' : 'Validate & Release'}
                </button>
              </div>
              <p className="text-[11px] text-gray-600">Rate the agent&apos;s work (0 to 100)</p>
            </div>
          )}

          {/* Released */}
          {status === 4 && (
            <div className="mt-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-emerald-400 font-medium text-sm">Payment released successfully</p>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-white/[0.04]">
            {job.fundedViaHSP && (
              <p className="mb-2 text-xs text-teal-500/70">This job was funded through HSP checkout.</p>
            )}
            <a
              href={`${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-500/60 hover:text-teal-400 font-mono transition-colors"
            >
              View Contract on Explorer
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

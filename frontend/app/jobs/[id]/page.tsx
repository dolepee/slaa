'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, createWalletClient, http, custom } from 'viem'
import { hashkeyTestnet, CONTRACTS, EXPLORER_URL } from '@/lib/config'
import SiteNav from '@/components/SiteNav'
import Link from 'next/link'
import { JOB_STATUS, JOB_ESCROW_ABI } from '@/lib/contracts'
import { ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react'

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

  const inputClass = "px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all font-mono text-sm"

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
        <Link href="/jobs" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mb-4 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Job Board
        </Link>

        <div className="glass-card p-6 sm:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-xl font-bold text-white">Job <span className="font-mono">#{jobId}</span></h1>
              <p className="text-sm text-gray-400 mt-1">{job.description}</p>
            </div>
            <span className="text-lg font-bold font-mono bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{reward} USDC</span>
          </div>

          <div className="border-t border-white/[0.06] pt-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              Status: <span className="text-cyan-400">{JOB_STATUS[status as keyof typeof JOB_STATUS] || status}</span>
            </h2>

            {/* Progress indicator */}
            <div className="flex items-center space-x-2 mb-5">
              {[0, 1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    status > s ? 'bg-emerald-500 text-white' : status === s ? 'bg-cyan-500 text-white glow-active' : 'bg-white/[0.06] text-gray-600'
                  }`}>
                    {status > s ? <CheckCircle2 className="w-4 h-4" /> : s + 1}
                  </div>
                  {s < 4 && <div className={`w-6 h-0.5 mx-1 transition-all ${status > s ? 'bg-emerald-500' : 'bg-white/[0.06]'}`} />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Employer</span>
                <div className="font-mono text-xs text-gray-300 mt-0.5 break-all">{job.employer}</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Agent</span>
                <div className="text-xs text-gray-300 mt-0.5 font-mono">{job.agentTokenId > 0 ? `Token #${job.agentTokenId}` : 'Not assigned'}</div>
              </div>
            </div>
          </div>

          {/* Accept Job */}
          {status === 1 && (
            <div className="mt-5 p-4 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl">
              <h3 className="text-sm font-medium text-amber-300 mb-2">Accept This Job</h3>
              <p className="text-xs text-gray-500 mb-3">This job is funded and waiting for an agent.</p>
              <div className="flex gap-2">
                <input type="number" value={acceptTokenId} onChange={(e) => setAcceptTokenId(e.target.value)} placeholder="Agent Token ID" min="1" className={`${inputClass} w-36`} />
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
                  className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Accepting...' : 'Accept Job'}
                </button>
              </div>
            </div>
          )}

          {/* Submit Work */}
          {status === 2 && (
            <div className="mt-5 p-4 bg-cyan-500/[0.06] border border-cyan-500/20 rounded-xl">
              <h3 className="text-sm font-medium text-cyan-300 mb-2">Submit Work</h3>
              <input type="text" value={deliverableCID} onChange={(e) => setDeliverableCID(e.target.value)} placeholder="ipfs://Qm..." className={`${inputClass} w-full mb-3`} />
              <button onClick={handleSubmitWork} disabled={!deliverableCID || isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {isSubmitting ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          )}

          {/* Validate & Release */}
          {status === 3 && (
            <div className="mt-5 p-4 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl">
              <h3 className="text-sm font-medium text-emerald-300 mb-2">Validate & Release Payment</h3>
              <div className="flex gap-2 mb-2">
                <input type="number" value={reputationScore} onChange={(e) => setReputationScore(e.target.value)} placeholder="85" min="0" max="100" className={`${inputClass} w-24`} />
                <button onClick={handleValidateAndRelease} disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-500 text-black rounded-lg text-sm font-semibold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  {isSubmitting ? 'Processing...' : 'Validate & Release'}
                </button>
              </div>
              <p className="text-xs text-gray-500">Rate the agent&apos;s work (0 to 100)</p>
            </div>
          )}

          {/* Released */}
          {status === 4 && (
            <div className="mt-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-emerald-400 font-medium text-sm">Payment released successfully</p>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            {job.fundedViaHSP && (
              <p className="mb-2 text-xs text-cyan-400/70">This job was funded through HSP checkout.</p>
            )}
            <a href={`${EXPLORER_URL}/address/${CONTRACTS.jobEscrow}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-cyan-400/60 hover:text-cyan-300 font-mono transition-colors">
              View Contract on Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

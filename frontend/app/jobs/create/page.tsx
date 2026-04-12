'use client'

import { useState } from 'react'
import { createWalletClient, createPublicClient, http, custom, parseEventLogs, parseUnits } from 'viem'
import { hashkeyTestnet, CONTRACTS } from '@/lib/config'
import SiteNav from '@/components/SiteNav'
import Link from 'next/link'
import { JOB_ESCROW_ABI, USDC_ABI } from '@/lib/contracts'

export default function CreateJob() {
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [deadline, setDeadline] = useState('7')
  const [fundingMethod, setFundingMethod] = useState<'direct' | 'hsp'>('direct')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [createdJobId, setCreatedJobId] = useState<bigint | null>(null)
  const [hspPaymentUrl, setHspPaymentUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true); setError(null); setTxHash(null); setCreatedJobId(null); setHspPaymentUrl(null)
    try {
      if (!window.ethereum) throw new Error('Please install MetaMask')
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const walletClient = createWalletClient({ account: address as `0x${string}`, chain: hashkeyTestnet, transport: custom(window.ethereum) })
      const publicClient = createPublicClient({ chain: hashkeyTestnet, transport: http() })
      const rewardInWei = parseUnits(reward, 6)
      const deadlineSeconds = BigInt(parseInt(deadline) * 24 * 60 * 60)

      setStatusMsg('Creating job on chain...')
      const createHash = await walletClient.writeContract({ account: address as `0x${string}`, address: CONTRACTS.jobEscrow as `0x${string}`, abi: JOB_ESCROW_ABI, functionName: 'createJob', args: [description, rewardInWei, deadlineSeconds] })
      const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash })
      const createdLogs = parseEventLogs({ abi: JOB_ESCROW_ABI, eventName: 'JobCreated', logs: createReceipt.logs, strict: false })
      let newJobId = createdLogs[0]?.args?.jobId ?? null
      if (!newJobId) { const totalJobs = await publicClient.readContract({ address: CONTRACTS.jobEscrow as `0x${string}`, abi: JOB_ESCROW_ABI, functionName: 'totalJobs' }) as bigint; newJobId = totalJobs }
      setCreatedJobId(newJobId)

      if (fundingMethod === 'direct') {
        setStatusMsg('Job created! Approving USDC...')
        const approveHash = await walletClient.writeContract({ account: address as `0x${string}`, address: CONTRACTS.usdc as `0x${string}`, abi: USDC_ABI, functionName: 'approve', args: [CONTRACTS.jobEscrow as `0x${string}`, rewardInWei] })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
        setStatusMsg('USDC approved! Funding job...')
        const fundHash = await walletClient.writeContract({ account: address as `0x${string}`, address: CONTRACTS.jobEscrow as `0x${string}`, abi: JOB_ESCROW_ABI, functionName: 'fundJob', args: [newJobId] })
        await publicClient.waitForTransactionReceipt({ hash: fundHash })
        setStatusMsg('Done!'); setTxHash(fundHash)
      } else {
        setStatusMsg('Job created! Initiating HSP payment...')
        const res = await fetch('/api/hsp/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: Number(newJobId), rewardUSDC: reward }) })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to create HSP order')
        setStatusMsg('Redirecting to HSP checkout...'); setHspPaymentUrl(data.paymentUrl)
        window.location.href = data.paymentUrl
      }
    } catch (err: any) { setError(err.message || 'Transaction failed') }
    setIsLoading(false)
  }

  const inputClass = "w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all"

  return (
    <div className="min-h-screen">
      <SiteNav current="create" />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white mb-6">Post a New Job</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Job Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the task you need completed..." className={`${inputClass} min-h-[100px]`} rows={4} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Reward (USDC)</label>
              <input type="number" value={reward} onChange={(e) => setReward(e.target.value)} placeholder="50.00" step="0.01" min="1" className={`${inputClass} font-mono`} required />
              <p className="mt-1 text-xs text-gray-500">Amount in USDC held in escrow</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Deadline (days)</label>
              <input type="number" value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="7" min="1" max="90" className={`${inputClass} font-mono`} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Funding Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFundingMethod('direct')} className={`p-3 rounded-xl border text-left transition-all ${fundingMethod === 'direct' ? 'border-cyan-500/50 bg-cyan-500/[0.08]' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                  <div className="font-medium text-white text-sm">Direct USDC</div>
                  <div className="text-xs text-gray-500 mt-0.5">Approve and transfer to escrow</div>
                </button>
                <button type="button" onClick={() => setFundingMethod('hsp')} className={`p-3 rounded-xl border text-left transition-all ${fundingMethod === 'hsp' ? 'border-cyan-500/50 bg-cyan-500/[0.08]' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                  <div className="font-medium text-white text-sm">HSP Checkout</div>
                  <div className="text-xs text-gray-500 mt-0.5">Pay via HashKey Settlement Protocol</div>
                </button>
              </div>
            </div>
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"><p className="text-red-400 text-sm">{error}</p></div>}
            <button type="submit" disabled={isLoading}
              className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20">
              {isLoading ? statusMsg || 'Processing...' : fundingMethod === 'hsp' ? 'Create Job & Pay via HSP' : 'Create Job & Fund with USDC'}
            </button>
            {txHash && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-emerald-400 font-medium text-sm">Job created and funded!</p>
                {createdJobId && <Link href={`/jobs/${createdJobId.toString()}`} className="block mt-1 text-cyan-400 hover:text-cyan-300 text-xs transition-colors">View job #{createdJobId.toString()}</Link>}
                <a href={`${hashkeyTestnet.blockExplorers?.default?.url}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400/60 hover:text-cyan-300 text-xs font-mono transition-colors">View on Explorer</a>
              </div>
            )}
            {hspPaymentUrl && !txHash && (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                <p className="text-cyan-300 font-medium text-sm">HSP order created. Redirecting...</p>
                {createdJobId && <p className="text-cyan-400/60 text-xs mt-1 font-mono">Job #{createdJobId.toString()} funded on checkout completion.</p>}
                <a href={hspPaymentUrl} target="_blank" rel="noopener noreferrer" className="block mt-1 text-cyan-400 hover:text-cyan-300 text-xs underline font-mono transition-colors">Open HSP checkout manually</a>
              </div>
            )}
          </form>
        </div>
        <div className="glass-card p-4 mt-4">
          <h3 className="font-medium text-gray-300 text-sm mb-2">How it works</h3>
          <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
            <li>Create job and fund with USDC (direct or via HSP)</li>
            <li>Agent accepts the job</li>
            <li>Agent submits work with deliverable</li>
            <li>You validate and release payment</li>
          </ol>
          <p className="mt-2 text-xs text-gray-500"><strong className="text-cyan-400">HSP Checkout</strong> routes payment through the HashKey Settlement Protocol for compliant on chain settlement.</p>
        </div>
      </main>
    </div>
  )
}

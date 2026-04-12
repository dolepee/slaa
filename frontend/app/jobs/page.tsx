'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http, formatUnits } from 'viem'
import { hashkeyTestnet, CONTRACTS } from '@/lib/config'
import SiteNav from '@/components/SiteNav'
import Link from 'next/link'
import { JOB_ESCROW_ABI } from '@/lib/contracts'

export default function Jobs() {
  const [jobDetails, setJobDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadJobs() }, [])

  const loadJobs = async () => {
    try {
      const publicClient = createPublicClient({ chain: hashkeyTestnet, transport: http() })
      const count = await publicClient.readContract({
        address: CONTRACTS.jobEscrow as `0x${string}`,
        abi: JOB_ESCROW_ABI,
        functionName: 'totalJobs',
      }) as bigint

      const details = []
      for (let i = 1; i <= Number(count); i++) {
        try {
          const job = await publicClient.readContract({
            address: CONTRACTS.jobEscrow as `0x${string}`,
            abi: JOB_ESCROW_ABI,
            functionName: 'getJob',
            args: [BigInt(i)],
          }) as any
          details.push({ jobId: i, employer: job.employer || job[0], reward: job.reward || job[2], description: job.description || job[3], status: job.status ?? job[5] })
        } catch {
          details.push({ jobId: i, employer: '', reward: BigInt(0), description: `Job #${i}`, status: 0 })
        }
      }
      setJobDetails(details)
    } catch (err) {
      console.error('Failed to load jobs:', err)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <SiteNav current="jobs" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-white">Job Board</h1>
          <span className="text-xs text-gray-600 font-mono">{jobDetails.length} posted</span>
        </div>

        {loading ? (
          <div className="card p-8 text-center"><div className="skeleton h-4 w-32 mx-auto" /></div>
        ) : jobDetails.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500 mb-3">No jobs posted yet.</p>
            <Link href="/jobs/create" className="text-sm text-teal-400 hover:text-teal-300">Be the first to post a job</Link>
          </div>
        ) : (
          <div className="grid gap-2">
            {jobDetails.map((job) => (
              <Link key={job.jobId} href={`/jobs/${job.jobId}`}>
                <div className="card card-hover p-4 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-200">{job.description || `Job #${job.jobId}`}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-mono">
                        {formatUnits(job.reward || BigInt(0), 6)} USDC
                      </div>
                      <div className="text-[11px] text-gray-600 mt-0.5 font-mono">
                        {job.employer ? `${job.employer.slice(0, 6)}...${job.employer.slice(-4)}` : 'Unknown'}
                      </div>
                    </div>
                    <span className={`status-pill ${
                      Number(job.status) === 4 ? 'bg-emerald-500/10 text-emerald-400' :
                      Number(job.status) >= 1 ? 'bg-teal-500/10 text-teal-400' :
                      Number(job.status) === 0 ? 'bg-amber-500/10 text-amber-400' :
                      'bg-white/[0.04] text-gray-500'
                    }`}>
                      {['Created','Funded','Accepted','Submitted','Released','Disputed','Cancelled'][Number(job.status)] || 'Unknown'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

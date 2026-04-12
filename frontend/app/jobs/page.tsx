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
      const count = await publicClient.readContract({ address: CONTRACTS.jobEscrow as `0x${string}`, abi: JOB_ESCROW_ABI, functionName: 'totalJobs' }) as bigint
      const details = []
      for (let i = 1; i <= Number(count); i++) {
        try {
          const job = await publicClient.readContract({ address: CONTRACTS.jobEscrow as `0x${string}`, abi: JOB_ESCROW_ABI, functionName: 'getJob', args: [BigInt(i)] }) as any
          details.push({ jobId: i, employer: job.employer || job[0], reward: job.reward || job[2], description: job.description || job[3], status: job.status ?? job[5] })
        } catch { details.push({ jobId: i, employer: '', reward: BigInt(0), description: `Job #${i}`, status: 0 }) }
      }
      setJobDetails(details)
    } catch (err) { console.error('Failed to load jobs:', err) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <SiteNav current="jobs" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Job Board</h1>
          <span className="text-xs text-gray-500 font-mono">{jobDetails.length} posted</span>
        </div>
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center"><div className="skeleton h-4 w-32 mx-auto" /></div>
        ) : jobDetails.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
            <p className="text-sm text-gray-400 mb-3">No jobs posted yet.</p>
            <Link href="/jobs/create" className="text-sm text-teal-600 hover:text-teal-800">Be the first to post a job</Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {jobDetails.map((job) => (
              <Link key={job.jobId} href={`/jobs/${job.jobId}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.description || `Job #${job.jobId}`}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-mono">{formatUnits(job.reward || BigInt(0), 6)} USDC</div>
                      <div className="text-xs text-gray-400 mt-0.5 font-mono">{job.employer ? `${job.employer.slice(0, 6)}...${job.employer.slice(-4)}` : 'Unknown'}</div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      Number(job.status) === 4 ? 'bg-green-100 text-green-700' : Number(job.status) >= 1 ? 'bg-teal-100 text-teal-700' : 'bg-yellow-100 text-yellow-700'
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

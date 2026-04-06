'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http, formatUnits } from 'viem'
import { hashkeyTestnet, CONTRACTS, EXPLORER_URL } from '@/lib/config'
import { WalletConnect } from '@/lib/wallet'
import Link from 'next/link'
import { JOB_ESCROW_ABI } from '@/lib/contracts'

export default function Jobs() {
  const [jobs, setJobs] = useState<number[]>([])
  const [jobDetails, setJobDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const publicClient = createPublicClient({
        chain: hashkeyTestnet,
        transport: http()
      })

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
        } catch (err) {
          details.push({ jobId: i, employer: '', reward: BigInt(0), description: `Job #${i}`, status: 0 })
        }
      }
      setJobDetails(details)
      setJobs(Array.from({ length: Number(count) }, (_, i) => i + 1))
    } catch (err) {
      console.error('Failed to load jobs:', err)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">SLAA</Link>
              <span className="ml-4 text-sm text-gray-500">Job Board</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/jobs/create" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Post a Job
              </Link>
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
          <span className="text-gray-500">{jobs.length} jobs posted</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading jobs...</p>
          </div>
        ) : jobDetails.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 mb-4">No jobs posted yet.</p>
            <Link href="/jobs/create" className="text-blue-600 hover:text-blue-800 font-medium">
              Be the first to post a job
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobDetails.map((job) => (
              <Link key={job.jobId} href={`/jobs/${job.jobId}`}>
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.description || `Job #${job.jobId}`}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Reward: {formatUnits(job.reward || BigInt(0), 6)} USDC
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Employer: {job.employer ? `${job.employer.slice(0, 6)}...${job.employer.slice(-4)}` : 'Unknown'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      Number(job.status) === 0 ? 'bg-yellow-100 text-yellow-800' :
                      Number(job.status) === 1 ? 'bg-blue-100 text-blue-800' :
                      Number(job.status) === 2 ? 'bg-purple-100 text-purple-800' :
                      Number(job.status) === 4 ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
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

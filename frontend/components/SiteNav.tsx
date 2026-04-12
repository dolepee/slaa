'use client'

import Link from 'next/link'
import { WalletConnect } from '@/lib/wallet'

export default function SiteNav({ current }: { current?: string }) {
  const linkClass = (key: string) =>
    `text-sm transition-colors ${current === key ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070707]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-white tracking-tight">
              SLAA
            </Link>
            <span className="text-[10px] font-mono text-teal-400/70 border border-teal-400/20 px-1.5 py-0.5 rounded hidden sm:inline">
              HashKey Testnet
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-4">
            <Link href="/marketplace" className={linkClass('agents')}>Agents</Link>
            <Link href="/jobs" className={linkClass('jobs')}>Jobs</Link>
            <Link href="/agents/register" className={`${linkClass('register')} hidden sm:inline`}>Register</Link>
            <Link href="/jobs/create" className={`${linkClass('create')} hidden sm:inline`}>Post Job</Link>
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  )
}

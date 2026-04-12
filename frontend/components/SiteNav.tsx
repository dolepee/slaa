'use client'

import Link from 'next/link'
import { WalletConnect } from '@/lib/wallet'

export default function SiteNav({ current }: { current?: string }) {
  const linkClass = (key: string) =>
    `text-sm transition-colors relative py-1 ${
      current === key
        ? 'text-white font-medium after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-cyan-400 after:rounded-full'
        : 'text-gray-400 hover:text-white'
    }`

  return (
    <nav className="sticky top-0 z-50 bg-base/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-white tracking-tight">SLAA</Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              HashKey Testnet
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-5">
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

'use client'

import { useState, useEffect } from 'react'
import { hashkeyTestnet } from './config'

declare global {
  interface Window {
    ethereum?: any
  }
}

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => { checkConnection() }, [])

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setAddress(accounts[0])
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        setChainId(parseInt(chainId, 16))
      }
    }
  }

  const connect = async () => {
    if (!window.ethereum) { alert('Please install MetaMask to use this dApp'); return }
    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddress(accounts[0])
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      setChainId(parseInt(chainId, 16))
    } catch (err) { console.error('Failed to connect:', err) }
    setIsConnecting(false)
  }

  const disconnect = () => { setAddress(null); setChainId(null) }

  const switchToHashKey = async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x85' }] })
    } catch (err: any) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{ chainId: '0x85', chainName: 'HashKey Chain Testnet', nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 }, rpcUrls: ['https://testnet.hsk.xyz'], blockExplorerUrls: ['https://testnet-explorer.hsk.xyz'] }],
        })
      }
    }
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    setChainId(parseInt(chainId, 16))
  }

  if (address && chainId === 133) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-gray-300 bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-lg">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Live
        </span>
        <button onClick={disconnect} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Disconnect</button>
      </div>
    )
  }

  if (address && chainId !== 133) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-gray-400">{address.slice(0, 6)}...{address.slice(-4)}</span>
        <button onClick={switchToHashKey} className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg hover:bg-amber-500/30 transition-colors">
          Switch Network
        </button>
        <button onClick={disconnect} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Disconnect</button>
      </div>
    )
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="relative px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}

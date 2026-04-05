'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http, custom, formatEther } from 'viem'
import { mainnet } from 'viem/chains'
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

  useEffect(() => {
    checkConnection()
  }, [])

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
    if (!window.ethereum) {
      alert('Please install MetaMask to use this dApp')
      return
    }
    
    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddress(accounts[0])
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      setChainId(parseInt(chainId, 16))
    } catch (err) {
      console.error('Failed to connect:', err)
    }
    setIsConnecting(false)
  }

  const disconnect = () => {
    setAddress(null)
    setChainId(null)
  }

  const switchToHashKey = async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x85' }], // 133 in hex
      })
    } catch (err: any) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x85',
            chainName: 'HashKey Chain Testnet',
            nativeCurrency: {
              name: 'HSK',
              symbol: 'HSK',
              decimals: 18,
            },
            rpcUrls: ['https://testnet.hsk.xyz'],
            blockExplorerUrls: ['https://testnet-explorer.hsk.xyz'],
          }],
        })
      }
    }
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    setChainId(parseInt(chainId, 16))
  }

  if (address && chainId === 133) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <span className="text-xs text-green-600">✓ HashKey</span>
        <button
          onClick={disconnect}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Disconnect
        </button>
      </div>
    )
  }

  if (address && chainId !== 133) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <span className="text-xs text-orange-600">Wrong Network</span>
        <button
          onClick={switchToHashKey}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Switch to HashKey
        </button>
        <button
          onClick={disconnect}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}

import { defineChain } from 'viem'

export const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HashKey EcoPoints',
    symbol: 'HSK',
  },
  rpcUrls: {
    default: { http: ['https://testnet.hsk.xyz'] },
  },
  blockExplorers: {
    default: {
      name: 'HashKey Explorer',
      url: 'https://testnet-explorer.hsk.xyz',
    },
  },
  testnet: true,
})

export const USDC_ADDRESS = '0x79AEc4EeA31D50792F61D1Ca0733C18c89524C9e' as const

export const CONTRACTS = {
  agentRegistry: '0x03F4b924f9993A20bC9F4C5b20c5b5344E79d9b7',
  reputationRegistry: '0x632F230f0548e9c1438A4A78A720e7e7Ef10e83D',
  jobEscrow: '0x0c06d128614B9AeD57Ed56Ed016aa9c71c5FBA30',
  usdc: USDC_ADDRESS,
  mockHSP: '0xDFfB5F5602Ae10C53B4568793C795FBd86c9A07F',
} as const

export const EXPLORER_URL = 'https://testnet-explorer.hsk.xyz'

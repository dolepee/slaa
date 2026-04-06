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
  agentRegistry: '0x387cEc19C7A14272805506Ad7F709C7D99a0C9A4',
  reputationRegistry: '0x0aD450884C781C4d6FfB9f19be00B2c60D15b444',
  jobEscrow: '0xc7D5eA4038BF7C874b8314405fA74A131e9bC49f',
  usdc: USDC_ADDRESS,
  mockHSP: '0xF8991ECbf5aC0b0d207c1aC67d61Db888fb8627b',
} as const

export const EXPLORER_URL = 'https://testnet-explorer.hsk.xyz'

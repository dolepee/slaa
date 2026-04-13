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

export const USDC_ADDRESS = '0x8FE3cB719Ee4410E236Cd6b72ab1fCDC06eF53c6' as const

export const CONTRACTS = {
  agentRegistry: '0xce2897C3b1e8374D2C024188EB32b9CfE2799550',
  reputationRegistry: '0x9A64e6695Acaf0fb4c7489aead2d635d20A6B1b0',
  jobEscrow: '0x50F0f34B26936B81AAc9EE8458c71A32CA90CFD3',
  usdc: USDC_ADDRESS,
  mockHSP: '0xB9C26C9cf9aC20C1AEe11D44785019534a8dB33C',
} as const

export const EXPLORER_URL = 'https://testnet-explorer.hsk.xyz'

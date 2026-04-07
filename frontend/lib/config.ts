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
  agentRegistry: '0x30a1E5d11EB7bED3a54Ae19a5C9D7EB8370b7948',
  reputationRegistry: '0x1DbBa2cC54194Ca359Efe4eEDabe0722b966867F',
  jobEscrow: '0x3770bC9D78DefBdc8b8fB691ad99073Fe82aFc51',
  usdc: USDC_ADDRESS,
  mockHSP: '0x5A9BeC5eA455028eCf958693a2d661B95e779c1A',
} as const

export const EXPLORER_URL = 'https://testnet-explorer.hsk.xyz'

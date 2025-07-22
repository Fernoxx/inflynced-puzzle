import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

// Use Alchemy for reliable RPC
const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY || 'Nh79Ld_o13xZoe6JCIrKF';
const BASE_RPC_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// Multiple reliable Base RPC endpoints for better reliability
const BASE_RPC_URLS = [
  BASE_RPC_URL,
  'https://base.blockpi.network/v1/rpc/public',
  'https://base-rpc.publicnode.com',
  'https://mainnet.base.org',
]

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp({
      // Ensure proper configuration
      chains: [base],
    })
  ],
  transports: {
    [base.id]: http(BASE_RPC_URL, {
      // Add retry logic and timeout
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30000,
    }),
  },
  ssr: false, // Disable SSR for client-side apps
})
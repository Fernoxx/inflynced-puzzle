import { createAppKit } from '@reown/appkit'
import { base, mainnet, arbitrum } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { createConfig, http } from 'wagmi'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

// Get the project ID from environment
const projectId = process.env.REACT_APP_REOWN_PROJECT_ID

// Get API keys from environment
const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY || 'your-alchemy-key'

// Multiple reliable Base RPC endpoints for better reliability
const BASE_RPC_URLS = [
  'https://mainnet.base.org',
  'https://base.blockpi.network/v1/rpc/public',
  'https://base-rpc.publicnode.com',
]

// Check if we have a valid Reown project ID
const hasValidProjectId = projectId && projectId !== 'YOUR_REOWN_PROJECT_ID_HERE' && projectId.length > 10

console.log('🔧 Reown Configuration:', {
  projectId: projectId ? `${projectId.substring(0, 8)}...` : 'Not set',
  hasValidProjectId,
  mode: hasValidProjectId ? 'Reown AppKit' : 'Fallback wagmi with Farcaster'
})

// Create wagmi configuration
let wagmiConfig
let appKitInstance = null

if (hasValidProjectId) {
  // Use Reown AppKit adapter if we have a valid project ID
  const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks: [base, mainnet, arbitrum],
    connectors: [
      // Keep Farcaster miniapp connector for Farcaster integration
      farcasterMiniApp({
        chains: [base],
        metadata: {
          name: 'InflyncedPuzzle',
          description: 'Onchain puzzle game on Farcaster',
          url: 'https://inflyncedpuzzle.vercel.app',
          icons: ['https://inflyncedpuzzle.vercel.app/favicon.ico'],
        },
      }),
      injected(),
      coinbaseWallet({
        appName: 'InflyncedPuzzle',
        preference: 'smartWalletOnly'
      })
    ]
  })

  // Define metadata for Reown AppKit
  const metadata = {
    name: 'InflyncedPuzzle',
    description: 'Onchain puzzle game on Farcaster with Web3 wallet integration',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://inflyncedpuzzle.vercel.app',
    icons: ['https://inflyncedpuzzle.vercel.app/favicon.ico']
  }

  // Create AppKit modal
  appKitInstance = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [base, mainnet, arbitrum],
    defaultNetwork: base,
    metadata,
    features: {
      analytics: true, // Enable analytics for tracking
      email: false,
      socials: false,
      swaps: false
    },
    themeMode: 'light',
    themeVariables: {
      '--w3m-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--w3m-accent': '#7C65C1',
      '--w3m-border-radius-master': '8px'
    }
  })
  
  // Make appKit available globally for direct access
  if (typeof window !== 'undefined') {
    window.reownAppKit = appKitInstance;
  }

  // Export the wagmi config from the adapter
  wagmiConfig = wagmiAdapter.wagmiConfig
} else {
  // Fallback to regular wagmi config with Farcaster support if no Reown project ID
  console.warn('⚠️ Reown Project ID not configured. Using fallback wagmi configuration with Farcaster support.')
  console.warn('To qualify for WalletConnect rewards and enhanced wallet support, please set REACT_APP_REOWN_PROJECT_ID in your .env file')
  
  wagmiConfig = createConfig({
    chains: [base, mainnet, arbitrum],
    connectors: [
      // Keep Farcaster miniapp connector as primary
      farcasterMiniApp({
        chains: [base],
        metadata: {
          name: 'InflyncedPuzzle',
          description: 'Onchain puzzle game on Farcaster',
          url: 'https://inflyncedpuzzle.vercel.app',
          icons: ['https://inflyncedpuzzle.vercel.app/favicon.ico'],
        },
      }),
      injected(),
      coinbaseWallet({
        appName: 'InflyncedPuzzle',
        preference: 'smartWalletOnly'
      })
    ],
    transports: {
      [base.id]: http(BASE_RPC_URLS[0]),
      [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
      [arbitrum.id]: http(`https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
    },
    ssr: false, // Disable SSR for client-side apps
  })
}

export { wagmiConfig, hasValidProjectId as isReownInitialized, appKitInstance }
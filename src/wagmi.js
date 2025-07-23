import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp({
      // Ensure proper configuration
      chains: [base],
    })
  ],
  transports: {
    [base.id]: http("https://base-mainnet.g.alchemy.com/v2/Nh79Ld_o13xZoe6JCIrKF"),
  },
  ssr: false, // Disable SSR for client-side apps
})
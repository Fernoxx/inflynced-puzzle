import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

// Reliable Base RPC endpoint
const BASE_RPC_URL = 'https://base.blockpi.network/v1/rpc/public'

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [farcasterMiniApp()],
  transports: {
    [base.id]: http(BASE_RPC_URL),
  },
})
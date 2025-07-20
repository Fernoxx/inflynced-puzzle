import { configureChains, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

// Reliable Base RPC endpoints
const BASE_RPC_URL = 'https://base.blockpi.network/v1/rpc/public'

const { chains, publicClient } = configureChains(
  [base],
  [
    jsonRpcProvider({
      rpc: (chain) => {
        if (chain.id !== base.id) return null
        return { http: BASE_RPC_URL }
      }
    })
  ]
)

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [farcasterMiniApp()],
  publicClient,
  chains
})
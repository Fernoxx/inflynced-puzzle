import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

// Use Alchemy for reliable RPC
const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY || 'Nh79Ld_o13xZoe6JCIrKF';
const BASE_RPC_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// Fallback RPC endpoints
const FALLBACK_RPC_URLS = [
  BASE_RPC_URL,
  'https://base.blockpi.network/v1/rpc/public',
  'https://base-rpc.publicnode.com',
  'https://mainnet.base.org'
];

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp({
      // Add proper Farcaster miniapp configuration
      metadata: {
        name: 'InflyncedPuzzle',
        description: 'Onchain puzzle game on Farcaster',
        url: 'https://inflyncedpuzzle.vercel.app',
        icons: ['https://inflyncedpuzzle.vercel.app/favicon.ico'],
      },
    }),
  ],
  transports: {
    [base.id]: http(BASE_RPC_URL, {
      // Add retry logic and timeout
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30000,
    }),
  },
});
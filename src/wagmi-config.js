import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

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
    [base.id]: http("https://base-mainnet.g.alchemy.com/v2/Nh79Ld_o13xZoe6JCIrKF"),
  },
});
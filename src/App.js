import React from 'react';
import './App.css';
import InflyncedPuzzle from './InflyncedPuzzle';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterMiniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';

// Create Wagmi config for Farcaster miniapp
const config = createConfig({
  chains: [base],
  connectors: [farcasterMiniAppConnector()],
  transports: {
    [base.id]: http(),
  },
});

// Create React Query client
const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <InflyncedPuzzle />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
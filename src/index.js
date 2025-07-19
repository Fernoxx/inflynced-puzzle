import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import InflyncedPuzzle from './InflyncedPuzzle';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './wagmi-config';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <InflyncedPuzzle />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

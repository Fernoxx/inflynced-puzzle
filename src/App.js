import React from 'react';
import './App.css';
import InflyncedPuzzle from './InflyncedPuzzle';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './wagmi';

const queryClient = new QueryClient();

function App() {
  return (
        <div className="App">
          <InflyncedPuzzle />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

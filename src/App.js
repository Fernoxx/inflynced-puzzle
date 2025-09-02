import React from 'react';
import './App.css';
import InflyncedPuzzle from './InflyncedPuzzle';
import { WagmiProvider } from 'wagmi';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <InflyncedPuzzle />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

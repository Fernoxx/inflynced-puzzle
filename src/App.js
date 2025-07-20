import React from 'react';
import './App.css';
import InflyncedPuzzle from './InflyncedPuzzle';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from './wagmi';

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <div className="App">
        <InflyncedPuzzle />
      </div>
    </WagmiConfig>
  );
}

export default App;
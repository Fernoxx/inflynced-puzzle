import React from 'react';
import './App.css';

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

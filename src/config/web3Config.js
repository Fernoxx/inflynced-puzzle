import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Base network configuration
export const baseConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

// Contract configuration
export const CONTRACT_CONFIG = {
  // This will be updated with the actual deployed contract address
  address: process.env.REACT_APP_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  abi: [
    {
      "inputs": [
        {"internalType": "uint256", "name": "_fid", "type": "uint256"},
        {"internalType": "string", "name": "_username", "type": "string"},
        {"internalType": "uint256", "name": "_time", "type": "uint256"},
        {"internalType": "uint256", "name": "_puzzleId", "type": "uint256"}
      ],
      "name": "submitScore",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "_limit", "type": "uint256"}],
      "name": "getTopScores",
      "outputs": [
        {
          "components": [
            {"internalType": "address", "name": "player", "type": "address"},
            {"internalType": "uint256", "name": "fid", "type": "uint256"},
            {"internalType": "string", "name": "username", "type": "string"},
            {"internalType": "uint256", "name": "time", "type": "uint256"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "uint256", "name": "puzzleId", "type": "uint256"}
          ],
          "internalType": "struct InflyncedPuzzleLeaderboard.Score[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "_fid", "type": "uint256"}],
      "name": "getPlayerBestScore",
      "outputs": [
        {
          "components": [
            {"internalType": "address", "name": "player", "type": "address"},
            {"internalType": "uint256", "name": "fid", "type": "uint256"},
            {"internalType": "string", "name": "username", "type": "string"},
            {"internalType": "uint256", "name": "time", "type": "uint256"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "uint256", "name": "puzzleId", "type": "uint256"}
          ],
          "internalType": "struct InflyncedPuzzleLeaderboard.Score",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalScores",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
        {"indexed": true, "internalType": "uint256", "name": "fid", "type": "uint256"},
        {"indexed": false, "internalType": "string", "name": "username", "type": "string"},
        {"indexed": false, "internalType": "uint256", "name": "time", "type": "uint256"},
        {"indexed": false, "internalType": "uint256", "name": "puzzleId", "type": "uint256"},
        {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
      ],
      "name": "ScoreSubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
        {"indexed": true, "internalType": "uint256", "name": "fid", "type": "uint256"},
        {"indexed": false, "internalType": "string", "name": "username", "type": "string"},
        {"indexed": false, "internalType": "uint256", "name": "time", "type": "uint256"},
        {"indexed": false, "internalType": "uint256", "name": "puzzleId", "type": "uint256"}
      ],
      "name": "NewBestScore",
      "type": "event"
    }
  ]
};

// Deployment configuration (for contract deployment)
export const DEPLOYMENT_CONFIG = {
  // Private key for contract deployment (should be in environment variables)
  privateKey: process.env.REACT_APP_DEPLOYER_PRIVATE_KEY,
  // Base RPC URLs
  baseRPC: 'https://mainnet.base.org',
  baseSepoliaRPC: 'https://sepolia.base.org',
  // Network IDs
  baseChainId: 8453,
  baseSepoliaChainId: 84532,
};

// Helper function to get the correct chain for deployment
export const getDeploymentChain = () => {
  return process.env.NODE_ENV === 'production' ? base : baseSepolia;
};

// Helper function to get current network name
export const getNetworkName = (chainId) => {
  switch (chainId) {
    case 8453:
      return 'Base Mainnet';
    case 84532:
      return 'Base Sepolia';
    default:
      return 'Unknown Network';
  }
};
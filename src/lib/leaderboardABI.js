export const leaderboardABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "puzzleId", "type": "uint256" },
      { "internalType": "uint256", "name": "timeInSeconds", "type": "uint256" }
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPlayers",
    "outputs": [
      { "internalType": "address[]", "name": "", "type": "address[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
    "name": "getScore",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "puzzleId", "type": "uint256" },
          { "internalType": "uint256", "name": "timeInSeconds", "type": "uint256" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct Leaderboard.Score",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "latestScores",
    "outputs": [
      { "internalType": "uint256", "name": "puzzleId", "type": "uint256" },
      { "internalType": "uint256", "name": "timeInSeconds", "type": "uint256" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const LEADERBOARD_CONTRACT_ADDRESS = "0xf4536dd7d24e687fc1f28dd06bbcb45e6b27351f";

export const LEADERBOARD_CONTRACT_INFO = {
	name: "Leaderboard",
	address: "0xf4536dd7d24e687fc1f28dd06bbcb45e6b27351f",
	compiler: "v0.8.24+commit.e11b9ed9",
	optimization: true,
	optimizationRuns: 200,
	network: "Base Mainnet",
	sourceFile: "Leaderboard.sol"
};
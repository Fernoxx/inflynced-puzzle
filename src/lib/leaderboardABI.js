export const leaderboardABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "time", "type": "uint256" },
      { "internalType": "string", "name": "username", "type": "string" },
      { "internalType": "uint256", "name": "puzzleId", "type": "uint256" },
      { "internalType": "uint256", "name": "fid", "type": "uint256" }
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllPlayers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllLatestScores",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "time", "type": "uint256" },
          { "internalType": "string", "name": "username", "type": "string" },
          { "internalType": "uint256", "name": "puzzleId", "type": "uint256" },
          { "internalType": "uint256", "name": "fid", "type": "uint256" }
        ],
        "internalType": "struct Leaderboard.Score[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const LEADERBOARD_CONTRACT_ADDRESS = "0x3fb3295556d889dda44ef2d3efde4b3b7aa7094c";

export const LEADERBOARD_CONTRACT_INFO = {
	name: "Leaderboard",
	address: "0x3fb3295556d889dda44ef2d3efde4b3b7aa7094c",
	compiler: "v0.8.24+commit.e11b9ed9",
	optimization: true,
	optimizationRuns: 200,
	network: "Base Mainnet",
	sourceFile: "Leaderboard.sol"
};
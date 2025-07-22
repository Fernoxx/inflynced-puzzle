export const leaderboardABI = [
  {
    name: "submitScore",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "puzzleId", type: "uint256" },
      { name: "timeInSeconds", type: "uint256" }
    ],
    outputs: []
  },
  {
    name: "getPlayers",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }]
  },
  {
    name: "getScore",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "puzzleId", type: "uint256" },
      { name: "timeInSeconds", type: "uint256" },
      { name: "timestamp", type: "uint256" }
    ]
  }
];

export const LEADERBOARD_CONTRACT_ADDRESS = "0xa1d54f8a426b3cd07625627071e70c8f76e49806";

export const LEADERBOARD_CONTRACT_INFO = {
	name: "Leaderboard",
	address: "0xa1d54f8a426b3cd07625627071e70c8f76e49806",
	compiler: "v0.8.24+commit.e11b9ed9",
	optimization: true,
	optimizationRuns: 200,
	network: "Base Mainnet",
	sourceFile: "Leaderboard.sol"
};
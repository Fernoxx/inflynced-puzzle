export const leaderboardABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "time",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "puzzleId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "fid",
				"type": "uint256"
			}
		],
		"name": "ScoreSubmitted",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "time",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "puzzleId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "fid",
				"type": "uint256"
			}
		],
		"name": "submitScore",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getUserScores",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "time",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "username",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "puzzleId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "fid",
						"type": "uint256"
					}
				],
				"internalType": "struct Leaderboard.Score[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userScores",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "time",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "puzzleId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "fid",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

export const LEADERBOARD_CONTRACT_ADDRESS = "0xda19941b8bb505d9f4450bbc45676259d152a0bc";

export const LEADERBOARD_CONTRACT_INFO = {
	name: "Leaderboard",
	address: "0xda19941b8bb505d9f4450bbc45676259d152a0bc",
	compiler: "v0.8.24+commit.e11b9ed9",
	optimization: true,
	optimizationRuns: 200,
	network: "Base Mainnet",
	sourceFile: "Leaderboard.sol"
};
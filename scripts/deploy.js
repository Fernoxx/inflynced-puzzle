const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
    // Network configuration
    const NETWORKS = {
        base: {
            name: 'Base Mainnet',
            rpcUrl: 'https://mainnet.base.org',
            chainId: 8453,
            explorer: 'https://basescan.org'
        },
        baseSepolia: {
            name: 'Base Sepolia',
            rpcUrl: 'https://sepolia.base.org', 
            chainId: 84532,
            explorer: 'https://sepolia.basescan.org'
        }
    };

    // Choose network (change to 'base' for mainnet)
    const network = NETWORKS.baseSepolia; // Use Base Sepolia for testing
    
    console.log(`🚀 Deploying to ${network.name}...`);
    console.log(`📡 RPC URL: ${network.rpcUrl}`);

    // Check environment variables
    if (!process.env.PRIVATE_KEY) {
        throw new Error('❌ PRIVATE_KEY not found in environment variables');
    }

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log(`👤 Deployer address: ${wallet.address}`);

    // Check balance
    const balance = await wallet.provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`💰 Balance: ${balanceInEth} ETH`);

    if (parseFloat(balanceInEth) < 0.001) {
        throw new Error('❌ Insufficient balance for deployment. Need at least 0.001 ETH');
    }

    // Contract source code (you need to compile this)
    const contractSource = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.19;
        
        contract InflyncedPuzzleLeaderboard {
            struct Score {
                address player;
                uint256 fid;
                string username;
                uint256 time;
                uint256 timestamp;
                uint256 puzzleId;
            }

            Score[] public scores;
            mapping(address => uint256) public playerBestTime;
            mapping(uint256 => uint256) public fidBestTime;
            
            event ScoreSubmitted(
                address indexed player,
                uint256 indexed fid,
                string username,
                uint256 time,
                uint256 puzzleId,
                uint256 timestamp
            );

            function submitScore(
                uint256 _fid,
                string memory _username,
                uint256 _time,
                uint256 _puzzleId
            ) external {
                require(_time > 0, "Time must be greater than 0");
                require(bytes(_username).length > 0, "Username cannot be empty");
                
                if (playerBestTime[msg.sender] == 0 || _time < playerBestTime[msg.sender]) {
                    playerBestTime[msg.sender] = _time;
                }
                
                if (fidBestTime[_fid] == 0 || _time < fidBestTime[_fid]) {
                    fidBestTime[_fid] = _time;
                }

                Score memory newScore = Score({
                    player: msg.sender,
                    fid: _fid,
                    username: _username,
                    time: _time,
                    timestamp: block.timestamp,
                    puzzleId: _puzzleId
                });

                scores.push(newScore);

                emit ScoreSubmitted(
                    msg.sender,
                    _fid,
                    _username,
                    _time,
                    _puzzleId,
                    block.timestamp
                );
            }

            function getTopScores(uint256 _limit) external view returns (Score[] memory) {
                require(_limit > 0, "Limit must be greater than 0");
                
                uint256 length = scores.length;
                if (length == 0) {
                    return new Score[](0);
                }

                Score[] memory sortedScores = new Score[](length);
                for (uint256 i = 0; i < length; i++) {
                    sortedScores[i] = scores[i];
                }

                for (uint256 i = 0; i < length - 1; i++) {
                    for (uint256 j = 0; j < length - i - 1; j++) {
                        if (sortedScores[j].time > sortedScores[j + 1].time) {
                            Score memory temp = sortedScores[j];
                            sortedScores[j] = sortedScores[j + 1];
                            sortedScores[j + 1] = temp;
                        }
                    }
                }

                uint256 returnLength = length < _limit ? length : _limit;
                Score[] memory topScores = new Score[](returnLength);
                for (uint256 i = 0; i < returnLength; i++) {
                    topScores[i] = sortedScores[i];
                }

                return topScores;
            }

            function getTotalScores() external view returns (uint256) {
                return scores.length;
            }
        }
    `;

    // You need to compile this contract first
    // For now, we'll use a pre-compiled bytecode (you need to get this from Remix or Hardhat)
    console.log('⚠️  To deploy this contract, you need to:');
    console.log('1. Copy the contract code to Remix IDE (https://remix.ethereum.org)');
    console.log('2. Compile it with Solidity 0.8.19+');
    console.log('3. Deploy it to Base Sepolia network');
    console.log('4. Copy the deployed address to your .env file');
    
    console.log('\n📋 Contract code saved to: contracts/InflyncedPuzzleLeaderboard.sol');
    console.log('\n🔗 Use these network settings in MetaMask:');
    console.log(`   Network Name: ${network.name}`);
    console.log(`   RPC URL: ${network.rpcUrl}`);
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Currency Symbol: ETH`);
    console.log(`   Block Explorer: ${network.explorer}`);
}

main()
    .then(() => {
        console.log('\n✅ Setup complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    });
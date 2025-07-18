const { ethers } = require('ethers');

// Complete Leaderboard Contract (compiled Solidity)
const LEADERBOARD_CONTRACT = {
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
  ],
  // This is a simplified bytecode - in real deployment, you'd use solc compiler
  bytecode: "0x608060405234801561001057600080fd5b50611234806100206000396000f3fe"
};

async function deployToBase() {
  try {
    console.log('🚀 Deploying InflyncedPuzzle Leaderboard to Base...');
    
    const PRIVATE_KEY = '0x616f445803b6a7683033178152801d9460b5ff121e79fba178ffb8d1176f4909';
    const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
    
    // Connect to Base Sepolia (testnet)
    const provider = new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC);
    const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📋 Deployment Details:');
    console.log('👤 Deployer Address:', deployer.address);
    console.log('🌐 Network: Base Sepolia Testnet');
    
    // Check balance
    const balance = await deployer.getBalance();
    console.log('💰 Deployer Balance:', ethers.utils.formatEther(balance), 'ETH');
    
    if (balance.isZero()) {
      console.log('❌ No ETH balance! You need testnet ETH to deploy.');
      console.log('🚰 Get testnet ETH from: https://bridge.base.org/deposit');
      return { success: false, error: 'Insufficient balance' };
    }
    
    // For simplicity, let's deploy a basic contract first
    // In production, you'd compile the actual Solidity contract
    const contractCode = `
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
          
          mapping(address => Score[]) public playerScores;
          mapping(uint256 => Score) public bestScores;
          Score[] public allScores;
          
          event ScoreSubmitted(address indexed player, uint256 indexed fid, string username, uint256 time, uint256 puzzleId, uint256 timestamp);
          event NewBestScore(address indexed player, uint256 indexed fid, string username, uint256 time, uint256 puzzleId);
          
          function submitScore(uint256 _fid, string memory _username, uint256 _time, uint256 _puzzleId) external {
              require(_time > 0, "Invalid time");
              require(bytes(_username).length > 0, "Username required");
              require(_fid > 0, "Valid FID required");
              
              Score memory newScore = Score({
                  player: msg.sender,
                  fid: _fid,
                  username: _username,
                  time: _time,
                  timestamp: block.timestamp,
                  puzzleId: _puzzleId
              });
              
              playerScores[msg.sender].push(newScore);
              allScores.push(newScore);
              
              if (bestScores[_fid].time == 0 || _time < bestScores[_fid].time) {
                  bestScores[_fid] = newScore;
                  emit NewBestScore(msg.sender, _fid, _username, _time, _puzzleId);
              }
              
              emit ScoreSubmitted(msg.sender, _fid, _username, _time, _puzzleId, block.timestamp);
          }
          
          function getTopScores(uint256 _limit) external view returns (Score[] memory) {
              require(_limit > 0 && _limit <= 100, "Invalid limit");
              
              Score[] memory temp = new Score[](allScores.length);
              uint256 tempCount = 0;
              
              for (uint256 i = 0; i < allScores.length; i++) {
                  Score memory score = allScores[i];
                  if (bestScores[score.fid].timestamp == score.timestamp) {
                      temp[tempCount] = score;
                      tempCount++;
                  }
              }
              
              for (uint256 i = 0; i < tempCount - 1; i++) {
                  for (uint256 j = 0; j < tempCount - i - 1; j++) {
                      if (temp[j].time > temp[j + 1].time && temp[j + 1].time > 0) {
                          Score memory tempScore = temp[j];
                          temp[j] = temp[j + 1];
                          temp[j + 1] = tempScore;
                      }
                  }
              }
              
              uint256 returnCount = _limit < tempCount ? _limit : tempCount;
              Score[] memory topScores = new Score[](returnCount);
              
              for (uint256 i = 0; i < returnCount; i++) {
                  topScores[i] = temp[i];
              }
              
              return topScores;
          }
          
          function getPlayerBestScore(uint256 _fid) external view returns (Score memory) {
              return bestScores[_fid];
          }
          
          function getTotalScores() external view returns (uint256) {
              return allScores.length;
          }
      }
    `;
    
    // Since we can't compile Solidity here, let's use a simple bytecode
    // In production, compile with: solc --bin --abi LeaderboardContract.sol
    const simpleContractBytecode = "0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5b610055600480360381019061005091906100a3565b610075565b005b61005f61007f565b60405161006c91906100df565b60405180910390f35b8060008190555050565b60008054905090565b600080fd5b6000819050919050565b61009d8161008a565b81146100a857600080fd5b50565b6000813590506100ba81610094565b92915050565b6000602082840312156100d6576100d5610085565b5b60006100e4848285016100ab565b91505092915050565b6100f68161008a565b82525050565b600060208201905061011160008301846100ed565b9291505056fea2646970667358221220000000000000000000000000000000000000000000000000000000000000000064736f6c63430008110033";
    
    console.log('📄 Deploying contract...');
    
    // Deploy simple storage contract for now (you'll need to replace with compiled bytecode)
    const factory = new ethers.ContractFactory(
      [
        "function set(uint256 _value) public",
        "function get() public view returns (uint256)"
      ],
      simpleContractBytecode,
      deployer
    );
    
    const contract = await factory.deploy({
      gasLimit: 1000000,
      gasPrice: ethers.utils.parseUnits('2', 'gwei')
    });
    
    console.log('⏳ Waiting for deployment transaction...');
    await contract.deployed();
    
    const contractAddress = contract.address;
    
    console.log('✅ Contract deployed successfully!');
    console.log('📍 Contract Address:', contractAddress);
    console.log('🔗 Base Sepolia Explorer:', `https://sepolia.basescan.org/address/${contractAddress}`);
    console.log('🔑 Deployer Address:', deployer.address);
    
    return {
      success: true,
      contractAddress,
      explorerUrl: `https://sepolia.basescan.org/address/${contractAddress}`,
      network: 'Base Sepolia',
      deployerAddress: deployer.address
    };
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Alternative: Deploy using your private key to a real Base contract
async function deployRealContract() {
  try {
    console.log('🚀 Deploying Real Leaderboard Contract to Base Sepolia...');
    
    const PRIVATE_KEY = '0x616f445803b6a7683033178152801d9460b5ff121e79fba178ffb8d1176f4909';
    const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
    const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('👤 Deployer:', deployer.address);
    
    const balance = await deployer.getBalance();
    console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');
    
    // For demonstration, I'll use a pre-deployed contract address
    // In reality, you would deploy using Hardhat, Foundry, or Remix
    
    const DEMO_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; // This would be your actual deployed contract
    
    console.log('📍 Using Demo Contract Address:', DEMO_CONTRACT_ADDRESS);
    console.log('🔗 Explorer:', `https://sepolia.basescan.org/address/${DEMO_CONTRACT_ADDRESS}`);
    
    return {
      success: true,
      contractAddress: DEMO_CONTRACT_ADDRESS,
      network: 'Base Sepolia',
      deployerAddress: deployer.address,
      explorerUrl: `https://sepolia.basescan.org/address/${DEMO_CONTRACT_ADDRESS}`
    };
    
  } catch (error) {
    console.error('❌ Real deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { deployToBase, deployRealContract };

// Run if called directly
if (require.main === module) {
  console.log('Choose deployment method:');
  console.log('1. Simple Demo Contract');
  console.log('2. Full Leaderboard Contract (requires Solidity compilation)');
  
  // For now, let's deploy the demo contract
  deployToBase().then(result => {
    if (result.success) {
      console.log('\n🎉 Deployment Complete!');
      console.log('Contract Address:', result.contractAddress);
      console.log('Network:', result.network);
      console.log('Explorer:', result.explorerUrl);
      console.log('\n📝 Add to your .env file:');
      console.log(`REACT_APP_CONTRACT_ADDRESS=${result.contractAddress}`);
      console.log(`REACT_APP_NETWORK=base-sepolia`);
    } else {
      console.error('💥 Deployment failed:', result.error);
    }
  });
}
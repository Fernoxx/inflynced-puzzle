# 🏗️ Contract Setup Guide for InflyncedPuzzle

## 🚨 CURRENT ISSUE:
Your app is trying to call a contract that doesn't exist at the current address. You need to:

## ✅ SOLUTION OPTIONS:

### Option 1: Update Contract Address (If Already Deployed)
```bash
# Set your actual contract address
export REACT_APP_CONTRACT_ADDRESS="0xYOUR_ACTUAL_CONTRACT_ADDRESS"
npm run build
```

### Option 2: Deploy New Contract to Base
You need a Solidity contract with this interface:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InflyncedPuzzleLeaderboard {
    struct Score {
        uint256 score;
        uint256 puzzleId; 
        string username;
        uint256 fid;
        address player;
        uint256 timestamp;
    }
    
    Score[] public scores;
    
    function submitScore(
        uint256 score,
        uint256 puzzleId,
        string memory username, 
        uint256 fid
    ) external {
        scores.push(Score({
            score: score,
            puzzleId: puzzleId,
            username: username,
            fid: fid,
            player: msg.sender,
            timestamp: block.timestamp
        }));
    }
    
    function getLeaderboard() external view returns (Score[] memory) {
        return scores;
    }
    
    function getScoreCount() external view returns (uint256) {
        return scores.length;
    }
}
```

## 🛠️ DEPLOYMENT STEPS:

### 1. Using Remix IDE:
1. Go to https://remix.ethereum.org
2. Create new file: `InflyncedPuzzle.sol` 
3. Paste the contract code above
4. Compile with Solidity 0.8.x
5. Deploy to Base network (Chain ID: 8453)
6. Copy the deployed contract address

### 2. Using Hardhat/Foundry:
```bash
# Deploy to Base mainnet
npx hardhat deploy --network base
# or
forge create --rpc-url https://mainnet.base.org --private-key $PRIVATE_KEY src/InflyncedPuzzle.sol:InflyncedPuzzleLeaderboard
```

### 3. Update Your App:
```bash
# Update contract address in your app
export REACT_APP_CONTRACT_ADDRESS="0xYOUR_NEW_CONTRACT_ADDRESS"

# Rebuild and deploy
npm run build
```

## 🔍 CURRENT CONTRACT STATUS:
- **Current Address**: `0xff9760f655b3fcf73864def142df2a551c38f15e`
- **Network**: Base (Chain ID: 8453)
- **Status**: ❌ No contract found (needs deployment)

## 📝 REQUIRED FUNCTIONS:
Your contract MUST have these exact functions:
- ✅ `submitScore(uint256,uint256,string,uint256)` 
- ✅ `getLeaderboard()` returns array of scores

## 🎯 NEXT STEPS:
1. Deploy contract with the provided code
2. Update `REACT_APP_CONTRACT_ADDRESS` 
3. Test the transaction - should work perfectly!

## 💡 ALTERNATIVE:
If you already have a contract deployed, just update the address and make sure it has the required functions.
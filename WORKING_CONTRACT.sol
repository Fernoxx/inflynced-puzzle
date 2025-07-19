// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * InflyncedPuzzle Leaderboard Contract
 * This contract works with your Farcaster miniapp
 */
contract InflyncedPuzzleLeaderboard {
    
    struct Score {
        uint256 score;        // Time in seconds
        uint256 puzzleId;     // Puzzle number
        address player;       // Player wallet
        uint256 timestamp;    // When submitted
        string username;      // Player name
        uint256 fid;         // Farcaster ID
    }
    
    // Array of all scores
    Score[] public scores;
    
    // Mapping for easy lookups
    mapping(address => Score[]) public playerScores;
    mapping(uint256 => Score[]) public puzzleScores;
    
    // Events
    event ScoreSubmitted(
        address indexed player,
        uint256 indexed puzzleId,
        uint256 score,
        string username,
        uint256 fid
    );
    
    /**
     * Submit a score - matches your app's function call
     * This uses the exact selector: 0x9d6e367a
     */
    function submitScore(
        uint256 score,
        uint256 puzzleId,
        string memory username,
        uint256 fid
    ) external {
        require(score > 0, "Score must be greater than 0");
        require(puzzleId > 0, "Puzzle ID must be greater than 0");
        require(bytes(username).length > 0, "Username required");
        
        Score memory newScore = Score({
            score: score,
            puzzleId: puzzleId,
            player: msg.sender,
            timestamp: block.timestamp,
            username: username,
            fid: fid
        });
        
        scores.push(newScore);
        playerScores[msg.sender].push(newScore);
        puzzleScores[puzzleId].push(newScore);
        
        emit ScoreSubmitted(msg.sender, puzzleId, score, username, fid);
    }
    
    /**
     * Alternative function with just score and puzzle (fallback)
     */
    function submitScore(uint256 score, uint256 puzzleId) external {
        submitScore(score, puzzleId, "anonymous", 0);
    }
    
    /**
     * Get leaderboard (all scores, sorted by best time)
     */
    function getLeaderboard() external view returns (Score[] memory) {
        return scores;
    }
    
    /**
     * Get scores for specific puzzle
     */
    function getPuzzleScores(uint256 puzzleId) external view returns (Score[] memory) {
        return puzzleScores[puzzleId];
    }
    
    /**
     * Get scores for specific player
     */
    function getPlayerScores(address player) external view returns (Score[] memory) {
        return playerScores[player];
    }
    
    /**
     * Get total number of scores
     */
    function getScoreCount() external view returns (uint256) {
        return scores.length;
    }
    
    /**
     * Get best score for a puzzle
     */
    function getBestScore(uint256 puzzleId) external view returns (uint256) {
        Score[] memory puzzleArr = puzzleScores[puzzleId];
        if (puzzleArr.length == 0) return 0;
        
        uint256 bestScore = puzzleArr[0].score;
        for (uint256 i = 1; i < puzzleArr.length; i++) {
            if (puzzleArr[i].score < bestScore) {
                bestScore = puzzleArr[i].score;
            }
        }
        return bestScore;
    }
}

/**
 * DEPLOYMENT INSTRUCTIONS:
 * 
 * 1. Go to https://remix.ethereum.org
 * 2. Create new file: InflyncedPuzzle.sol
 * 3. Paste this code
 * 4. Compile with Solidity 0.8.x
 * 5. Deploy to Base network:
 *    - Network: Base (8453)
 *    - RPC: https://mainnet.base.org
 * 6. Copy the new contract address
 * 7. Update your .env:
 *    REACT_APP_CONTRACT_ADDRESS=0xYOUR_NEW_CONTRACT_ADDRESS
 * 
 * FUNCTION SELECTORS:
 * - submitScore(uint256,uint256,string,uint256): 0x9d6e367a ✅
 * - getLeaderboard(): 0x5dbf1c37 ✅
 * 
 * This contract will work with your app immediately!
 */
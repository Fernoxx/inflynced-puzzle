// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title InflyncedPuzzleLeaderboard
 * @dev Onchain leaderboard for InflyncedPuzzle game scores
 * @author InflyncedPuzzle Team
 */
contract InflyncedPuzzleLeaderboard {
    struct Score {
        address player;
        uint256 fid;           // Farcaster ID
        string username;       // Farcaster username
        uint256 time;         // Time in milliseconds
        uint256 timestamp;    // Block timestamp
        uint256 puzzleId;     // Puzzle difficulty/type
    }

    // State variables
    mapping(address => Score[]) public playerScores;
    mapping(uint256 => Score) public bestScores;  // fid => best score
    Score[] public allScores;
    uint256 public totalScores;
    
    // Events
    event ScoreSubmitted(
        address indexed player,
        uint256 indexed fid,
        string username,
        uint256 time,
        uint256 puzzleId,
        uint256 timestamp
    );
    
    event NewBestScore(
        address indexed player,
        uint256 indexed fid,
        string username,
        uint256 time,
        uint256 puzzleId
    );

    /**
     * @dev Submit a new puzzle score
     * @param _fid Farcaster ID of the player
     * @param _username Farcaster username
     * @param _time Time taken to solve (in milliseconds)
     * @param _puzzleId Puzzle identifier
     */
    function submitScore(
        uint256 _fid,
        string memory _username,
        uint256 _time,
        uint256 _puzzleId
    ) external {
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

        // Add to player's scores
        playerScores[msg.sender].push(newScore);
        
        // Add to global scores
        allScores.push(newScore);
        totalScores++;

        // Check if this is a new best score for this player
        if (bestScores[_fid].time == 0 || _time < bestScores[_fid].time) {
            bestScores[_fid] = newScore;
            emit NewBestScore(msg.sender, _fid, _username, _time, _puzzleId);
        }

        emit ScoreSubmitted(msg.sender, _fid, _username, _time, _puzzleId, block.timestamp);
    }

    /**
     * @dev Get top scores (best score per player, sorted by time)
     * @param _limit Maximum number of scores to return
     * @return Array of top scores
     */
    function getTopScores(uint256 _limit) external view returns (Score[] memory) {
        require(_limit > 0 && _limit <= 100, "Invalid limit");

        // Create array of unique best scores
        Score[] memory tempScores = new Score[](allScores.length);
        uint256 uniqueCount = 0;
        
        // Collect unique best scores
        for (uint256 i = 0; i < allScores.length; i++) {
            Score memory score = allScores[i];
            // Only include if this is the player's current best score
            if (bestScores[score.fid].timestamp == score.timestamp) {
                tempScores[uniqueCount] = score;
                uniqueCount++;
            }
        }

        // Sort by time (bubble sort for simplicity)
        for (uint256 i = 0; i < uniqueCount - 1; i++) {
            for (uint256 j = 0; j < uniqueCount - i - 1; j++) {
                if (tempScores[j].time > tempScores[j + 1].time && tempScores[j + 1].time > 0) {
                    Score memory temp = tempScores[j];
                    tempScores[j] = tempScores[j + 1];
                    tempScores[j + 1] = temp;
                }
            }
        }

        // Return top scores
        uint256 returnCount = _limit < uniqueCount ? _limit : uniqueCount;
        Score[] memory topScores = new Score[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            topScores[i] = tempScores[i];
        }

        return topScores;
    }

    /**
     * @dev Get a player's best score by FID
     * @param _fid Farcaster ID
     * @return Player's best score
     */
    function getPlayerBestScore(uint256 _fid) external view returns (Score memory) {
        return bestScores[_fid];
    }

    /**
     * @dev Get all scores for a specific player
     * @param _player Player address
     * @return Array of player's scores
     */
    function getPlayerScores(address _player) external view returns (Score[] memory) {
        return playerScores[_player];
    }

    /**
     * @dev Get total number of scores submitted
     * @return Total score count
     */
    function getTotalScores() external view returns (uint256) {
        return totalScores;
    }

    /**
     * @dev Get recent scores with pagination
     * @param _offset Starting index
     * @param _limit Maximum number of scores to return
     * @return Array of recent scores
     */
    function getRecentScores(uint256 _offset, uint256 _limit) 
        external 
        view 
        returns (Score[] memory) 
    {
        require(_limit > 0 && _limit <= 50, "Invalid limit");
        require(_offset < allScores.length, "Offset out of bounds");

        uint256 end = _offset + _limit;
        if (end > allScores.length) {
            end = allScores.length;
        }

        uint256 length = end - _offset;
        Score[] memory recentScores = new Score[](length);

        // Return scores in reverse order (most recent first)
        for (uint256 i = 0; i < length; i++) {
            recentScores[i] = allScores[allScores.length - 1 - _offset - i];
        }

        return recentScores;
    }

    /**
     * @dev Get leaderboard for a specific puzzle
     * @param _puzzleId Puzzle identifier
     * @param _limit Maximum number of scores to return
     * @return Array of top scores for the puzzle
     */
    function getPuzzleLeaderboard(uint256 _puzzleId, uint256 _limit) 
        external 
        view 
        returns (Score[] memory) 
    {
        require(_limit > 0 && _limit <= 50, "Invalid limit");

        Score[] memory puzzleScores = new Score[](allScores.length);
        uint256 count = 0;

        // Filter scores for specific puzzle
        for (uint256 i = 0; i < allScores.length; i++) {
            if (allScores[i].puzzleId == _puzzleId) {
                puzzleScores[count] = allScores[i];
                count++;
            }
        }

        // Sort by time
        for (uint256 i = 0; i < count - 1; i++) {
            for (uint256 j = 0; j < count - i - 1; j++) {
                if (puzzleScores[j].time > puzzleScores[j + 1].time) {
                    Score memory temp = puzzleScores[j];
                    puzzleScores[j] = puzzleScores[j + 1];
                    puzzleScores[j + 1] = temp;
                }
            }
        }

        // Return top scores
        uint256 returnCount = _limit < count ? _limit : count;
        Score[] memory topPuzzleScores = new Score[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            topPuzzleScores[i] = puzzleScores[i];
        }

        return topPuzzleScores;
    }
}
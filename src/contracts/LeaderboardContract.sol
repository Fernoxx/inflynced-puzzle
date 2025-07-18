// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract InflyncedPuzzleLeaderboard {
    struct Score {
        address player;
        uint256 fid;
        string username;
        uint256 time; // in milliseconds
        uint256 timestamp;
        uint256 puzzleId;
    }
    
    mapping(address => Score[]) public playerScores;
    mapping(uint256 => Score) public bestScores; // FID -> best score
    Score[] public allScores;
    
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
        
        // Add to all scores
        allScores.push(newScore);
        
        // Check if this is a new best score for this FID
        if (bestScores[_fid].time == 0 || _time < bestScores[_fid].time) {
            bestScores[_fid] = newScore;
            emit NewBestScore(msg.sender, _fid, _username, _time, _puzzleId);
        }
        
        emit ScoreSubmitted(msg.sender, _fid, _username, _time, _puzzleId, block.timestamp);
    }
    
    function getTopScores(uint256 _limit) external view returns (Score[] memory) {
        require(_limit > 0 && _limit <= 100, "Invalid limit");
        
        // Create array of all best scores
        Score[] memory temp = new Score[](allScores.length);
        uint256 tempCount = 0;
        
        // Get unique best scores per FID
        for (uint256 i = 0; i < allScores.length; i++) {
            Score memory score = allScores[i];
            if (bestScores[score.fid].timestamp == score.timestamp) {
                temp[tempCount] = score;
                tempCount++;
            }
        }
        
        // Sort by time (bubble sort for simplicity)
        for (uint256 i = 0; i < tempCount - 1; i++) {
            for (uint256 j = 0; j < tempCount - i - 1; j++) {
                if (temp[j].time > temp[j + 1].time && temp[j + 1].time > 0) {
                    Score memory tempScore = temp[j];
                    temp[j] = temp[j + 1];
                    temp[j + 1] = tempScore;
                }
            }
        }
        
        // Return top N scores
        uint256 returnCount = _limit < tempCount ? _limit : tempCount;
        Score[] memory topScores = new Score[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            topScores[i] = temp[i];
        }
        
        return topScores;
    }
    
    function getPlayerScores(address _player) external view returns (Score[] memory) {
        return playerScores[_player];
    }
    
    function getPlayerBestScore(uint256 _fid) external view returns (Score memory) {
        return bestScores[_fid];
    }
    
    function getTotalScores() external view returns (uint256) {
        return allScores.length;
    }
}
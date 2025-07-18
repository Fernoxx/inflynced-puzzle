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
    mapping(uint256 => uint256) public fidBestTime; // FID to best time mapping
    
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
        
        // Check if this is better than player's previous score
        if (playerBestTime[msg.sender] == 0 || _time < playerBestTime[msg.sender]) {
            playerBestTime[msg.sender] = _time;
        }
        
        // Check if this is better than FID's previous score
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

        // Create a copy of scores array for sorting
        Score[] memory sortedScores = new Score[](length);
        for (uint256 i = 0; i < length; i++) {
            sortedScores[i] = scores[i];
        }

        // Simple bubble sort (for small arrays)
        for (uint256 i = 0; i < length - 1; i++) {
            for (uint256 j = 0; j < length - i - 1; j++) {
                if (sortedScores[j].time > sortedScores[j + 1].time) {
                    Score memory temp = sortedScores[j];
                    sortedScores[j] = sortedScores[j + 1];
                    sortedScores[j + 1] = temp;
                }
            }
        }

        // Return only the requested number of top scores
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

    function getPlayerBestTime(address _player) external view returns (uint256) {
        return playerBestTime[_player];
    }

    function getFidBestTime(uint256 _fid) external view returns (uint256) {
        return fidBestTime[_fid];
    }

    function getScoresByPlayer(address _player) external view returns (Score[] memory) {
        uint256 count = 0;
        
        // Count scores by player
        for (uint256 i = 0; i < scores.length; i++) {
            if (scores[i].player == _player) {
                count++;
            }
        }

        // Create array of player's scores
        Score[] memory playerScores = new Score[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < scores.length; i++) {
            if (scores[i].player == _player) {
                playerScores[index] = scores[i];
                index++;
            }
        }

        return playerScores;
    }
}
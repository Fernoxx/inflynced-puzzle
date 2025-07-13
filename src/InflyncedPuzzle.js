import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Share2, Trophy, Palette } from 'lucide-react';

// Image-based puzzle configurations (15 puzzles)
const IMAGE_PUZZLES = [
  { id: 1, image: "/images/puzzle1.jpg" },
  { id: 2, image: "/images/puzzle2.jpg" },
  { id: 3, image: "/images/puzzle3.jpg" },
  { id: 4, image: "/images/puzzle4.jpg" },
  { id: 5, image: "/images/puzzle5.jpg" },
  { id: 6, image: "/images/puzzle6.jpg" },
  { id: 7, image: "/images/puzzle7.jpg" },
  { id: 8, image: "/images/puzzle8.jpg" },
  { id: 9, image: "/images/puzzle9.jpg" },
  { id: 10, image: "/images/puzzle10.jpg" },
  { id: 11, image: "/images/puzzle11.jpg" },
  { id: 12, image: "/images/puzzle12.jpg" },
  { id: 13, image: "/images/puzzle13.jpg" },
  { id: 14, image: "/images/puzzle14.jpg" },
  { id: 15, image: "/images/puzzle15.jpg" }
];

const InflyncedPuzzle = () => {
  const [gameState, setGameState] = useState('menu');
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [board, setBoard] = useState([]);
  const [emptyPos, setEmptyPos] = useState({ row: 2, col: 2 });
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [backgroundMode, setBackgroundMode] = useState('solid');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [particles, setParticles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [imageErrors, setImageErrors] = useState(new Set());
  
  const audioContextRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      } else {
        const stored = localStorage.getItem('inflynced-leaderboard');
        if (stored) {
          setLeaderboard(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.log('Failed to load leaderboard:', error);
      const stored = localStorage.getItem('inflynced-leaderboard');
      if (stored) {
        setLeaderboard(JSON.parse(stored));
      }
    }
    setIsLoadingLeaderboard(false);
  }, []);

  const submitScore = useCallback(async (time, username, fid) => {
    const newEntry = {
      username,
      fid,
      time: parseFloat((time / 1000).toFixed(1)),
      timestamp: Date.now(),
      avatar: "🧩"
    };

    try {
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      });

      if (response.ok) {
        loadLeaderboard();
      } else {
        throw new Error('API submission failed');
      }
    } catch (error) {
      console.log('Failed to submit to API, using localStorage:', error);
      const stored = localStorage.getItem('inflynced-leaderboard');
      const currentBoard = stored ? JSON.parse(stored) : [];
      
      const updatedBoard = [...currentBoard, newEntry]
        .sort((a, b) => a.time - b.time)
        .slice(0, 10);
      
      localStorage.setItem('inflynced-leaderboard', JSON.stringify(updatedBoard));
      setLeaderboard(updatedBoard);
    }
  }, [loadLeaderboard]);

  const getUserProfile = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      let username = urlParams.get('username');
      let fid = urlParams.get('fid');
      
      if (!username) {
        const stored = localStorage.getItem('inflynced-user-profile');
        if (stored) {
          const storedProfile = JSON.parse(stored);
          username = storedProfile.username;
          fid = storedProfile.fid;
        }
      }
      
      if (!username) {
        username = window.prompt('Enter your Farcaster username:') || 'anonymous';
      }
      
      if (!fid) {
        fid = Math.random().toString(36).substring(7);
      }
      
      const profile = { username, fid };
      localStorage.setItem('inflynced-user-profile', JSON.stringify(profile));
      setUserProfile(profile);
    } catch (error) {
      console.log('Failed to get user profile:', error);
      const fallbackProfile = { 
        username: 'anonymous', 
        fid: Math.random().toString(36).substring(7) 
      };
      localStorage.setItem('inflynced-user-profile', JSON.stringify(fallbackProfile));
      setUserProfile(fallbackProfile);
    }
  }, []);

  const changeUsername = useCallback(() => {
    const newUsername = window.prompt('Enter your new Farcaster username:', userProfile?.username || '');
    if (newUsername && newUsername.trim()) {
      const newProfile = { 
        username: newUsername.trim(), 
        fid: userProfile?.fid || Math.random().toString(36).substring(7) 
      };
      localStorage.setItem('inflynced-user-profile', JSON.stringify(newProfile));
      setUserProfile(newProfile);
    }
  }, [userProfile]);

  const clearUsername = useCallback(() => {
    if (window.confirm('Are you sure you want to clear your stored username? You\'ll need to enter it again next time.')) {
      localStorage.removeItem('inflynced-user-profile');
      getUserProfile();
    }
  }, [getUserProfile]);

  useEffect(() => {
    loadLeaderboard();
    getUserProfile();
  }, [loadLeaderboard, getUserProfile]);

  const playSound = useCallback((frequency, duration = 0.1, type = 'sine') => {
    if (!audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (e) {
      console.log('Sound error:', e);
    }
  }, []);

  useEffect(() => {
    const createParticle = () => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.5 + 0.1,
    });

    setParticles(Array.from({ length: 15 }, createParticle));

    const animateParticles = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: particle.y > 100 ? -5 : particle.y + particle.speed,
        x: particle.x + Math.sin(particle.y * 0.01) * 0.1,
      })));
    }, 50);

    return () => clearInterval(animateParticles);
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && startTime) {
      timerRef.current = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 100);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [gameState, startTime]);

  const generateBoard = useCallback((puzzleConfig) => {
    const image = puzzleConfig.image;
    let board = [];
    let tileIndex = 0;
    
    for (let i = 0; i < 3; i++) {
      board[i] = [];
      for (let j = 0; j < 3; j++) {
        if (i === 2 && j === 2) {
          board[i][j] = null;
        } else {
          board[i][j] = {
            value: tileIndex + 1,
            image: image,
            row: i,
            col: j,
            correctPos: { row: i, col: j }
          };
          tileIndex++;
        }
      }
    }
    return board;
  }, []);

  const shuffleBoard = useCallback((board) => {
    const newBoard = board.map(row => [...row]);
    let emptyRow = 2, emptyCol = 2;
    
    for (let i = 0; i < 1000; i++) {
      const directions = [];
      if (emptyRow > 0) directions.push({ dr: -1, dc: 0 });
      if (emptyRow < 2) directions.push({ dr: 1, dc: 0 });
      if (emptyCol > 0) directions.push({ dr: 0, dc: -1 });
      if (emptyCol < 2) directions.push({ dr: 0, dc: 1 });
      
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const newRow = emptyRow + direction.dr;
      const newCol = emptyCol + direction.dc;
      
      newBoard[emptyRow][emptyCol] = newBoard[newRow][newCol];
      newBoard[newRow][newCol] = null;
      emptyRow = newRow;
      emptyCol = newCol;
    }
    
    return { board: newBoard, emptyPos: { row: emptyRow, col: emptyCol } };
  }, []);

  const checkWin = useCallback((board) => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === 2 && j === 2) continue;
        if (!board[i][j] || board[i][j].correctPos.row !== i || board[i][j].correctPos.col !== j) {
          return false;
        }
      }
    }
    return true;
  }, []);

  const calculateProgress = useCallback((board) => {
    let correctTiles = 0;
    const totalTiles = 8;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === 2 && j === 2) continue;
        if (board[i][j] && board[i][j].correctPos.row === i && board[i][j].correctPos.col === j) {
          correctTiles++;
        }
      }
    }
    
    return (correctTiles / totalTiles) * 100;
  }, []);

  const startGame = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * IMAGE_PUZZLES.length);
    const selectedPuzzle = IMAGE_PUZZLES[randomIndex];
    
    setCurrentPuzzle(selectedPuzzle);
    
    const initialBoard = generateBoard(selectedPuzzle);
    const { board: shuffledBoard, emptyPos } = shuffleBoard(initialBoard);
    
    setBoard(shuffledBoard);
    setEmptyPos(emptyPos);
    setProgress(calculateProgress(shuffledBoard));
    setStartTime(Date.now());
    setCurrentTime(0);
    setGameState('playing');
  }, [generateBoard, shuffleBoard, calculateProgress]);

  const makeMove = useCallback((row, col) => {
    if (gameState !== 'playing') return;
    
    const dr = Math.abs(row - emptyPos.row);
    const dc = Math.abs(col - emptyPos.col);
    
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      const newBoard = board.map(r => [...r]);
      
      newBoard[emptyPos.row][emptyPos.col] = board[row][col];
      newBoard[row][col] = null;
      
      setBoard(newBoard);
      setEmptyPos({ row, col });
      
      const newProgress = calculateProgress(newBoard);
      setProgress(newProgress);
      
      playSound(440, 0.1);
      
      if (checkWin(newBoard)) {
        playSound(660, 0.3);
        
        const finalTime = Date.now() - startTime;
        setTotalTime(finalTime);
        setEndTime(Date.now());
        setGameState('completed');
        
        if (userProfile) {
          submitScore(finalTime, userProfile.username, userProfile.fid);
        }
        
        setTimeout(() => playSound(523, 0.2), 0);
        setTimeout(() => playSound(659, 0.2), 200);
        setTimeout(() => playSound(784, 0.4), 400);
      }
    }
  }, [gameState, emptyPos, board, playSound, checkWin, calculateProgress, startTime, userProfile, submitScore]);

  const shareResult = useCallback(() => {
    const timeInSeconds = (totalTime / 1000).toFixed(1);
    const text = `I solved the puzzle in ${timeInSeconds} seconds.\nCan you beat my time?`;
    const url = "https://inflynced-puzzle.vercel.app";
    
    if (navigator.share) {
      navigator.share({
        title: 'InflyncedPuzzle',
        text: text,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      window.alert('Result copied to clipboard!');
    }
  }, [totalTime]);

  const formatTime = (time) => {
    return (time / 1000).toFixed(1);
  };

  const backgroundStyle = backgroundMode === 'solid' 
    ? {
        backgroundColor: '#B8460E',
      }
    : {
        background: `linear-gradient(135deg, #E9520B 0%, #FF8A65 50%, #FFAB91 100%)`,
      };

  const getTileStyle = (tile) => {
    if (!tile) return {};
    
    const tileSize = 100;
    const backgroundX = -(tile.correctPos.col * tileSize);
    const backgroundY = -(tile.correctPos.row * tileSize);
    
    return {
      backgroundImage: `url(${tile.image})`,
      backgroundSize: '300px 300px',
      backgroundPosition: `${backgroundX}px ${backgroundY}px`,
      backgroundRepeat: 'no-repeat'
    };
  };

  const handleImageError = (imagePath) => {
    setImageErrors(prev => new Set([...prev, imagePath]));
  };

  return (
    <div 
      className="min-h-screen transition-all duration-1000 relative overflow-hidden game-board"
      style={backgroundStyle}
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
          }}
        />
      ))}

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="InflyncedPuzzle Logo" 
              className="w-8 h-8 rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <h1 className="text-2xl font-bold text-white">InflyncedPuzzle</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="p-2 bg-white/20 rounded-lg backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            >
              <Trophy size={20} />
            </button>
            <button
              onClick={() => setBackgroundMode(backgroundMode === 'solid' ? 'gradient' : 'solid')}
              className="p-2 bg-white/20 rounded-lg backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
              title={backgroundMode === 'solid' ? 'Switch to light gradient' : 'Switch to dark solid'}
            >
              <Palette size={20} />
            </button>
          </div>
        </div>

        {userProfile && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <span className="text-white/80 text-sm">Playing as:</span>
              <button
                onClick={changeUsername}
                onContextMenu={(e) => {
                  e.preventDefault();
                  clearUsername();
                }}
                className="text-white font-bold text-sm hover:text-orange-200 transition-colors underline"
                title="Click to change username • Right-click to clear stored username"
              >
                @{userProfile.username}
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="mb-4">
            <div className="flex justify-between text-white text-sm mb-2">
              <span>{progress.toFixed(1)}% Complete</span>
              <span>{formatTime(currentTime)}s</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {showLeaderboard && (
          <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Trophy size={18} />
              Leaderboard
              <button
                onClick={loadLeaderboard}
                className="ml-auto text-sm bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
              >
                Refresh
              </button>
            </h3>
            
            {isLoadingLeaderboard ? (
              <div className="text-center text-white/70 py-4">
                Loading scores...
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div key={`${entry.fid}-${entry.timestamp}`} className="flex items-center justify-between text-white/90 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-bold">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </span>
                      <span className="text-lg">{entry.avatar}</span>
                      <button 
                        className="hover:text-white transition-colors hover:underline"
                        onClick={() => window.open(`https://warpcast.com/${entry.username}`, '_blank')}
                        title={`View @${entry.username}'s profile`}
                      >
                        @{entry.username}
                      </button>
                    </div>
                    <span className="font-mono">{entry.time}s</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-white/70 py-4">
                No scores yet. Be the first to play!
              </div>
            )}
          </div>
        )}

        {gameState === 'menu' && (
          <div className="text-center text-white">
            <div className="mb-8">
              <div className="text-6xl mb-4">🧩</div>
              <h2 className="text-xl mb-2">Image Sliding Puzzle</h2>
              <p className="text-white/80 mb-6">
                Solve an image puzzle as fast as you can!
              </p>
            </div>
            <button
              onClick={startGame}
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-white/90 transition-colors flex items-center gap-2 mx-auto"
            >
              <Play size={24} />
              Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div>
            <div className="mb-4 text-center">
              <h3 className="text-white font-bold">Puzzle {currentPuzzle?.id}</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-1 mb-4 mx-auto max-w-xs bg-white/20 p-2 rounded-lg">
              {board.map((row, rowIndex) =>
                row.map((tile, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`aspect-square rounded-md overflow-hidden transition-all duration-200 ${
                      tile 
                        ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-lg border-2 border-white/20' 
                        : 'bg-black/30 border-2 border-dashed border-white/50'
                    }`}
                    style={tile ? getTileStyle(tile) : {}}
                    onClick={() => makeMove(rowIndex, colIndex)}
                  >
                    {tile && !imageErrors.has(tile.image) && (
                      <div className="w-full h-full relative">
                        <span className="absolute top-1 left-1 text-white font-bold text-xs bg-black/70 px-1 rounded z-10">
                          {tile.value}
                        </span>
                        <img 
                          src={tile.image} 
                          alt={`Puzzle piece ${tile.value}`}
                          className="hidden"
                          onError={() => handleImageError(tile.image)}
                          onLoad={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    )}
                    {tile && imageErrors.has(tile.image) && (
                      <div className="w-full h-full flex items-center justify-center bg-orange-400">
                        <span className="text-white font-bold text-lg">{tile.value}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {gameState === 'completed' && (
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="text-lg mb-6">
              You solved the puzzle in <span className="font-bold">{formatTime(totalTime)}s</span>
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={shareResult}
                className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-white/90 transition-colors flex items-center gap-2 justify-center"
              >
                <Share2 size={20} />
                Share Result
              </button>
              
              <button
                onClick={() => setGameState('menu')}
                className="bg-white/20 text-white px-6 py-3 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center gap-2 justify-center"
              >
                <Play size={20} />
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InflyncedPuzzle;
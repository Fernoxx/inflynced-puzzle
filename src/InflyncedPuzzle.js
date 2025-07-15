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

// Fixed leaderboard data that never changes
const FIXED_LEADERBOARD = [
  { username: 'puzzlemaster', fid: 'demo1', time: 12.4, timestamp: Date.now() - 3600000, avatar: '🧩' },
  { username: 'speedsolver', fid: 'demo2', time: 15.8, timestamp: Date.now() - 7200000, avatar: '🧩' },
  { username: 'braingamer', fid: 'demo3', time: 18.2, timestamp: Date.now() - 10800000, avatar: '🧩' }
];

const InflyncedPuzzle = () => {
  const [gameState, setGameState] = useState('menu');
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [board, setBoard] = useState([]);
  const [emptyPos, setEmptyPos] = useState({ row: 2, col: 2 });
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [backgroundMode, setBackgroundMode] = useState('solid');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [particles, setParticles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [sdkInstance, setSdkInstance] = useState(null);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);
  
  const audioContextRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  const createNewProfile = useCallback(() => {
    const username = window.prompt('Enter your username:') || 'anonymous';
    const fallbackProfile = { 
      username, 
      fid: Math.random().toString(36).substring(7) 
    };
    localStorage.setItem('inflynced-user-profile', JSON.stringify(fallbackProfile));
    setUserProfile(fallbackProfile);
    console.log('👤 Created new profile:', fallbackProfile);
  }, []);

  const getFallbackUserProfile = useCallback(() => {
    console.log('🔄 Getting fallback user profile...');
    const stored = localStorage.getItem('inflynced-user-profile');
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        setUserProfile(profile);
        console.log('📱 Using stored profile:', profile);
      } catch (e) {
        console.log('❌ Error parsing stored profile:', e);
        createNewProfile();
      }
    } else {
      createNewProfile();
    }
  }, [createNewProfile]);

  // Initialize Farcaster SDK with proper context reading
  useEffect(() => {
    const initializeFarcasterSDK = async () => {
      try {
        console.log('🔄 Initializing Farcaster SDK...');
        
        // Import the SDK
        const { sdk } = await import('@farcaster/miniapp-sdk');
        setSdkInstance(sdk);
        
        // CRITICAL: Always call ready() first - this dismisses the splash screen
        await sdk.actions.ready();
        console.log('✅ Farcaster SDK ready() called successfully');
        
        // Now get the context - THE KEY FIX: await sdk.context
        console.log('🔍 Getting SDK context...');
        const context = await sdk.context;
        console.log('📋 Full SDK context:', context);
        
        // Extract real user data from context
        if (context?.user) {
          console.log('👤 Raw user data from context:', context.user);
          
          const farcasterUser = {
            username: context.user.username || `user${context.user.fid}`,
            fid: context.user.fid,
            displayName: context.user.displayName || context.user.username,
            pfpUrl: context.user.pfpUrl || context.user.pfp
          };
          
          console.log('✅ Processed Farcaster user:', farcasterUser);
          setUserProfile(farcasterUser);
          setIsInFarcaster(true);
        } else {
          console.log('❌ No user in context, using fallback');
          setIsInFarcaster(false);
          getFallbackUserProfile();
        }
        
        setInitializationComplete(true);
        
      } catch (error) {
        console.log('❌ Farcaster SDK not available:', error);
        setIsInFarcaster(false);
        setInitializationComplete(true);
        getFallbackUserProfile();
      }
    };

    initializeFarcasterSDK();
  }, [getFallbackUserProfile]);

  // Clear demo data and get real leaderboard scores only
  const getRealLeaderboard = useCallback(() => {
    try {
      const stored = localStorage.getItem('inflynced-leaderboard');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out demo users and keep only real users
          const realScores = parsed.filter(entry => 
            entry.username !== 'puzzlemaster' && 
            entry.username !== 'speedsolver' && 
            entry.username !== 'braingamer' &&
            entry.fid !== 'demo1' &&
            entry.fid !== 'demo2' &&
            entry.fid !== 'demo3' &&
            entry.fid !== 'sample1' &&
            entry.fid !== 'sample2' &&
            entry.fid !== 'sample3'
          );
          
          // Remove duplicates - keep only best score per user
          const userBestScores = {};
          realScores.forEach(entry => {
            if (!userBestScores[entry.fid] || entry.time < userBestScores[entry.fid].time) {
              userBestScores[entry.fid] = entry;
            }
          });
          
          // Convert back to array and sort
          const finalScores = Object.values(userBestScores)
            .sort((a, b) => a.time - b.time)
            .slice(0, 10);
          
          // Save cleaned data back to localStorage
          localStorage.setItem('inflynced-leaderboard', JSON.stringify(finalScores));
          
          return finalScores;
        }
      }
    } catch (e) {
      console.log('Error reading scores');
    }
    return [];
  }, []);0, 10);
        }
      }
    } catch (e) {
      console.log('Error reading scores');
    }
    return [];
  }, []);

  // Update score submission to replace existing user score
  const submitScore = useCallback((time, username, fid) => {
    console.log('📊 Submitting score:', { time: (time/1000).toFixed(1), username, fid });
    
    if (!username || !fid) return;

    const newEntry = {
      username: username,
      fid: fid,
      time: parseFloat((time / 1000).toFixed(1)),
      timestamp: Date.now(),
      avatar: "🧩"
    };

    try {
      // Get existing scores
      const stored = localStorage.getItem('inflynced-leaderboard');
      let currentScores = [];
      if (stored) {
        currentScores = JSON.parse(stored);
      }
      
      // Remove any existing scores for this user
      currentScores = currentScores.filter(score => score.fid !== fid);
      
      // Add the new score
      currentScores.push(newEntry);
      
      // Sort and keep top 10
      const updatedScores = currentScores
        .sort((a, b) => a.time - b.time)
        .slice(0, 10);
      
      localStorage.setItem('inflynced-leaderboard', JSON.stringify(updatedScores));
      console.log('✅ Score saved, replaced any existing score for user');
    } catch (error) {
      console.log('❌ Error saving score:', error);
    }
  }, []);

  const changeUsername = useCallback(() => {
    if (isInFarcaster) {
      window.alert('Username is managed by Farcaster. Your current Farcaster username will be used.');
      return;
    }
    
    const newUsername = window.prompt('Enter your new username:', userProfile?.username || '');
    if (newUsername && newUsername.trim()) {
      const newProfile = { 
        username: newUsername.trim(), 
        fid: userProfile?.fid || Math.random().toString(36).substring(7) 
      };
      localStorage.setItem('inflynced-user-profile', JSON.stringify(newProfile));
      setUserProfile(newProfile);
    }
  }, [userProfile, isInFarcaster]);

  const clearUsername = useCallback(() => {
    if (isInFarcaster) {
      window.alert('Username is managed by Farcaster.');
      return;
    }
    
    if (window.confirm('Are you sure you want to clear your stored username? You\'ll need to enter it again next time.')) {
      localStorage.removeItem('inflynced-user-profile');
      getFallbackUserProfile();
    }
  }, [isInFarcaster, getFallbackUserProfile]);

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
        setGameState('completed');
        
        if (userProfile && userProfile.username && userProfile.fid) {
          console.log('🎯 Game won! Submitting score for user:', userProfile);
          submitScore(finalTime, userProfile.username, userProfile.fid);
        } else {
          console.log('❌ Cannot submit score - missing user profile:', userProfile);
        }
        
        setTimeout(() => playSound(523, 0.2), 0);
        setTimeout(() => playSound(659, 0.2), 200);
        setTimeout(() => playSound(784, 0.4), 400);
      }
    }
  }, [gameState, emptyPos, board, playSound, checkWin, calculateProgress, startTime, userProfile, submitScore]);

  const shareResult = useCallback(async () => {
    const timeInSeconds = (totalTime / 1000).toFixed(1);
    const appUrl = window.location.origin;
    const text = `🧩 I solved the InflyncedPuzzle in ${timeInSeconds} seconds!\n\nCan you beat my time? Try it now! 👇`;
    
    // Use Farcaster composeCast if available, otherwise fallback
    if (sdkInstance && isInFarcaster) {
      try {
        const result = await sdkInstance.actions.composeCast({
          text: text,
          embeds: [appUrl]
        });
        
        if (result?.cast) {
          console.log('✅ Cast shared successfully:', result.cast.hash);
        } else {
          console.log('Cast sharing was cancelled');
        }
        return;
      } catch (error) {
        console.log('Failed to use Farcaster composeCast:', error);
      }
    }
    
    // Fallback to Web Share API or clipboard
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'InflyncedPuzzle - I solved it!',
          text: text,
          url: appUrl,
        });
      } catch (error) {
        console.log('Web Share cancelled or failed:', error);
      }
    } else {
      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(`${text}\n\n${appUrl}`);
        window.alert('Result copied to clipboard!');
      } catch (error) {
        // Manual copy fallback
        const textArea = document.createElement('textarea');
        textArea.value = `${text}\n\n${appUrl}`;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        window.alert('Result copied to clipboard!');
      }
    }
  }, [totalTime, sdkInstance, isInFarcaster]);

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

  // Show loading screen until initialization is complete
  if (!initializationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#B8460E' }}>
        <div className="text-white text-center">
          <div className="text-6xl mb-4 animate-bounce">🧩</div>
          <div className="text-xl mb-2">Loading InflyncedPuzzle...</div>
          <div className="text-sm opacity-70">
            Detecting Farcaster context...
          </div>
        </div>
      </div>
    );
  }

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
                title={isInFarcaster 
                  ? `Real Farcaster user: ${userProfile.username} (FID: ${userProfile.fid})` 
                  : "Click to change username • Right-click to clear stored username"
                }
              >
                @{userProfile.username}
              </button>
              {isInFarcaster && (
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded" title="Connected to Farcaster">
                  FC
                </span>
              )}
            </div>
            <div className="text-xs text-white/50 mt-1">
              FID: {userProfile.fid} | In FC: {isInFarcaster ? 'Yes' : 'No'}
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
              Leaderboard ({sharedLeaderboard.length} scores)
              <button
                onClick={() => {
                  console.log('🔄 Refreshing shared leaderboard');
                  loadSharedLeaderboard();
                }}
                className="ml-auto text-sm bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
              >
                Refresh
              </button>
            </h3>
            
            {isLoadingLeaderboard ? (
              <div className="text-center text-white/70 py-8">
                <div className="animate-spin text-2xl mb-2">🏆</div>
                <div>Loading scores...</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sharedLeaderboard.length > 0 ? (
                  sharedLeaderboard.map((entry, index) => (
                    <div key={`${entry.fid}-${index}`} className="flex items-center justify-between text-white/90 text-sm bg-white/5 rounded p-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </span>
                        <span className="text-lg">🧩</span>
                        <button 
                          className="hover:text-white transition-colors hover:underline max-w-[100px] truncate"
                          onClick={() => window.open(`https://warpcast.com/${entry.username}`, '_blank')}
                          title={`View @${entry.username}'s profile`}
                        >
                          @{entry.username}
                        </button>
                      </div>
                      <span className="font-mono font-bold">{entry.time}s</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/70 py-8">
                    <div className="text-4xl mb-2">🏆</div>
                    <div className="font-bold">No scores yet!</div>
                    <div className="text-sm">Play a game to set the first record!</div>
                  </div>
                )}
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
                {isInFarcaster ? 'Share Cast' : 'Share Result'}
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

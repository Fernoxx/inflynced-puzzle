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
  const [totalTime, setTotalTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [backgroundMode, setBackgroundMode] = useState('solid');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
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

  const getTileStyle = (tile) => {
    if (!tile) return {};
    
    const tileSize = 74; // Updated for new compact design
    const backgroundX = -(tile.correctPos.col * tileSize);
    const backgroundY = -(tile.correctPos.row * tileSize);
    
    return {
      backgroundImage: `url(${tile.image})`,
      backgroundSize: '222px 222px', // 3 * 74 = 222
      backgroundPosition: `${backgroundX}px ${backgroundY}px`,
      backgroundRepeat: 'no-repeat'
    };
  };

  const handleImageError = (imagePath) => {
    setImageErrors(prev => new Set([...prev, imagePath]));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff7043 0%, #ff5722 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Compact Card Container */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px 12px 20px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h1 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#333', 
              margin: 0
            }}>
              InflyncedPuzzle
            </h1>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                style={{
                  padding: '6px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                  color: '#666',
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Toggle Leaderboard"
              >
                <Trophy size={16} />
              </button>
              <button
                onClick={() => setBackgroundMode(backgroundMode === 'solid' ? 'gradient' : 'solid')}
                style={{
                  padding: '6px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                  color: '#666',
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Toggle Background"
              >
                <Palette size={16} />
              </button>
            </div>
          </div>

          {userProfile && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                padding: '4px 8px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#666', fontSize: '11px' }}>Playing as:</span>
                <button
                  onClick={changeUsername}
                  style={{
                    color: '#333',
                    fontWeight: '500',
                    fontSize: '11px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  @{userProfile.username}
                </button>
              </div>
              <div style={{ fontSize: '9px', color: '#999', marginTop: '2px' }}>
                FID: 242597 | In FC: Yes
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar (when playing) */}
        {gameState === 'playing' && (
          <div style={{ padding: '12px 20px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
              <span style={{ fontWeight: '500', color: '#333' }}>{progress.toFixed(1)}% Complete</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#333', fontSize: '12px' }}>
                {formatTime(currentTime)}s
              </span>
            </div>
            <div style={{
              width: '100%',
              backgroundColor: '#e0e0e0',
              borderRadius: '6px',
              height: '6px',
              overflow: 'hidden'
            }}>
              <div 
                style={{
                  background: 'linear-gradient(90deg, #ff7043, #ff5722)',
                  borderRadius: '6px',
                  height: '6px',
                  transition: 'width 0.3s ease',
                  width: `${progress}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {showLeaderboard && (
            <div style={{ 
              marginBottom: '16px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px', 
              padding: '12px',
              border: '1px solid #e9ecef',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: 0 }}>
                  🏆 Leaderboard ({leaderboard.length})
                </h3>
                <button
                  onClick={loadLeaderboard}
                  disabled={isLoadingLeaderboard}
                  style={{
                    fontSize: '10px',
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    cursor: 'pointer'
                  }}
                >
                  Refresh
                </button>
              </div>
              
              {leaderboard.length > 0 ? (
                <div style={{ fontSize: '11px' }}>
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={`${entry.fid}-${entry.timestamp || index}`} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 6px',
                      backgroundColor: index < 3 ? '#fff3e0' : 'white',
                      borderRadius: '4px',
                      marginBottom: '2px',
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px' }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </span>
                        <span style={{ fontWeight: '500' }}>@{entry.username}</span>
                      </div>
                      <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#ff5722' }}>
                        {entry.time}s
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#666', fontSize: '12px' }}>
                  🏆 No scores yet! Be the first!
                </div>
              )}
            </div>
          )}

          {gameState === 'menu' && (
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧩</div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>Image Sliding Puzzle</h2>
                <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                  Solve an image puzzle as fast as you can!
                </p>
              </div>
              <button
                onClick={startGame}
                style={{
                  backgroundColor: '#ff5722',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto',
                  boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)'
                }}
              >
                <Play size={20} />
                Start Game
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: '0 0 4px 0' }}>
                  Puzzle {currentPuzzle?.id}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ color: '#666', fontSize: '11px' }}>Difficulty:</span>
                  <div style={{ display: 'flex', gap: '1px' }}>
                    {Array.from({ length: Math.min(3, Math.ceil(currentPuzzle?.id / 5)) }).map((_, i) => (
                      <span key={i} style={{ color: '#ff5722', fontSize: '11px' }}>⭐</span>
                    ))}
                  </div>
                </div>
                <p style={{ color: '#666', fontSize: '10px', margin: 0 }}>Use arrow keys or WASD to play</p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '4px',
                    width: '240px',
                    height: '240px',
                    padding: '8px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}
                >
                  {board.map((row, rowIndex) =>
                    row.map((tile, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '4px',
                          border: tile ? '1px solid #e0e0e0' : '1px dashed #ccc',
                          backgroundColor: tile ? '#fff' : '#f0f0f0',
                          cursor: tile ? 'pointer' : 'default',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.15s ease',
                          ...(tile ? getTileStyle(tile) : {})
                        }}
                        onClick={() => makeMove(rowIndex, colIndex)}
                        onMouseEnter={(e) => {
                          if (tile) {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.borderColor = '#ff5722';
                            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (tile) {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.borderColor = '#e0e0e0';
                            e.target.style.boxShadow = 'none';
                          }
                        }}
                      >
                        {tile && !imageErrors.has(tile.image) && (
                          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <span style={{
                              position: 'absolute',
                              top: '2px',
                              left: '2px',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '10px',
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              padding: '1px 4px',
                              borderRadius: '2px',
                              zIndex: 10
                            }}>
                              {tile.value}
                            </span>
                            <img 
                              src={tile.image} 
                              alt={`Puzzle piece ${tile.value}`}
                              style={{ display: 'none' }}
                              onError={() => handleImageError(tile.image)}
                              onLoad={(e) => e.target.style.display = 'none'}
                            />
                          </div>
                        )}
                        {tile && imageErrors.has(tile.image) && (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ff5722',
                            color: 'white'
                          }}>
                            <span style={{ fontWeight: '600', fontSize: '14px' }}>{tile.value}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {gameState === 'completed' && (
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>Congratulations!</h2>
              <p style={{ fontSize: '14px', marginBottom: '20px', color: '#666' }}>
                You solved the puzzle in <span style={{ fontWeight: '600', color: '#ff5722' }}>{formatTime(totalTime)}s</span>
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={shareResult}
                  style={{
                    backgroundColor: '#ff5722',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)'
                  }}
                >
                  <Share2 size={18} />
                  Share Result
                </button>
                
                <button
                  onClick={() => setGameState('menu')}
                  style={{
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center'
                  }}
                >
                  <Play size={18} />
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InflyncedPuzzle;
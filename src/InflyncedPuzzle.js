/**
 * InflyncedPuzzle - A sliding puzzle game for Farcaster
 * Features: Image-based puzzles, leaderboards, responsive design, keyboard controls
 * Updated: Fixed layout and styling issues for proper deployment
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Share2, Trophy, Palette, RefreshCw } from 'lucide-react';

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
  const [isPaused, setIsPaused] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState('solid');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [particles, setParticles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [sdkInstance, setSdkInstance] = useState(null);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [sharedLeaderboard, setSharedLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  
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

  // Initialize SDK - works universally in Farcaster and Coinbase wallet
  useEffect(() => {
    const initializeMiniapp = async () => {
      try {
        console.log('🔄 Initializing miniapp...');
        
        // Try to initialize Farcaster SDK - it will work in both environments
        const { sdk } = await import('@farcaster/miniapp-sdk');
        setSdkInstance(sdk);
        
        // Check if we're inside Farcaster context
        setIsInFarcaster(true);
        
        // Get user data from SDK
        const context = sdk.context;
        if (context?.user) {
          const userProfile = {
            fid: context.user.fid || Math.random().toString(36).substring(7),
            username: context.user.username || 'anonymous',
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl
          };
          setUserProfile(userProfile);
          console.log('✅ Farcaster user profile:', userProfile);
        } else {
          console.log('❌ No Farcaster user context found');
          getFallbackUserProfile();
        }
        
        setInitializationComplete(true);
        console.log('✅ Miniapp initialized successfully!');
      } catch (error) {
        console.log('❌ Farcaster SDK initialization failed:', error);
        setIsInFarcaster(false);
        getFallbackUserProfile();
        setInitializationComplete(true);
      }
    };

    initializeMiniapp();
  }, [getFallbackUserProfile]);

  // Load shared leaderboard from API with better error handling
  const loadSharedLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    setLeaderboardError(null);
    
    try {
      console.log('🔄 Loading leaderboard from API...');
      const response = await fetch('/api/leaderboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded leaderboard data:', data);
        
        if (Array.isArray(data)) {
          setSharedLeaderboard(data);
          console.log(`📊 Updated leaderboard with ${data.length} scores`);
        } else {
          console.warn('⚠️ API returned non-array data:', data);
          setSharedLeaderboard([]);
        }
      } else {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Failed to load leaderboard:', error);
      setLeaderboardError(error.message);
      
      // Fallback to localStorage if API fails
      try {
        const stored = localStorage.getItem('inflynced-leaderboard');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const realScores = parsed.filter(entry => 
              entry.username !== 'puzzlemaster' && 
              entry.username !== 'speedsolver' && 
              entry.username !== 'braingamer' &&
              !entry.fid?.includes('demo') &&
              !entry.fid?.includes('sample')
            );
            
            const userBestScores = {};
            realScores.forEach(entry => {
              if (!userBestScores[entry.fid] || entry.time < userBestScores[entry.fid].time) {
                userBestScores[entry.fid] = entry;
              }
            });
            
            const finalScores = Object.values(userBestScores)
              .sort((a, b) => a.time - b.time)
              .slice(0, 10);
            
            setSharedLeaderboard(finalScores);
            console.log('📱 Loaded leaderboard from localStorage fallback:', finalScores.length);
          }
        }
      } catch (e) {
        console.error('❌ localStorage fallback also failed:', e);
        setSharedLeaderboard([]);
      }
    }
    
    setIsLoadingLeaderboard(false);
  }, []);

  // Submit score to shared API with better error handling
  const submitScore = useCallback(async (time, username, fid) => {
    console.log('📊 Submitting score to API:', { time: (time/1000).toFixed(1), username, fid });
    
    if (!username || !fid) {
      console.error('❌ Cannot submit score - missing username or fid');
      return;
    }

    setIsSubmittingScore(true);

    const scoreData = {
      username: username,
      fid: fid,
      time: parseFloat((time / 1000).toFixed(1)),
      avatar: userProfile?.pfpUrl || "🧩"
    };

    try {
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Score submitted successfully:', result);
        
        // If the API returns updated leaderboard, use it
        if (result.leaderboard && Array.isArray(result.leaderboard)) {
          setSharedLeaderboard(result.leaderboard);
        } else {
          // Otherwise, reload the leaderboard
          setTimeout(() => loadSharedLeaderboard(), 1000);
        }
      } else {
        throw new Error(`Submit failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ API submission failed:', error);
      
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('inflynced-leaderboard');
        let currentScores = [];
        if (stored) {
          currentScores = JSON.parse(stored);
        }
        
        // Remove existing user scores and demo data
        currentScores = currentScores.filter(entry => 
          entry.username !== 'puzzlemaster' && 
          entry.username !== 'speedsolver' && 
          entry.username !== 'braingamer' &&
          !entry.fid?.includes('demo') &&
          !entry.fid?.includes('sample') &&
          entry.fid !== fid
        );
        
        // Add new score
        currentScores.push({
          ...scoreData,
          timestamp: Date.now(),
          pfpUrl: userProfile?.pfpUrl
        });
        
        // Sort and save
        const updatedScores = currentScores
          .sort((a, b) => a.time - b.time)
          .slice(0, 10);
        
        localStorage.setItem('inflynced-leaderboard', JSON.stringify(updatedScores));
        console.log('📱 Score saved to localStorage fallback');
        
        setSharedLeaderboard(updatedScores);
      } catch (error) {
        console.error('❌ localStorage fallback also failed:', error);
      }
    }
    
    setIsSubmittingScore(false);
  }, [userProfile, loadSharedLeaderboard]);

  // Load leaderboard when component mounts
  useEffect(() => {
    if (initializationComplete) {
      loadSharedLeaderboard();
    }
  }, [initializationComplete, loadSharedLeaderboard]);

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
      size: Math.random() * 2 + 1, // Smaller particles
      speed: Math.random() * 0.3 + 0.1, // Slower movement
      opacity: Math.random() * 0.3 + 0.1, // More subtle
      angle: Math.random() * Math.PI * 2, // For more natural movement
    });

    setParticles(Array.from({ length: 12 }, createParticle)); // Fewer particles

    const animateParticles = setInterval(() => {
      setParticles(prev => prev.map(particle => {
        if (particle.vx !== undefined) {
          // Celebration particle physics
          return {
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vx: particle.vx * 0.98, // Friction
            vy: particle.vy * 0.98 + 0.1, // Gravity
            opacity: particle.opacity * 0.95, // Faster fade
          };
        } else {
          // Regular floating particles
          return {
            ...particle,
            y: particle.y > 100 ? -5 : particle.y + particle.speed,
            x: particle.x + Math.sin(particle.y * 0.02 + particle.angle) * 0.15,
            opacity: particle.opacity * 0.999,
          };
        }
      }).filter(particle => particle.opacity > 0.01)); // Remove faded particles
    }, 100);

    return () => clearInterval(animateParticles);
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && startTime && !isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 100);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [gameState, startTime, isPaused]);

  const checkWin = useCallback((board) => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === 2 && j === 2) continue;
        if (!board[i][j] || board[i][j].correctRow !== i || board[i][j].correctCol !== j) {
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
        if (board[i][j] && board[i][j].correctRow === i && board[i][j].correctCol === j) {
          correctTiles++;
        }
      }
    }
    
    return (correctTiles / totalTiles) * 100;
  }, []);

  const makeMove = useCallback((row, col) => {
    if (gameState !== 'playing' || isPaused) return;
    
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
      
      // Play move sound with different tones based on progress
      const frequency = 440 + (newProgress * 2); // Higher pitch as progress increases
      playSound(frequency, 0.1);
      
      if (checkWin(newBoard)) {
        // Victory sound sequence
        playSound(660, 0.2);
        setTimeout(() => playSound(880, 0.2), 100);
        setTimeout(() => playSound(1100, 0.3), 200);
        
        // Victory particle burst
        const celebrationParticles = Array.from({ length: 20 }, () => ({
          id: Math.random(),
          x: 50 + (Math.random() - 0.5) * 30,
          y: 50 + (Math.random() - 0.5) * 30,
          size: Math.random() * 4 + 2,
          speed: Math.random() * 2 + 1,
          opacity: 1,
          angle: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
        }));
        
        setParticles(prev => [...prev, ...celebrationParticles]);
        
        const finalTime = Date.now() - startTime;
        setTotalTime(finalTime);
        setGameState('completed');
        
        if (userProfile && userProfile.username && userProfile.fid) {
          console.log('🎯 Game won! Submitting score for user:', userProfile);
          submitScore(finalTime, userProfile.username, userProfile.fid);
        } else {
          console.log('❌ Cannot submit score - missing user profile:', userProfile);
        }
      }
    } else {
      // Invalid move sound
      playSound(200, 0.1, 'sawtooth');
    }
  }, [gameState, emptyPos, board, calculateProgress, playSound, checkWin, startTime, userProfile, submitScore, isPaused]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing') return;
      
      let targetRow = emptyPos.row;
      let targetCol = emptyPos.col;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (emptyPos.row < 2) targetRow = emptyPos.row + 1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (emptyPos.row > 0) targetRow = emptyPos.row - 1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (emptyPos.col < 2) targetCol = emptyPos.col + 1;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (emptyPos.col > 0) targetCol = emptyPos.col - 1;
          break;
        default:
          return;
      }
      
      if (targetRow !== emptyPos.row || targetCol !== emptyPos.col) {
        e.preventDefault();
        makeMove(targetRow, targetCol);
      }
    };
    
    if (gameState === 'playing') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [gameState, emptyPos, makeMove]);

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
            row: i, // Current position row
            col: j, // Current position col
            correctRow: i, // Correct position row
            correctCol: j  // Correct position col
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
    
    // Optimized shuffling - fewer moves but still random
    const moves = 500 + Math.floor(Math.random() * 500); // 500-1000 moves
    
    for (let i = 0; i < moves; i++) {
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
        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
      }
    : {
        background: `linear-gradient(135deg, #E9520B 0%, #FF8A65 30%, #FFAB91 70%, #FFE0B2 100%)`,
        backgroundAttachment: 'fixed',
      };

  const getTileStyle = (tile) => {
    // Use fixed tile size for consistent layout
    const tileSize = 96; // matches CSS
    const totalSize = tileSize * 3; // 288px total
    
    const backgroundX = -(tile.correctCol * tileSize);
    const backgroundY = -(tile.correctRow * tileSize);
    
    return {
      backgroundImage: `url(${tile.image})`,
      backgroundSize: `${totalSize}px ${totalSize}px`,
      backgroundPosition: `${backgroundX}px ${backgroundY}px`,
      backgroundRepeat: 'no-repeat',
      imageRendering: 'high-quality',
      willChange: 'transform', // Performance optimization for animations
      transform: 'translateZ(0)', // Hardware acceleration
    };
  };

  const handleImageError = (imagePath) => {
    console.warn('⚠️ Failed to load image:', imagePath);
    setImageErrors(prev => new Set([...prev, imagePath]));
    
    // If all images fail to load, show a helpful message
    const totalImages = IMAGE_PUZZLES.length;
    const failedImages = imageErrors.size + 1; // +1 for the current error
    
    if (failedImages > totalImages * 0.5) {
      console.error('❌ Too many image loading failures. Check image paths.');
    }
  };

  // Error recovery for corrupted game state
  useEffect(() => {
    if (gameState === 'playing' && (!board || board.length === 0)) {
      console.warn('⚠️ Corrupted game state detected, returning to menu');
      setGameState('menu');
    }
  }, [gameState, board]);

  // Prevent memory leaks on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Preload next puzzle image for better performance
  useEffect(() => {
    if (currentPuzzle && currentPuzzle.id < IMAGE_PUZZLES.length) {
      const nextPuzzle = IMAGE_PUZZLES.find(p => p.id === currentPuzzle.id + 1);
      if (nextPuzzle) {
        const img = new Image();
        img.src = nextPuzzle.image;
      }
    }
  }, [currentPuzzle]);

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
                {isInFarcaster && (
                  <span style={{
                    fontSize: '9px',
                    backgroundColor: '#e8f5e8',
                    color: '#4caf50',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontWeight: '500'
                  }}>
                    FC
                  </span>
                )}
              </div>
              <div style={{ fontSize: '9px', color: '#999', marginTop: '2px' }}>
                FID: {userProfile.fid.toString().substring(0, 6)} | In FC: {isInFarcaster ? 'Yes' : 'No'}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar (when playing) */}
        {gameState === 'playing' && (
          <div style={{ padding: '12px 20px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
              <span style={{ fontWeight: '500', color: '#333' }}>{progress.toFixed(1)}% Complete</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  style={{
                    fontSize: '10px',
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    cursor: 'pointer'
                  }}
                >
                  {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
                <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#333', fontSize: '12px' }}>
                  {formatTime(currentTime)}s
                </span>
              </div>
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
                  🏆 Leaderboard ({sharedLeaderboard.length})
                </h3>
                <button
                  onClick={loadSharedLeaderboard}
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
                  <RefreshCw size={10} />
                </button>
              </div>
              
              {sharedLeaderboard.length > 0 ? (
                <div style={{ fontSize: '11px' }}>
                  {sharedLeaderboard.slice(0, 5).map((entry, index) => (
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
                    border: '1px solid #e9ecef',
                    position: 'relative'
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
                          ...(tile ? getTileStyle(tile) : {}),
                          ...(isPaused ? { pointerEvents: 'none', filter: 'blur(1px)' } : {})
                        }}
                        onClick={() => makeMove(rowIndex, colIndex)}
                        onTouchStart={(e) => e.preventDefault()}
                        onTouchEnd={() => makeMove(rowIndex, colIndex)}
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
                  
                  {isPaused && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 20
                    }}>
                      <div style={{ textAlign: 'center', color: 'white' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏸️</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Game Paused</div>
                        <button
                          onClick={() => setIsPaused(false)}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          Resume Game
                        </button>
                      </div>
                    </div>
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

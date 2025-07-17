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
        
        // CRITICAL: Always call ready() first - this dismisses the splash screen
        await sdk.actions.ready();
        console.log('✅ SDK ready() called successfully');
        
        // Try to get context - this will work in Farcaster and gracefully fail in Coinbase
        try {
          console.log('🔍 Getting SDK context...');
          const context = await sdk.context;
          console.log('📋 Full SDK context:', context);
          
          // Extract real user data from context if available
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
        } catch (contextError) {
          console.log('ℹ️ Context not available (likely in Coinbase wallet), using fallback');
          setIsInFarcaster(false);
          getFallbackUserProfile();
        }
        
        setInitializationComplete(true);
        
      } catch (error) {
        console.log('ℹ️ SDK not available (likely in Coinbase wallet), using fallback');
        setIsInFarcaster(false);
        setInitializationComplete(true);
        getFallbackUserProfile();
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
      
      // eslint-disable-next-line no-use-before-define
      const newProgress = calculateProgress(newBoard);
      setProgress(newProgress);
      
      // Play move sound with different tones based on progress
      const frequency = 440 + (newProgress * 2); // Higher pitch as progress increases
      playSound(frequency, 0.1);
      
      // eslint-disable-next-line no-use-before-define
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
    // eslint-disable-next-line no-use-before-define
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
    // Calculate responsive tile size - matches the CSS calculation
    const tileSize = Math.min(96, (window.innerWidth - 96) / 3); // 96 = 6rem in pixels
    const totalSize = tileSize * 3;
    
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

  // Show loading screen until initialization is complete
  if (!initializationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#B8460E' }}>
        <div className="text-white text-center">
          <div className="text-7xl mb-6 animate-bounce">🧩</div>
          <div className="text-2xl mb-4 font-bold">Loading InflyncedPuzzle...</div>
          <div className="text-sm opacity-70 mb-4">
            Detecting Farcaster context...
          </div>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
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

      <div className="relative z-10 container mx-auto px-4 py-4 max-w-md min-h-screen flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="InflyncedPuzzle Logo" 
              className="w-8 h-8 rounded-lg shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">InflyncedPuzzle</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 border border-white/30 hover:border-white/50 hover:scale-105"
              title="Toggle Leaderboard"
            >
              <Trophy size={20} />
            </button>
            <button
              onClick={() => setBackgroundMode(backgroundMode === 'solid' ? 'gradient' : 'solid')}
              className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 border border-white/30 hover:border-white/50 hover:scale-105"
              title={backgroundMode === 'solid' ? 'Switch to light gradient' : 'Switch to dark solid'}
            >
              <Palette size={20} />
            </button>
          </div>
        </div>

        {userProfile && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 shadow-lg">
              <span className="text-white/80 text-sm font-medium">Playing as:</span>
              <button
                onClick={changeUsername}
                onContextMenu={(e) => {
                  e.preventDefault();
                  clearUsername();
                }}
                className="text-white font-bold text-sm hover:text-orange-200 transition-colors underline decoration-2 underline-offset-2"
                title={isInFarcaster 
                  ? `Real Farcaster user: ${userProfile.username} (FID: ${userProfile.fid})` 
                  : "Click to change username • Right-click to clear stored username"
                }
              >
                @{userProfile.username}
              </button>
              {isInFarcaster && (
                <span className="text-xs bg-green-500/20 text-green-300 px-2.5 py-1 rounded-lg border border-green-500/30 font-medium" title="Connected to Farcaster">
                  FC
                </span>
              )}
              {isSubmittingScore && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg animate-pulse border border-blue-500/30">
                  Saving...
                </span>
              )}
            </div>
            <div className="text-xs text-white/50 mt-2 font-mono">
              FID: {userProfile.fid} | In FC: {isInFarcaster ? 'Yes' : 'No'}
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="mb-6">
            <div className="flex justify-between text-white text-sm mb-3">
              <span className="font-semibold">{progress.toFixed(1)}% Complete</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="text-xs bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-colors border border-white/30"
                >
                  {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
                <span className="font-mono font-bold">{formatTime(currentTime)}s</span>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 shadow-inner border border-white/30">
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-200 rounded-full h-3 transition-all duration-500 shadow-sm relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {showLeaderboard && (
          <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 shadow-lg">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Trophy size={20} />
              Live Leaderboard ({sharedLeaderboard.length} scores)
              <button
                onClick={loadSharedLeaderboard}
                disabled={isLoadingLeaderboard}
                className="ml-auto text-sm bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50 flex items-center gap-1.5 border border-white/30"
              >
                <RefreshCw size={14} className={isLoadingLeaderboard ? 'animate-spin' : ''} />
                Refresh
              </button>
            </h3>
            
            {leaderboardError && (
              <div className="mb-4 text-red-300 text-sm bg-red-500/20 p-3 rounded-lg border border-red-500/30">
                ⚠️ API Error: {leaderboardError}
                <br />Using cached data.
              </div>
            )}
            
            {isLoadingLeaderboard ? (
              <div className="text-center text-white/70 py-10">
                <div className="animate-spin text-3xl mb-3">🏆</div>
                <div className="font-semibold">Loading latest scores...</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sharedLeaderboard.length > 0 ? (
                  sharedLeaderboard.map((entry, index) => (
                    <div key={`${entry.fid}-${entry.timestamp || index}`} className="flex items-center justify-between text-white/90 text-sm bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors border border-white/10">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-6 text-center font-bold flex-shrink-0 text-base">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </span>
                        
                        {/* Profile Picture or Avatar */}
                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-white/20 flex items-center justify-center border border-white/30">
                          {entry.pfpUrl ? (
                            <img 
                              src={entry.pfpUrl} 
                              alt={`${entry.username}'s avatar`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span className={`text-xs ${entry.pfpUrl ? 'hidden' : 'block'}`}>
                            {entry.avatar || "🧩"}
                          </span>
                        </div>
                        
                        {/* Username */}
                        <button 
                          className="hover:text-white transition-colors hover:underline truncate min-w-0 text-left font-medium"
                          onClick={() => window.open(`https://warpcast.com/${entry.username}`, '_blank')}
                          title={`View @${entry.username}'s Farcaster profile${entry.displayName ? ` (${entry.displayName})` : ''}`}
                        >
                          @{entry.username}
                        </button>
                        
                        {/* Display name if different from username */}
                        {entry.displayName && entry.displayName !== entry.username && (
                          <span className="text-white/60 text-xs truncate">
                            ({entry.displayName})
                          </span>
                        )}
                      </div>
                      
                      {/* Time */}
                      <span className="font-mono font-bold flex-shrink-0 ml-3 text-orange-200">{entry.time}s</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/70 py-10">
                    <div className="text-5xl mb-3">🏆</div>
                    <div className="font-bold text-lg">No scores yet!</div>
                    <div className="text-sm mt-1">Play a game to set the first record!</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {gameState === 'menu' && (
          <div className="flex-1 flex flex-col justify-center text-center text-white">
            <div className="mb-12">
              <div className="text-7xl mb-6 animate-pulse">🧩</div>
              <h2 className="text-2xl font-bold mb-3">Image Sliding Puzzle</h2>
              <p className="text-white/80 mb-8 text-lg leading-relaxed">
                Solve an image puzzle as fast as you can!
              </p>
            </div>
            <button
              onClick={startGame}
              className="bg-white text-orange-600 px-10 py-5 rounded-xl font-bold text-xl hover:bg-white/90 transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Play size={28} />
              Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-4 text-center">
              <h3 className="text-white font-bold text-lg">Puzzle {currentPuzzle?.id}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-white/60 text-xs">Difficulty:</span>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(3, Math.ceil(currentPuzzle?.id / 5)) }).map((_, i) => (
                    <span key={i} className="text-orange-300 text-xs">⭐</span>
                  ))}
                </div>
              </div>
              <p className="text-white/60 text-xs mt-1">Use arrow keys or WASD to play</p>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="relative grid grid-cols-3 gap-2 bg-white/20 p-4 rounded-xl shadow-2xl backdrop-blur-sm border border-white/30" 
                   style={{ 
                     width: 'min(320px, calc(100vw - 2rem))', 
                     height: 'min(320px, calc(100vw - 2rem))' 
                   }}>
                {board.map((row, rowIndex) =>
                  row.map((tile, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                        tile 
                          ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-lg border-2 border-white/30 hover:border-white/60 hover:shadow-xl' 
                          : 'bg-black/40 border-2 border-dashed border-white/50 animate-pulse'
                      } ${isPaused ? 'pointer-events-none filter blur-sm' : ''}`}
                      style={tile ? {
                        ...getTileStyle(tile),
                        width: 'min(96px, calc((100vw - 6rem) / 3))',
                        height: 'min(96px, calc((100vw - 6rem) / 3))'
                      } : {
                        width: 'min(96px, calc((100vw - 6rem) / 3))',
                        height: 'min(96px, calc((100vw - 6rem) / 3))'
                      }}
                      onClick={() => makeMove(rowIndex, colIndex)}
                      onTouchStart={(e) => {
                        e.preventDefault(); // Prevent zoom on double tap
                      }}
                      onTouchEnd={() => makeMove(rowIndex, colIndex)}
                    >
                      {tile && !imageErrors.has(tile.image) && (
                        <div className="w-full h-full relative">
                          <span className="absolute top-1 left-1 text-white font-bold text-xs bg-black/80 px-1.5 py-0.5 rounded z-10 shadow-sm">
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
                
                {isPaused && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                    <div className="text-center text-white">
                      <div className="text-4xl mb-2">⏸️</div>
                      <div className="text-lg font-bold mb-2">Game Paused</div>
                      <button
                        onClick={() => setIsPaused(false)}
                        className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors border border-white/30"
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
          <div className="flex-1 flex flex-col justify-center text-center text-white">
            <div className="text-6xl mb-6 animate-bounce">🏆</div>
            <h2 className="text-3xl font-bold mb-3">Congratulations!</h2>
            <p className="text-lg mb-8 text-white/90">
              You solved the puzzle in <span className="font-bold text-orange-200">{formatTime(totalTime)}s</span>
            </p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={shareResult}
                className="bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/90 transition-all duration-200 flex items-center gap-3 justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Share2 size={24} />
                Share Result
              </button>
              
              <button
                onClick={() => setGameState('menu')}
                className="bg-white/20 text-white px-8 py-4 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-all duration-200 flex items-center gap-3 justify-center border border-white/30 hover:border-white/50"
              >
                <Play size={24} />
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

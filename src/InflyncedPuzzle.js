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
  const [particles, setParticles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [sdkInstance, setSdkInstance] = useState(null);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [sharedLeaderboard, setSharedLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  
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

  // Load shared leaderboard from API with localStorage fallback
  const loadSharedLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setSharedLeaderboard(data);
          console.log('✅ Loaded shared leaderboard from API:', data.length, 'scores');
          setIsLoadingLeaderboard(false);
          return;
        }
      }
    } catch (error) {
      console.log('❌ API failed, trying localStorage fallback:', error);
    }
    
    // Fallback to localStorage if API fails
    try {
      const stored = localStorage.getItem('inflynced-leaderboard');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out demo data
          const realScores = parsed.filter(entry => 
            entry.username !== 'puzzlemaster' && 
            entry.username !== 'speedsolver' && 
            entry.username !== 'braingamer' &&
            !entry.fid?.includes('demo') &&
            !entry.fid?.includes('sample')
          );
          
          // Remove duplicates
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
          console.log('📱 Loaded leaderboard from localStorage fallback:', finalScores.length, 'scores');
        }
      }
    } catch (e) {
      console.log('❌ localStorage fallback also failed');
      setSharedLeaderboard([]);
    }
    
    setIsLoadingLeaderboard(false);
  }, []);

  // Submit score to shared API with localStorage fallback
  const submitScore = useCallback(async (time, username, fid) => {
    console.log('📊 Submitting score to shared leaderboard:', { time: (time/1000).toFixed(1), username, fid });
    
    if (!username || !fid) return;

    const newEntry = {
      username: username,
      fid: fid,
      time: parseFloat((time / 1000).toFixed(1)),
      timestamp: Date.now(),
      avatar: "🧩"
    };

    let apiSuccess = false;
    
    // Try API first
    try {
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      });

      if (response.ok) {
        console.log('✅ Score submitted to shared API');
        apiSuccess = true;
        // Reload leaderboard to show updated scores
        setTimeout(() => loadSharedLeaderboard(), 500);
      }
    } catch (error) {
      console.log('❌ API submission failed:', error);
    }
    
    // If API fails, update localStorage as fallback
    if (!apiSuccess) {
      try {
        const stored = localStorage.getItem('inflynced-leaderboard');
        let currentScores = [];
        if (stored) {
          currentScores = JSON.parse(stored);
        }
        
        // Remove demo data and existing user scores
        currentScores = currentScores.filter(entry => 
          entry.username !== 'puzzlemaster' && 
          entry.username !== 'speedsolver' && 
          entry.username !== 'braingamer' &&
          !entry.fid?.includes('demo') &&
          !entry.fid?.includes('sample') &&
          entry.fid !== fid
        );
        
        // Add new score
        currentScores.push(newEntry);
        
        // Sort and save
        const updatedScores = currentScores
          .sort((a, b) => a.time - b.time)
          .slice(0, 10);
        
        localStorage.setItem('inflynced-leaderboard', JSON.stringify(updatedScores));
        console.log('📱 Score saved to localStorage fallback');
        
        // Update display
        setSharedLeaderboard(updatedScores);
      } catch (error) {
        console.log('❌ localStorage fallback also failed:', error);
      }
    }
  }, [loadSharedLeaderboard]);

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
          key={particle.i

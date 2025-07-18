/**
 * InflyncedPuzzle - A sliding puzzle game with onchain leaderboard
 * Features: Web3/Base contract integration, proper sharing, user management
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Share2, Trophy, Palette, RefreshCw, Wallet } from 'lucide-react';
import { ethers } from 'ethers';

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

// Contract configuration for Base
const CONTRACT_CONFIG = {
  address: process.env.REACT_APP_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',
  abi: [
    {
      "inputs": [
        {"internalType": "uint256", "name": "_fid", "type": "uint256"},
        {"internalType": "string", "name": "_username", "type": "string"},
        {"internalType": "uint256", "name": "_time", "type": "uint256"},
        {"internalType": "uint256", "name": "_puzzleId", "type": "uint256"}
      ],
      "name": "submitScore",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "_limit", "type": "uint256"}],
      "name": "getTopScores",
      "outputs": [
        {
          "components": [
            {"internalType": "address", "name": "player", "type": "address"},
            {"internalType": "uint256", "name": "fid", "type": "uint256"},
            {"internalType": "string", "name": "username", "type": "string"},
            {"internalType": "uint256", "name": "time", "type": "uint256"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "uint256", "name": "puzzleId", "type": "uint256"}
          ],
          "internalType": "struct InflyncedPuzzleLeaderboard.Score[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalScores",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

const InflyncedPuzzle = () => {
  // Game state
  const [gameState, setGameState] = useState('loading');
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [board, setBoard] = useState([]);
  const [emptyPos, setEmptyPos] = useState({ row: 2, col: 2 });
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [backgroundMode, setBackgroundMode] = useState('solid');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [currentUser, setCurrentUser] = useState({ username: '@anonymous', fid: null, displayName: 'Anonymous', pfpUrl: null });
  const [isMiniapp, setIsMiniapp] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [snowParticles, setSnowParticles] = useState([]);
  const [showSnow, setShowSnow] = useState(false);
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  
  const audioContextRef = useRef(null);
  const timerRef = useRef(null);
  const snowIntervalRef = useRef(null);

  // Initialize Farcaster SDK and user context
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // Check if we're in a Farcaster miniapp environment
        const isFarcasterMiniapp = window.location.hostname.includes('farcaster') || 
                                   window.parent !== window || 
                                   window.location.search.includes('farcaster');
        
        setIsMiniapp(isFarcasterMiniapp);

        if (isFarcasterMiniapp) {
          try {
            // Import Farcaster SDK
            const { sdk } = await import('@farcaster/miniapp-sdk');
            
            // Get user context from Farcaster
            const context = await sdk.context;
            
            if (context?.user) {
              setCurrentUser({
                fid: context.user.fid,
                username: context.user.username || `@user${context.user.fid}`,
                displayName: context.user.displayName || context.user.username || 'Farcaster User',
                pfpUrl: context.user.pfpUrl
              });
            }
            
            // Call ready() to hide loading screen
            await sdk.actions.ready();
            setIsReady(true);
            console.log('Farcaster SDK initialized successfully');
            
          } catch (sdkError) {
            console.warn('Farcaster SDK not available, using fallback:', sdkError);
            // Fallback for development/testing
            setCurrentUser({
              fid: Math.floor(Math.random() * 100000) + 1000,
              username: '@testuser',
              displayName: 'Test User',
              pfpUrl: null
            });
            setIsReady(true);
          }
                 } else {
           // Not in miniapp, use local storage or prompt
           getUserProfile();
           setIsReady(true);
         }
       } catch (error) {
         console.error('Failed to initialize Farcaster context:', error);
         getUserProfile();
         setIsReady(true);
       }
    };

    initializeFarcaster();
  }, []);

  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  // Snow animation effect
  useEffect(() => {
    if (showSnow) {
      const createSnowflake = () => {
        return {
          id: Math.random(),
          x: Math.random() * window.innerWidth,
          y: -10,
          size: Math.random() * 3 + 2,
          speed: Math.random() * 2 + 1,
          opacity: Math.random() * 0.6 + 0.4,
          drift: Math.random() * 2 - 1
        };
      };

      const updateSnowflakes = () => {
        setSnowParticles(prev => {
          const updated = prev.map(flake => ({
            ...flake,
            y: flake.y + flake.speed,
            x: flake.x + flake.drift * 0.5
          })).filter(flake => flake.y < window.innerHeight + 20);

          // Add new snowflakes
          while (updated.length < 50) {
            updated.push(createSnowflake());
          }

          return updated;
        });
      };

      snowIntervalRef.current = setInterval(updateSnowflakes, 50);
      
      return () => {
        if (snowIntervalRef.current) {
          clearInterval(snowIntervalRef.current);
        }
      };
    } else {
      setSnowParticles([]);
      if (snowIntervalRef.current) {
        clearInterval(snowIntervalRef.current);
      }
    }
  }, [showSnow]);

  // Create new user
  const createNewUser = useCallback(() => {
    const username = window.prompt('Enter your username:') || 'anonymous';
    const newUser = { 
      fid: Math.floor(Math.random() * 1000000),
      username, 
      displayName: username,
      pfpUrl: null
    };
    localStorage.setItem('inflynced-user-profile', JSON.stringify(newUser));
    setCurrentUser(newUser);
    console.log('👤 Created new user:', newUser);
  }, []);

  // Create fallback user for environments
  const createFallbackUser = useCallback(() => {
    const stored = localStorage.getItem('inflynced-user-profile');
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        setCurrentUser(profile);
        console.log('📱 Using stored profile:', profile);
      } catch (e) {
        createNewUser();
      }
    } else {
      createNewUser();
    }
  }, [createNewUser]);

  // Initialize user system
  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('🔄 Initializing user system...');
        
        // Check if we're in Farcaster (simple detection)
        const urlParams = new URLSearchParams(window.location.search);
        const farcasterUsername = urlParams.get('username');
        const farcasterFid = urlParams.get('fid');
        
        if (farcasterUsername && farcasterFid) {
          // Use Farcaster URL parameters if available
          const farcasterUser = {
            fid: parseInt(farcasterFid),
            username: farcasterUsername,
            displayName: farcasterUsername,
            pfpUrl: null,
            isFromFarcaster: true
          };
          
          console.log('✅ Farcaster user detected from URL:', farcasterUser);
          setCurrentUser(farcasterUser);
        } else {
          // Use fallback system
          console.log('📱 Using fallback user system');
          createFallbackUser();
        }
        
        setGameState('menu');
        
      } catch (error) {
        console.log('❌ User initialization failed:', error);
        createFallbackUser();
        setGameState('menu');
      }
    };

    // Small delay to show loading screen
    setTimeout(initializeUser, 1000);
  }, [createFallbackUser]);

  // Initialize Web3 and connect to Base contract
  useEffect(() => {
    const initializeWeb3 = async () => {
      try {
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await provider.getNetwork();
          
          console.log('🌐 Connected to network:', network.name, network.chainId);
          
          // Check if we're on Base or Base Sepolia
          if (network.chainId === 8453 || network.chainId === 84532) {
            console.log('✅ Connected to Base network');
            
            // Request account access
            try {
              const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
              if (accounts.length > 0) {
                setWalletAddress(accounts[0]);
                setWalletConnected(true);
                
                // Initialize contract
                const signer = provider.getSigner();
                const contractInstance = new ethers.Contract(
                  CONTRACT_CONFIG.address,
                  CONTRACT_CONFIG.abi,
                  signer
                );
                setContract(contractInstance);
                
                console.log('✅ Contract initialized:', CONTRACT_CONFIG.address);
              }
            } catch (walletError) {
              console.log('❌ Wallet connection failed:', walletError);
            }
          } else {
            console.log('⚠️ Please switch to Base network');
          }
        } else {
          console.log('❌ No Web3 wallet detected');
        }
      } catch (error) {
        console.log('❌ Web3 initialization failed:', error);
      }
    };

    initializeWeb3();
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask or another Web3 wallet');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(
          CONTRACT_CONFIG.address,
          CONTRACT_CONFIG.abi,
          signer
        );
        setContract(contractInstance);
        
        console.log('✅ Wallet connected:', accounts[0]);
      }
    } catch (error) {
      console.log('❌ Wallet connection failed:', error);
    }
  };

  // Load leaderboard from contract
  const loadLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    
    try {
      if (contract) {
        console.log('📊 Loading leaderboard from contract...');
        const topScores = await contract.getTopScores(10);
        
        const formattedScores = topScores.map(score => ({
          player: score.player,
          fid: score.fid.toString(),
          username: score.username,
          time: (Number(score.time) / 1000).toFixed(1),
          timestamp: Number(score.timestamp),
          puzzleId: Number(score.puzzleId)
        }));
        
        setLeaderboard(formattedScores);
        console.log('✅ Leaderboard loaded:', formattedScores.length, 'scores');
      } else {
        console.log('❌ Contract not initialized');
        const stored = localStorage.getItem('inflynced-leaderboard');
        if (stored) {
          const parsed = JSON.parse(stored);
          setLeaderboard(parsed.slice(0, 10));
        }
      }
    } catch (error) {
      console.log('❌ Failed to load leaderboard:', error);
      const stored = localStorage.getItem('inflynced-leaderboard');
      if (stored) {
        const parsed = JSON.parse(stored);
        setLeaderboard(parsed.slice(0, 10));
      }
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [contract]);

  // Submit score to contract
  const submitScoreToContract = useCallback(async (time, username, fid, puzzleId) => {
    if (!contract || !walletConnected) {
      console.log('❌ Wallet not connected or contract not initialized');
      return false;
    }

    try {
      setIsSubmittingScore(true);
      console.log('📝 Submitting score to contract...', { time, username, fid, puzzleId });
      
      const timeInMs = Math.round(time);
      const tx = await contract.submitScore(
        fid,
        username,
        timeInMs,
        puzzleId,
        {
          gasLimit: 300000
        }
      );
      
      console.log('⏳ Waiting for transaction confirmation...');
      await tx.wait();
      
      console.log('✅ Score submitted to contract successfully!');
      
      setTimeout(() => loadLeaderboard(), 1000);
      
      return true;
    } catch (error) {
      console.log('❌ Failed to submit score to contract:', error);
      
      // Fallback to local storage
      const stored = localStorage.getItem('inflynced-leaderboard');
      const scores = stored ? JSON.parse(stored) : [];
      scores.push({
        player: walletAddress,
        fid: fid.toString(),
        username,
        time: (time / 1000).toFixed(1),
        timestamp: Date.now(),
        puzzleId
      });
      scores.sort((a, b) => parseFloat(a.time) - parseFloat(b.time));
      localStorage.setItem('inflynced-leaderboard', JSON.stringify(scores.slice(0, 50)));
      loadLeaderboard();
      
      return false;
    } finally {
      setIsSubmittingScore(false);
    }
  }, [contract, walletConnected, walletAddress, loadLeaderboard]);

  // Load leaderboard on component mount
  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Audio function
  const playSound = useCallback((frequency, duration = 0.1) => {
    if (!audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (e) {
      console.log('Sound error:', e);
    }
  }, []);

  // Game logic functions
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
      
      playSound(440 + (newProgress * 2), 0.1);
      
      if (checkWin(newBoard)) {
        playSound(660, 0.3);
        
        const finalTime = Date.now() - startTime;
        setTotalTime(finalTime);
        setGameState('completed');
        
        if (currentUser && currentUser.username && currentUser.fid) {
          console.log('🎯 Game won! Submitting score for user:', currentUser);
          submitScoreToContract(finalTime, currentUser.username, currentUser.fid, currentPuzzle.id);
        }
        
        setTimeout(() => playSound(523, 0.2), 0);
        setTimeout(() => playSound(659, 0.2), 200);
        setTimeout(() => playSound(784, 0.4), 400);
      }
    }
  }, [gameState, emptyPos, board, playSound, checkWin, calculateProgress, startTime, currentUser, currentPuzzle, submitScoreToContract]);

  // Generate and shuffle board
  const generateBoard = useCallback((puzzleConfig) => {
    const board = [];
    let tileIndex = 0;
    
    for (let i = 0; i < 3; i++) {
      board[i] = [];
      for (let j = 0; j < 3; j++) {
        if (i === 2 && j === 2) {
          board[i][j] = null;
        } else {
          board[i][j] = {
            value: tileIndex + 1,
            image: puzzleConfig.image,
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
    
    const moves = 500 + Math.floor(Math.random() * 500);
    
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

  // Fixed share function with correct URL
  const shareResult = useCallback(async () => {
    const timeInSeconds = (totalTime / 1000).toFixed(1);
    const text = `🧩 I just solved the InflyncedPuzzle in ${timeInSeconds} seconds!\n\nCan you beat my time? Try it now! 👇`;
    
    const CORRECT_URL = "https://inflyncedpuzzle.vercel.app";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'InflyncedPuzzle - I solved it!',
          text: text,
          url: CORRECT_URL,
        });
      } catch (error) {
        console.log('Web Share cancelled or failed:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n\n${CORRECT_URL}`);
        window.alert('Result copied to clipboard!');
      } catch (error) {
        const textArea = document.createElement('textarea');
        textArea.value = `${text}\n\n${CORRECT_URL}`;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        window.alert('Result copied to clipboard!');
      }
    }
  }, [totalTime]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && startTime) {
      timerRef.current = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, startTime]);

  // Keyboard controls
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
        makeMove(targetRow, targetCol);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, emptyPos, makeMove]);

  const formatTime = (time) => {
    return (time / 1000).toFixed(1);
  };

  const getTileStyle = (tile) => {
    if (!tile) return {};
    
    const tileSize = 74;
    const backgroundX = -(tile.correctPos.col * tileSize);
    const backgroundY = -(tile.correctPos.row * tileSize);
    
    return {
      backgroundImage: `url(${tile.image})`,
      backgroundSize: '222px 222px',
      backgroundPosition: `${backgroundX}px ${backgroundY}px`,
      backgroundRepeat: 'no-repeat'
    };
  };

  const handleImageError = (imagePath) => {
    setImageErrors(prev => new Set([...prev, imagePath]));
  };

  const changeUsername = () => {
    if (currentUser?.isFromFarcaster) {
      alert('Username is managed by Farcaster and cannot be changed.');
      return;
    }
    
    const newUsername = window.prompt('Enter your new username:', currentUser?.username || '');
    if (newUsername && newUsername.trim()) {
      const updatedUser = { ...currentUser, username: newUsername.trim() };
      setCurrentUser(updatedUser);
      localStorage.setItem('inflynced-user-profile', JSON.stringify(updatedUser));
    }
  };

  // Loading screen
  if (gameState === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff7043 0%, #ff5722 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'pulse 2s infinite' }}>🧩</div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px' }}>Loading InflyncedPuzzle...</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
            Initializing game and checking for user context...
          </p>
        </div>
      </div>
    );
  }

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
              {!walletConnected && (
                <button
                  onClick={connectWallet}
                  style={{
                    padding: '6px',
                    backgroundColor: '#ff5722',
                    borderRadius: '6px',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="Connect Wallet for Onchain Leaderboard"
                >
                  <Wallet size={16} />
                </button>
              )}
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

          {currentUser && (
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
                  @{currentUser.username}
                </button>
                {currentUser.isFromFarcaster && (
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
                FID: {currentUser.fid} | Type: {currentUser.isFromFarcaster ? 'Farcaster' : 'Local'}
                {walletConnected && <span> | Wallet: ✅</span>}
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
                  🏆 {walletConnected ? 'Onchain' : 'Local'} Leaderboard ({leaderboard.length})
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
                  <RefreshCw size={10} className={isLoadingLeaderboard ? 'animate-spin' : ''} />
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
                        {walletConnected && (
                          <span style={{ fontSize: '8px', color: '#4caf50' }}>⛓️</span>
                        )}
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
                {!walletConnected && (
                  <p style={{ color: '#ff5722', fontSize: '12px', marginTop: '8px' }}>
                    Connect your wallet for onchain leaderboard!
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
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
                    boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)'
                  }}
                >
                  <Play size={20} />
                  Start Game
                </button>
                
                <button
                  onClick={() => setShowSnow(!showSnow)}
                  style={{
                    backgroundColor: showSnow ? '#2196F3' : '#ff5722',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(255, 87, 34, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {showSnow ? '❄️ Stop Snow' : '❄️ Make it Snow'}
                </button>
              </div>
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
              
              {isSubmittingScore && (
                <p style={{ fontSize: '12px', color: '#ff5722', marginBottom: '16px' }}>
                  📝 Submitting score to blockchain...
                </p>
              )}
              
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
      
      {/* Snow Animation Overlay */}
      {showSnow && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          {snowParticles.map(flake => (
            <div
              key={flake.id}
              style={{
                position: 'absolute',
                left: `${flake.x}px`,
                top: `${flake.y}px`,
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                backgroundColor: 'white',
                borderRadius: '50%',
                opacity: flake.opacity,
                boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
                animation: 'twinkle 2s infinite alternate'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InflyncedPuzzle;
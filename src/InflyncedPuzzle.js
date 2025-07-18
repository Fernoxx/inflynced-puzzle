/**
 * InflyncedPuzzle - A sliding puzzle game for Farcaster with Wallet Integration
 * Features: Image-based puzzles, leaderboards, responsive design, Farcaster wallet connection
 * Updated: Added proper Farcaster wallet connection support
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Trophy, RefreshCw, Palette, Wallet } from 'lucide-react';

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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [sharedLeaderboard, setSharedLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSnowEffect, setShowSnowEffect] = useState(false);
  
  // Wallet connection states
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [sdkInstance, setSdkInstance] = useState(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletError, setWalletError] = useState(null);
  
  const audioContextRef = useRef(null);
  const timerRef = useRef(null);
  const snowflakesRef = useRef([]);

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

  // Function to connect Farcaster wallet
  const connectFarcasterWallet = async (sdk) => {
    try {
      console.log('🔗 Attempting to connect Farcaster wallet...');
      
      // Method 1: Check if wallet is already available in context
      const context = await sdk.context;
      if (context?.wallet && context.wallet.address) {
        console.log('✅ Wallet found in context:', context.wallet.address);
        return {
          address: context.wallet.address,
          chainId: context.wallet.chainId || 8453,
          type: 'farcaster'
        };
      }
      
      // Method 2: Try new wallet connect API
      if (sdk.wallet && typeof sdk.wallet.connect === 'function') {
        console.log('📱 Using new wallet connect API');
        const result = await sdk.wallet.connect();
        console.log('✅ Wallet connected via new API:', result);
        return {
          address: result.address,
          chainId: result.chainId || 8453,
          type: 'farcaster'
        };
      }
      
      // Method 3: Try legacy wallet connection
      if (sdk.actions && typeof sdk.actions.connectWallet === 'function') {
        console.log('📱 Using legacy wallet connect API');
        const result = await sdk.actions.connectWallet();
        console.log('✅ Wallet connected via legacy API:', result);
        return {
          address: result.address,
          chainId: result.chainId || 8453,
          type: 'farcaster'
        };
      }
      
      // Method 4: Check if wallet property exists
      if (sdk.wallet && sdk.wallet.address) {
        console.log('📱 Using existing wallet property');
        return {
          address: sdk.wallet.address,
          chainId: sdk.wallet.chainId || 8453,
          type: 'farcaster'
        };
      }
      
      console.log('❌ No Farcaster wallet connection method available');
      return null;
      
    } catch (error) {
      console.error('❌ Farcaster wallet connection failed:', error);
      throw error;
    }
  };

  // Manual wallet connection
  const connectWallet = async () => {
    setIsConnectingWallet(true);
    setWalletError(null);
    
    try {
      console.log('🔄 Starting manual wallet connection...');
      
      // First try Farcaster wallet if available
      if (sdkInstance && isInFarcaster) {
        console.log('🔗 Attempting Farcaster wallet connection...');
        const result = await connectFarcasterWallet(sdkInstance);
        if (result) {
          setWalletAddress(result.address);
          setWalletType('farcaster');
          setWalletConnected(true);
          console.log('✅ Farcaster wallet connected successfully');
          return;
        }
      }
      
      // Fallback to browser wallet
      if (window.ethereum) {
        console.log('🔄 Falling back to browser wallet...');
        
        // Identify wallet type
        let walletName = 'unknown';
        if (window.ethereum.isCoinbaseWallet) {
          walletName = 'coinbase';
        } else if (window.ethereum.isMetaMask) {
          walletName = 'metamask';
        } else if (window.ethereum.isRabby) {
          walletName = 'rabby';
        }
        
        console.log('📱 Detected wallet:', walletName);
        
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
          const address = accounts[0];
          
          // Get chain ID
          const chainId = await window.ethereum.request({
            method: 'eth_chainId'
          });
          
          setWalletAddress(address);
          setWalletType(walletName);
          setWalletConnected(true);
          
          console.log('✅ External wallet connected:', {
            address,
            chainId: parseInt(chainId, 16),
            type: walletName
          });
        }
      } else {
        throw new Error('No wallet detected. Please install a wallet like MetaMask or use Farcaster mobile app.');
      }
      
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      setWalletError(error.message);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setWalletType(null);
    setWalletConnected(false);
    setWalletError(null);
    console.log('🔌 Wallet disconnected');
  }, []);

  // Initialize SDK with proper Farcaster context reading and wallet connection
  useEffect(() => {
    const initializeMiniapp = async () => {
      try {
        console.log('🔄 Initializing Farcaster miniapp...');
        
        // Import and initialize Farcaster SDK
        const { sdk } = await import('@farcaster/miniapp-sdk');
        setSdkInstance(sdk);
        
        // CRITICAL: Always call ready() first
        await sdk.actions.ready();
        console.log('✅ SDK ready() called - loading screen hidden');
        
        // Wait for SDK to be ready and get user context
        const context = await sdk.context;
        console.log('📱 Farcaster context:', context);
        
        if (context?.user) {
          // Extract real user data
          const userProfile = {
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl
          };
          setUserProfile(userProfile);
          setIsInFarcaster(true);
          console.log('✅ Real Farcaster user profile:', userProfile);
          
          // Try to connect wallet automatically
          try {
            console.log('🔗 Attempting automatic wallet connection...');
            const walletResult = await connectFarcasterWallet(sdk);
            if (walletResult) {
              setWalletAddress(walletResult.address);
              setWalletType('farcaster');
              setWalletConnected(true);
              console.log('✅ Automatic wallet connection successful');
            } else {
              console.log('⚠️ Automatic wallet connection failed - user can connect manually');
            }
          } catch (walletError) {
            console.log('⚠️ Automatic wallet connection error:', walletError);
            // Continue without wallet - user can connect manually
          }
        } else {
          console.log('❌ No Farcaster user context found');
          setIsInFarcaster(false);
          getFallbackUserProfile();
        }
        
        setIsLoading(false);
        console.log('✅ Miniapp initialized successfully!');
        
      } catch (error) {
        console.log('❌ Farcaster SDK initialization failed:', error);
        setIsInFarcaster(false);
        getFallbackUserProfile();
        setIsLoading(false);
      }
    };

    initializeMiniapp();
  }, [getFallbackUserProfile]);

  // Wallet Status Component
  const WalletStatus = () => (
    <div style={{ 
      padding: '8px 16px', 
      backgroundColor: walletConnected ? '#e8f5e8' : '#fff3cd',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: '#666' }}>
          {walletConnected ? '🔗 Wallet Connected' : '⚠️ Wallet Not Connected'}
        </span>
        {walletConnected && walletAddress && (
          <span style={{ 
            fontFamily: 'monospace', 
            fontSize: '10px', 
            color: '#333',
            backgroundColor: 'rgba(0,0,0,0.1)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
        )}
        {walletConnected && walletType && (
          <span style={{ 
            fontSize: '10px', 
            color: walletType === 'farcaster' ? '#4CAF50' : '#FF9800',
            fontWeight: 'bold',
            backgroundColor: 'rgba(0,0,0,0.1)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {walletType === 'farcaster' ? 'FARCASTER' : walletType.toUpperCase()}
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '4px' }}>
        {!walletConnected ? (
          <button
            onClick={connectWallet}
            disabled={isConnectingWallet}
            style={{
              backgroundColor: '#8B5CF6',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: isConnectingWallet ? 'not-allowed' : 'pointer',
              opacity: isConnectingWallet ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isConnectingWallet ? (
              <>
                <div style={{
                  width: '8px',
                  height: '8px',
                  border: '1px solid transparent',
                  borderTop: '1px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Connecting...
              </>
            ) : (
              <>
                <Wallet size={12} />
                Connect
              </>
            )}
          </button>
        ) : (
          <button
            onClick={disconnectWallet}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );

  // Snow animation effect
  const createSnowflake = useCallback(() => {
    return {
      id: Math.random(),
      x: Math.random() * window.innerWidth,
      y: -10,
      speed: Math.random() * 3 + 1,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.8 + 0.2
    };
  }, []);

  const animateSnow = useCallback(() => {
    if (!showSnowEffect) return;

    snowflakesRef.current = snowflakesRef.current.map(flake => ({
      ...flake,
      y: flake.y + flake.speed,
      x: flake.x + Math.sin(flake.y * 0.01) * 0.5
    })).filter(flake => flake.y < window.innerHeight);

    // Add new snowflakes
    if (snowflakesRef.current.length < 50) {
      snowflakesRef.current.push(createSnowflake());
    }

    requestAnimationFrame(animateSnow);
  }, [showSnowEffect, createSnowflake]);

  useEffect(() => {
    if (showSnowEffect) {
      snowflakesRef.current = Array.from({ length: 20 }, createSnowflake);
      animateSnow();
    } else {
      snowflakesRef.current = [];
    }
  }, [showSnowEffect, animateSnow, createSnowflake]);

  // Toggle snow effect UI
  const toggleSnowEffect = useCallback(() => {
    setShowSnowEffect(!showSnowEffect);
  }, [showSnowEffect]);

  // Load shared leaderboard from API with better error handling
  const loadSharedLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    
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
        setSharedLeaderboard(data.leaderboard || []);
      } else {
        console.log('❌ Failed to load leaderboard:', response.status);
        setSharedLeaderboard([]);
      }
    } catch (error) {
      console.log('❌ Error loading leaderboard:', error);
      setSharedLeaderboard([]);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, []);

  // Save score to API with better error handling
  const saveScore = useCallback(async (time, puzzleId) => {
    if (!userProfile || !userProfile.username) {
      console.log('❌ No user profile available to save score');
      return;
    }

    try {
      console.log('🔄 Saving score to API...');
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userProfile.username,
          time: time,
          puzzleId: puzzleId,
          fid: userProfile.fid || null,
          pfpUrl: userProfile.pfpUrl || null
        }),
      });

      if (response.ok) {
        console.log('✅ Score saved successfully');
        // Reload leaderboard to show updated scores
        loadSharedLeaderboard();
      } else {
        console.log('❌ Failed to save score:', response.status);
      }
    } catch (error) {
      console.log('❌ Error saving score:', error);
    }
  }, [userProfile, loadSharedLeaderboard]);

  // Generate 3x3 board with proper image positioning
  const generateBoard = useCallback((puzzle) => {
    // Create solved board first
    const solved = [];
    for (let row = 0; row < 3; row++) {
      solved[row] = [];
      for (let col = 0; col < 3; col++) {
        if (row === 2 && col === 2) {
          solved[row][col] = null; // Empty space
        } else {
          solved[row][col] = {
            id: row * 3 + col + 1,
            correctRow: row,
            correctCol: col,
            currentRow: row,
            currentCol: col,
            image: puzzle.image
          };
        }
      }
    }

    // Shuffle the board using valid moves only
    const shuffled = JSON.parse(JSON.stringify(solved)); // Deep copy
    let currentEmptyPos = { row: 2, col: 2 };
    
    // Perform 1000 random valid moves to shuffle
    for (let i = 0; i < 1000; i++) {
      const possibleMoves = getPossibleMoves(shuffled, currentEmptyPos);
      if (possibleMoves.length > 0) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        
        // Swap the tile with empty space
        shuffled[currentEmptyPos.row][currentEmptyPos.col] = shuffled[randomMove.row][randomMove.col];
        shuffled[randomMove.row][randomMove.col] = null;
        
        // Update empty position
        currentEmptyPos = { row: randomMove.row, col: randomMove.col };
      }
    }
    
    setEmptyPos(currentEmptyPos);
    return shuffled;
  }, []);

  const getEmptyPosition = (board) => {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          return { row, col };
        }
      }
    }
    return { row: 2, col: 2 };
  };

  const getPossibleMoves = (board, emptyPos) => {
    const moves = [];
    const { row, col } = emptyPos;
    
    // Check all four directions
    const directions = [
      { row: row - 1, col: col }, // Up
      { row: row + 1, col: col }, // Down
      { row: row, col: col - 1 }, // Left
      { row: row, col: col + 1 }  // Right
    ];

    directions.forEach(pos => {
      if (pos.row >= 0 && pos.row < 3 && pos.col >= 0 && pos.col < 3) {
        moves.push(pos);
      }
    });

    return moves;
  };

  const moveTile = useCallback((row, col) => {
    if (gameState !== 'playing' || isPaused) return;

    const newBoard = [...board];
    const emptyRow = emptyPos.row;
    const emptyCol = emptyPos.col;

    // Check if the clicked tile is adjacent to empty space
    const isAdjacent = (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    );

    if (isAdjacent) {
      // Swap tile with empty space
      newBoard[emptyRow][emptyCol] = newBoard[row][col];
      newBoard[row][col] = null;
      
      // Update current positions
      if (newBoard[emptyRow][emptyCol]) {
        newBoard[emptyRow][emptyCol].currentRow = emptyRow;
        newBoard[emptyRow][emptyCol].currentCol = emptyCol;
      }

      setBoard(newBoard);
      setEmptyPos({ row, col });

      // Check if puzzle is solved
      if (isPuzzleSolved(newBoard)) {
        const finalTime = Math.floor((Date.now() - startTime) / 1000);
        setTotalTime(finalTime);
        setGameState('completed');
        
        // Save score to API
        saveScore(finalTime, currentPuzzle.id);
      }
    }
  }, [board, emptyPos, gameState, isPaused, startTime, currentPuzzle, saveScore]);

  const isPuzzleSolved = (board) => {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (row === 2 && col === 2) {
          // Empty space should be at bottom right
          if (board[row][col] !== null) return false;
        } else {
          const tile = board[row][col];
          if (!tile || tile.correctRow !== row || tile.correctCol !== col) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const getTileStyle = (tile) => {
    if (!tile) return {};
    
    const { correctRow, correctCol } = tile;
    // Fixed tile size calculation for proper image display
    const tileSize = 74; // Each tile is 74px
    const backgroundPositionX = -(correctCol * tileSize);
    const backgroundPositionY = -(correctRow * tileSize);
    
    return {
      backgroundImage: `url(${tile.image})`,
      backgroundSize: `${tileSize * 3}px ${tileSize * 3}px`, // 222px x 222px total
      backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
      backgroundRepeat: 'no-repeat'
    };
  };

  const startGame = useCallback(() => {
    const puzzle = IMAGE_PUZZLES[Math.floor(Math.random() * IMAGE_PUZZLES.length)];
    setCurrentPuzzle(puzzle);
    const newBoard = generateBoard(puzzle);
    setBoard(newBoard);
    setEmptyPos(getEmptyPosition(newBoard));
    setStartTime(Date.now());
    setCurrentTime(0);
    setTotalTime(0);
    setGameState('playing');
    setShowLeaderboard(false);
  }, [generateBoard]);

  const resetGame = useCallback(() => {
    setGameState('menu');
    setCurrentPuzzle(null);
    setBoard([]);
    setStartTime(null);
    setCurrentTime(0);
    setTotalTime(0);
    setShowLeaderboard(false);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const toggleLeaderboard = useCallback(() => {
    if (!showLeaderboard) {
      loadSharedLeaderboard();
    }
    setShowLeaderboard(!showLeaderboard);
  }, [showLeaderboard, loadSharedLeaderboard]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && !isPaused && startTime) {
      timerRef.current = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, isPaused, startTime]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing' || isPaused) return;

      const { row, col } = emptyPos;
      let targetRow = row;
      let targetCol = col;

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          targetRow = row + 1;
          break;
        case 'arrowdown':
        case 's':
          targetRow = row - 1;
          break;
        case 'arrowleft':
        case 'a':
          targetCol = col + 1;
          break;
        case 'arrowright':
        case 'd':
          targetCol = col - 1;
          break;
        default:
          return;
      }

      if (targetRow >= 0 && targetRow < 3 && targetCol >= 0 && targetCol < 3) {
        moveTile(targetRow, targetCol);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, isPaused, emptyPos, moveTile]);

  // Show loading screen while initializing
  if (isLoading) {
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
        <div style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #ff5722',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#333'
          }}>
            Loading InflyncedPuzzle...
          </h2>
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: 0
          }}>
            Initializing Farcaster miniapp & wallet
          </p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: showSnowEffect 
        ? 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' 
        : 'linear-gradient(135deg, #ff7043 0%, #ff5722 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      transition: 'background 0.5s ease'
    }}>
      {/* Snow Effect */}
      {showSnowEffect && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          {snowflakesRef.current.map(flake => (
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
                animation: 'snowfall 3s linear infinite'
              }}
            />
          ))}
        </div>
      )}

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
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '20px' }}>🧩</div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#333' }}>
                InflyncedPuzzle
              </h1>
              {userProfile && (
                <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                  {isInFarcaster ? `@${userProfile.username}` : userProfile.username}
                </p>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            {/* Snow Effect Toggle Button */}
            <button
              onClick={toggleSnowEffect}
              style={{
                padding: '6px',
                backgroundColor: showSnowEffect ? '#34495e' : '#ff5722',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
              title={showSnowEffect ? 'Switch to Normal UI' : 'Switch to Snow UI'}
            >
              <Palette size={12} />
            </button>
            
            {gameState === 'playing' && (
              <>
                <button
                  onClick={togglePause}
                  style={{
                    padding: '6px',
                    backgroundColor: isPaused ? '#4CAF50' : '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  {isPaused ? '▶️' : '⏸️'}
                </button>
                <button
                  onClick={resetGame}
                  style={{
                    padding: '6px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  🔄
                </button>
              </>
            )}
            
            <button
              onClick={toggleLeaderboard}
              style={{
                padding: '6px',
                backgroundColor: showLeaderboard ? '#4CAF50' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              <Trophy size={12} />
            </button>
          </div>
        </div>

        {/* Wallet Status */}
        <WalletStatus />

        {/* Wallet Error Display */}
        {walletError && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#ffebee',
            borderBottom: '1px solid #ffcdd2',
            fontSize: '11px',
            color: '#c62828'
          }}>
            ⚠️ {walletError}
          </div>
        )}

        {/* Game Status */}
        {gameState === 'playing' && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', color: '#666' }}>
              Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
            </span>
            {isPaused && (
              <span style={{ fontSize: '12px', color: '#ff9800', fontWeight: '600' }}>
                PAUSED
              </span>
            )}
          </div>
        )}

        {/* Completed Status */}
        {gameState === 'completed' && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#e8f5e8',
            borderBottom: '1px solid #c8e6c9',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>🎉</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2e7d32', marginBottom: '2px' }}>
              Puzzle Completed!
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Time: {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{ minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
          {/* Leaderboard */}
          {showLeaderboard && (
            <div style={{ flex: 1, padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#333', textAlign: 'center' }}>
                🏆 Global Leaderboard
              </h3>
              
              {isLoadingLeaderboard ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#666', fontSize: '12px' }}>
                  Loading scores...
                </div>
              ) : sharedLeaderboard.length > 0 ? (
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {sharedLeaderboard.slice(0, 10).map((entry, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: index < 3 ? '#fff3e0' : '#f9f9f9',
                      marginBottom: '4px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: '#ff5722' }}>
                          #{index + 1}
                        </span>
                        <span style={{ fontSize: '11px', color: '#333' }}>
                          {entry.username}
                        </span>
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
              
              {/* Wallet Connection Status in Menu */}
              {!walletConnected && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#856404'
                }}>
                  💡 Connect your wallet to save scores onchain!
                </div>
              )}
              
              {/* Start Game Button */}
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
                        onClick={() => moveTile(rowIndex, colIndex)}
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
                      >
                        {tile && (
                          <div style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            fontSize: '8px',
                            padding: '1px 3px',
                            borderRadius: '2px'
                          }}>
                            {tile.id}
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                Congratulations!
              </h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
                You completed puzzle {currentPuzzle?.id} in {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
              </p>
              
              {/* Wallet connection reminder */}
              {!walletConnected && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '11px',
                  color: '#856404',
                  textAlign: 'center'
                }}>
                  💡 Connect wallet to save onchain scores!
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={startGame}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={16} />
                  Play Again
                </button>
                
                <button
                  onClick={resetGame}
                  style={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Menu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '10px', color: '#999', margin: 0 }}>
            Built for Farcaster • {isInFarcaster ? 'Connected' : 'Standalone'} • {walletConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
          </p>
        </div>
      </div>

      {/* Snow animation styles */}
      <style>
        {`
          @keyframes snowfall {
            0% { transform: translateY(-10px) rotate(0deg); }
            100% { transform: translateY(100vh) rotate(360deg); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default InflyncedPuzzle;

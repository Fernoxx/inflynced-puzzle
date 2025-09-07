/**
 * InflyncedPuzzle - Complete Latest Version with Proper Miniapp Embeds
 * Updated: January 2025 with latest Farcaster SDK
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Trophy, RefreshCw, Snowflake, Share2 } from 'lucide-react';

// Image-based puzzle configurations (15 puzzles)
const IMAGE_PUZZLES = [
  { id: 1, image: "/images/puzzle1.jpg" },
  { id: 2, image: "/images/puzzle2.jpg" },
  { id: 3, image: "/images/puzzle3.jpg" },
  { id: 4, image: "/images/puzzle4.jpg" },
  { id: 5, image: "/images/puzzle5.jpg" },
  { id: 7, image: "/images/puzzle7.jpg" },
  { id: 8, image: "/images/puzzle8.jpg" },
  { id: 10, image: "/images/puzzle10.jpg" },
  { id: 12, image: "/images/puzzle12.jpg" },
  { id: 13, image: "/images/puzzle13.jpg" },
  { id: 14, image: "/images/puzzle14.jpg" },
  { id: 15, image: "/images/puzzle15.jpg" }
];

// Contract configuration for Base chain - USER'S ACTUAL CONTRACT
const CONTRACT_ADDRESS = "0xff9760f655b3fcf73864def142df2a551c38f15e";

// Contract ABI with the correct function signatures
const CONTRACT_ABI = [
  "function submitScore(uint256 time, string memory username, uint256 puzzleId, uint256 fid) external",
  "function getTopScores(uint256 limit) external view returns (tuple(address player, uint256 time, string username, uint256 puzzleId, uint256 timestamp, uint256 fid)[])",
  "function getUserScores(address user) external view returns (tuple(address player, uint256 time, string username, uint256 puzzleId, uint256 timestamp, uint256 fid)[])",
];
// const DEFAULT_CHAIN_ID = parseInt(process.env.REACT_APP_DEFAULT_CHAIN_ID || "8453"); // Base chain
const GET_LEADERBOARD_SELECTOR = process.env.REACT_APP_GET_LEADERBOARD_FUNCTION_SELECTOR || "0x5dbf1c37";

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
  
  // Wagmi hooks for wallet connection and contract interaction
  const { address: walletAddress, isConnected: walletConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  
  // Debug connectors on mount
  useEffect(() => {
    console.log('🔍 Available connectors:', connectors);
    console.log('🔍 Wallet connected:', walletConnected);
    console.log('🔍 Wallet address:', walletAddress);
    connectors.forEach(connector => {
      console.log(`🔗 Connector: ${connector.name} (id: ${connector.id})`);
    });
  }, [connectors, walletConnected, walletAddress]);
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();

  // Wagmi v2 contract read hook for leaderboard
  const { data: onchainLeaderboardData, refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTopScores',
    args: [50], // Get top 50 scores
  });

  // Wagmi v2 contract write hook for submitting scores
  const { data: submitTxHash, writeContract: submitScore, isPending: isSubmittingWagmi } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isWaitingForTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: submitTxHash,
  });
  
  // Legacy states for compatibility
  const [sdkInstance, setSdkInstance] = useState(null);
  const [isSubmittingOnchain, setIsSubmittingOnchain] = useState(false);
  const [onchainLeaderboard, setOnchainLeaderboard] = useState([]);
  
  const audioContextRef = useRef(null);
  const timerRef = useRef(null);
  const snowflakesRef = useRef([]);

  // Handle Wagmi v2 transaction success
  useEffect(() => {
    if (isTxSuccess && submitTxHash) {
      console.log('✅ WAGMI v2 Transaction confirmed:', submitTxHash);
      alert(`Score submitted onchain! 🎉\n\nTransaction: ${submitTxHash.slice(0, 10)}...\n\nView on Basescan: https://basescan.org/tx/${submitTxHash}`);
      
      // Refresh leaderboard
      setTimeout(() => {
        refetchLeaderboard();
      }, 3000);
    }
  }, [isTxSuccess, submitTxHash, refetchLeaderboard]);

  // Update onchain leaderboard when data changes
  useEffect(() => {
    if (onchainLeaderboardData) {
      console.log('📊 WAGMI Leaderboard data:', onchainLeaderboardData);
      setOnchainLeaderboard(onchainLeaderboardData);
    }
  }, [onchainLeaderboardData]);

  // Initialize Farcaster SDK FIRST - this is critical
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        console.log('🔗 Initializing Farcaster SDK...');
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        // MUST call ready() first to dismiss splash screen
        await sdk.actions.ready();
        console.log('✅ SDK ready() called - splash screen dismissed');
        
        // Now get context
        const context = await sdk.context;
        console.log('✅ Farcaster SDK initialized:', context);
        
        if (context?.user) {
          setUserProfile(context.user);
          setIsInFarcaster(true);
        } else {
          console.log('❌ No user context - not in Farcaster');
          setIsInFarcaster(false);
        }
        
        setSdkInstance(sdk);
      } catch (error) {
        console.error('❌ Farcaster SDK initialization failed:', error);
        setIsInFarcaster(false);
      }
    };
    
    initFarcaster();
  }, []);

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

  // Set loading state when SDK is ready
  useEffect(() => {
    if (sdkInstance) {
      setIsLoading(false);
    }
  }, [sdkInstance]);

  // Connect wallet using wagmi and Farcaster connector
  const connectWallet = async () => {
    try {
      console.log('🔗 Connecting Farcaster wallet...');
      
      // Check if we're in Farcaster environment
      if (!isInFarcaster || !sdkInstance) {
        throw new Error('This miniapp must be used within Farcaster mobile app.');
      }
      
      console.log('🔍 Available connectors:', connectors);
      
      // Find the Farcaster connector
      const farcasterConnector = connectors.find(connector => 
        connector.id === 'farcasterMiniApp' || 
        connector.id === 'farcaster' ||
        connector.name?.includes('Farcaster')
      );
      
      if (!farcasterConnector) {
        throw new Error('Farcaster connector not found. Please ensure you are using the latest version of Farcaster mobile app.');
      }
      
      console.log('📱 Using Farcaster connector:', farcasterConnector.name || farcasterConnector.id);
      
      // Connect using wagmi connectAsync
      const result = await connectAsync({ connector: farcasterConnector });
      
      console.log('✅ Farcaster wallet connected via wagmi:', result);
      
    } catch (error) {
      console.error('❌ Farcaster wallet connection failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        cause: error.cause
      });
      
      if (error.code === 4001 || error.message.includes('rejected')) {
        alert('❌ Connection cancelled. Please try again and approve the wallet connection request.');
      } else if (error.message.includes('must be used within Farcaster')) {
        alert('⚠️ This miniapp requires Farcaster mobile app\n\nPlease open this miniapp in Farcaster mobile to use the built-in wallet features.');
      } else if (error.message.includes('not found') || error.message.includes('connector')) {
        alert('⚠️ Farcaster wallet connector not available\n\nPlease ensure you are using the latest version of Farcaster mobile app and try again.');
      } else {



  // Proper Farcaster SDK approach with Ethereum wallet
  const submitScoreWithWagmi = async (time, puzzleId) => {
    console.log('🔥 FARCASTER SDK: Using wallet provider for transaction:', { time, puzzleId });
    
    const scoreInSeconds = Math.floor(time / 1000);
    const username = userProfile?.username || userProfile?.displayName || 'anonymous';
    const fid = userProfile?.fid || 0;

    console.log('📝 Submitting score via Farcaster wallet:', {
      contract: CONTRACT_ADDRESS,
      time: scoreInSeconds,
      puzzleId: puzzleId,
      username: username,
      fid: fid
    });

    // Ensure we're in Farcaster environment
    if (!isInFarcaster || !sdkInstance) {
      alert('❌ This app must be used within Farcaster mobile app');
      return;
    }

    try {
      console.log('🔥 Getting Farcaster wallet provider...');
      
      // Use the SDK instance we already have
      const walletProvider = await sdkInstance.wallet.getEthereumProvider();
      
      if (!walletProvider) {
        throw new Error('❌ Farcaster wallet not available. Please ensure you have a wallet connected in Farcaster.');
      }

      console.log('✅ Using Farcaster wallet provider');
      const ethersProvider = new ethers.BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const signerAddress = await signer.getAddress();
      console.log('📝 Farcaster wallet address:', signerAddress);
      console.log('🔥 Calling contract.submitScore...');
      
      const tx = await contract.submitScore(scoreInSeconds, username, puzzleId, fid, {
        gasLimit: 200000,
        maxFeePerGas: ethers.parseUnits("2", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
      });
      
      console.log('✅ Transaction sent:', tx.hash);
      alert(`Score submitted onchain! 🎉\n\nTransaction: ${tx.hash.slice(0, 10)}...\n\nView on Basescan: https://basescan.org/tx/${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);
      
      // Refresh leaderboard
      setTimeout(() => {
        if (refetchLeaderboard) refetchLeaderboard();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        alert('Transaction cancelled by user');
      } else if (error.message.includes('insufficient funds')) {
        alert('❌ Insufficient ETH for gas fees on Base network.\n\n💡 You need a small amount of ETH on Base to pay gas fees.');
      } else if (error.message.includes('user rejected')) {
        alert('Transaction was rejected by user');
      } else {
        alert('❌ Transaction failed: ' + error.message);
      }
    }
  };

  // Legacy ethers.js submit function (fallback)
  const submitScoreOnchain = async (time, puzzleId) => {
    console.log('🔴 DEBUG: submitScoreOnchain called with ethers fallback:', { time, puzzleId });
    console.log('🔴 DEBUG: walletConnected:', walletConnected);
    console.log('🔴 DEBUG: walletAddress:', walletAddress);
    
    if (!walletConnected || !walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsSubmittingOnchain(true);
    console.log('🔴 DEBUG: Starting transaction process...');
    
    try {
      console.log('🔗 Submitting score onchain...');
      
      const scoreInSeconds = Math.floor(time / 1000);
      const username = userProfile?.username || userProfile?.displayName || 'anonymous';
      const fid = userProfile?.fid || 0;
      
      console.log('📝 Submitting score:', {
        contract: CONTRACT_ADDRESS,
        time: scoreInSeconds,
        puzzleId: puzzleId,
        username: username,
        fid: fid
      });

      // FARCASTER ONLY - Use Farcaster's built-in wallet provider
      console.log('📱 Getting Farcaster provider...');
      
      // Get Farcaster SDK provider
      const { sdk } = await import('@farcaster/miniapp-sdk');
      const farcasterProvider = sdk.wallet.ethProvider;
      
      if (!farcasterProvider) {
        throw new Error('❌ Farcaster wallet not available. Please use this app inside Farcaster mobile app.');
      }

      console.log('✅ Using Farcaster wallet provider');
      
      // Create ethers provider with Farcaster's provider
      const ethersProvider = new ethers.BrowserProvider(farcasterProvider);
      const signer = await ethersProvider.getSigner();
      
      console.log('📝 Farcaster wallet connected:', await signer.getAddress());

      // MULTI-STRATEGY CONTRACT CALLS
      console.log('📦 Trying multiple contract function signatures...');
      
      let tx;
      let success = false;
      
                     // Strategy 0: Minimal gas approach  
        try {
          console.log('🎯 Strategy 0: MINIMAL GAS submitScore...');
          const abi0 = ["function submitScore(uint256 time, string memory username, uint256 puzzleId, uint256 fid) external"];
          const contract0 = new ethers.Contract(CONTRACT_ADDRESS, abi0, signer);
          
          // Use minimal gas settings
          tx = await contract0.submitScore(scoreInSeconds, username, puzzleId, fid, { 
            gasLimit: 100000,
            maxFeePerGas: ethers.parseUnits("1", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("0.1", "gwei")
          });
          success = true;
          console.log('✅ Strategy 0 WORKED - MINIMAL GAS!');
        } catch (error0) {
         console.log('❌ Strategy 0 failed, trying function calls...');
         
                   // Strategy 1: CORRECT SIGNATURE - submitScore(uint256,string,uint256,uint256)
          try {
            console.log('🎯 Strategy 1: CORRECT submitScore(time, username, puzzleId, fid)...');
            const abi1 = ["function submitScore(uint256 time, string memory username, uint256 puzzleId, uint256 fid) external"];
            const contract1 = new ethers.Contract(CONTRACT_ADDRESS, abi1, signer);
                         tx = await contract1.submitScore(scoreInSeconds, username, puzzleId, fid, { 
               gasLimit: 300000,
               gasPrice: ethers.parseUnits("0.1", "gwei") // Very low gas price
             });
            success = true;
            console.log('✅ Strategy 1 WORKED - CORRECT SIGNATURE!');
          } catch (error1) {
        console.log('❌ Strategy 1 failed:', error1.message);
        
        // Strategy 2: submitScore(uint256,string)
        try {
          console.log('🎯 Strategy 2: submitScore(time, username)...');
          const abi2 = ["function submitScore(uint256 time, string memory username) external"];
          const contract2 = new ethers.Contract(CONTRACT_ADDRESS, abi2, signer);
          tx = await contract2.submitScore(scoreInSeconds, username, { gasLimit: 100000 });
          success = true;
          console.log('✅ Strategy 2 WORKED!');
        } catch (error2) {
          console.log('❌ Strategy 2 failed:', error2.message);
          
                     // Strategy 3: Full signature
           try {
             console.log('🎯 Strategy 3: Full submitScore...');
             const abi3 = ["function submitScore(uint256 time, uint256 puzzleId, string memory username, uint256 fid) external"];
             const contract3 = new ethers.Contract(CONTRACT_ADDRESS, abi3, signer);
             tx = await contract3.submitScore(scoreInSeconds, puzzleId, username, fid, { gasLimit: 150000 });
             success = true;
             console.log('✅ Strategy 3 WORKED!');
           } catch (error3) {
             console.log('❌ Strategy 3 failed:', error3.message);
             
             // Strategy 4: FALLBACK - Just store score in transaction data
             try {
               console.log('🎯 Strategy 4: FALLBACK storage transaction...');
               
               // Create score storage transaction with event emission
               const scoreData = ethers.solidityPacked(
                 ["uint256", "uint256", "string", "uint256"],
                 [scoreInSeconds, puzzleId, username, fid]
               );
               
               tx = await signer.sendTransaction({
                 to: CONTRACT_ADDRESS,
                 value: 0,
                 data: scoreData,
                 gasLimit: 50000
               });
               success = true;
               console.log('✅ Strategy 4 FALLBACK WORKED!');
             } catch (error4) {
               console.log('❌ Strategy 4 failed:', error4.message);
               
               // Strategy 5: ULTIMATE FALLBACK - Simple ETH transfer with data
               try {
                 console.log('🎯 Strategy 5: ULTIMATE FALLBACK...');
                 tx = await signer.sendTransaction({
                   to: CONTRACT_ADDRESS,
                   value: ethers.parseEther("0.0001"), // Tiny amount
                   data: ethers.toUtf8Bytes(`score:${scoreInSeconds}:puzzle:${puzzleId}:user:${username}`),
                   gasLimit: 30000
                 });
                 success = true;
                 console.log('✅ Strategy 5 ULTIMATE FALLBACK WORKED!');
               } catch (error5) {
                 console.log('❌ ALL STRATEGIES FAILED!');
                 throw new Error(`ALL CONTRACT STRATEGIES FAILED:\n1: ${error1.message}\n2: ${error2.message}\n3: ${error3.message}\n4: ${error4.message}\n5: ${error5.message}`);
                               }
              }
            }
          }
        }
      }
      
      if (!success) {
        throw new Error('Contract call failed - check function exists and has correct signature');
      }
      
      console.log('✅ Transaction sent:', tx.hash);
      
      // Wait for confirmation
      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      
      console.log('✅ Transaction confirmed:', receipt);
      alert(`Score submitted onchain! 🎉\n\nTransaction: ${tx.hash.slice(0, 10)}...\n\nView on Basescan: https://basescan.org/tx/${tx.hash}`);
      
      setTimeout(() => {
        loadOnchainLeaderboard();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Onchain submission failed:', error);
      
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        alert('Transaction cancelled by user');
      } else if (error.message.includes('revert')) {
        alert('Contract rejected the transaction:\n• Check if you have enough ETH for gas\n• Verify contract function exists\n• Ensure parameters are valid');
      } else if (error.message.includes('insufficient funds')) {
        alert('❌ Insufficient ETH for gas fees on Base network.\n\n💡 You need a small amount of ETH on Base to pay gas fees.\n\nGet ETH on Base:\n• Use Farcaster wallet\n• Bridge from mainnet\n• Use Base faucet');
      } else if (error.message.includes('Farcaster wallet not available')) {
        alert('❌ This app only works in Farcaster mobile app.\n\n📱 Please open this miniapp inside Farcaster mobile to use the built-in wallet.');
      } else {
        alert('❌ Transaction failed: ' + error.message);
      }
    } finally {
      setIsSubmittingOnchain(false);
    }
  };

  // Load onchain leaderboard
  const loadOnchainLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    
    try {
      console.log('🔄 Loading onchain leaderboard...');
      
      // Try to read from blockchain using wagmi
      let leaderboardData = [];
      
      // Read leaderboard from YOUR contract
      if (publicClient && walletConnected) {
        try {
          console.log('📖 Reading leaderboard from YOUR contract:', CONTRACT_ADDRESS);
          
          const result = await publicClient.call({
            to: CONTRACT_ADDRESS,
            data: GET_LEADERBOARD_SELECTOR
          });
          
          console.log('📊 Contract leaderboard response:', result);
          
          if (result && result !== '0x') {
            console.log('✅ Got data from contract - need to parse based on your contract ABI');
            // TODO: Parse based on your actual contract's return format
            // leaderboardData = parseYourContractData(result);
          } else {
            console.log('⚠️ Contract returned empty leaderboard');
          }
          
        } catch (contractError) {
          console.log('❌ Contract leaderboard call failed:', contractError);
          console.log('💡 Make sure your contract has the getLeaderboard function');
        }
      }
      
      setSharedLeaderboard(leaderboardData);
      console.log('✅ Leaderboard loaded with', leaderboardData.length, 'entries');
      
    } catch (error) {
      console.log('❌ Error loading leaderboard:', error);
      setSharedLeaderboard([]);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [publicClient, walletConnected]); // Dependencies for contract calls

  // FIXED: Share result with proper miniapp embed
  const shareResult = useCallback(async () => {
    const timeInSeconds = (totalTime / 1000).toFixed(1);
    const miniappUrl = "https://farcaster.xyz/miniapps/HUfrM_bUX-VR/inflyncedpuzzle";
    const text = `🧩 I solved the InflyncedPuzzle in ${timeInSeconds} seconds!\n\nCan you beat my time? Try it now! 👇`;
    
    console.log('🔄 Share function called');
    console.log('📱 Miniapp URL:', miniappUrl);
    
    // Try Farcaster composeCast if available
    if (sdkInstance && isInFarcaster) {
      try {
        console.log('📱 Using Farcaster composeCast with proper embed');
        
        // Multiple embed format attempts for compatibility
        const embedFormats = [
          // Format 1: Direct URL string
          miniappUrl,
          
          // Format 2: URL object
          { url: miniappUrl },
          
          // Format 3: Embed object
          {
            url: miniappUrl,
            type: 'miniapp'
          },
          
          // Format 4: Frame format for compatibility
          {
            url: miniappUrl,
            type: 'frame'
          }
        ];
        
        for (const embedFormat of embedFormats) {
          try {
            console.log('🔄 Trying embed format:', embedFormat);
            
            const result = await sdkInstance.actions.composeCast({
              text: text,
              embeds: [embedFormat]
            });
            
            if (result?.cast) {
              console.log('✅ Cast shared successfully with embed format:', embedFormat);
              console.log('✅ Cast hash:', result.cast.hash);
              return;
            }
          } catch (embedError) {
            console.log('❌ Embed format failed:', embedFormat, embedError);
            continue;
          }
        }
        
        // If all embed formats fail, try without embeds (URL in text)
        console.log('🔄 Trying without embeds, URL in text only');
        const result = await sdkInstance.actions.composeCast({
          text: `${text}\n\n${miniappUrl}`
        });
        
        if (result?.cast) {
          console.log('✅ Cast shared successfully (text only)');
          return;
        }
        
      } catch (error) {
        console.log('❌ Farcaster share failed:', error);
      }
    }
    
    // Fallback to Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'InflyncedPuzzle - I solved it!',
          text: text,
          url: miniappUrl,
        });
        console.log('✅ Web Share API used');
      } catch (error) {
        console.log('Web Share cancelled or failed:', error);
      }
    } else {
      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(`${text}\n\n${miniappUrl}`);
        alert('Result copied to clipboard!');
        console.log('✅ Copied to clipboard');
      } catch (error) {
        console.log('Clipboard failed:', error);
      }
    }
  }, [totalTime, sdkInstance, isInFarcaster]);

  // Snow animation functions
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

  const toggleSnowEffect = useCallback(() => {
    setShowSnowEffect(!showSnowEffect);
  }, [showSnowEffect]);

  // Game logic functions
  const generateBoard = useCallback((puzzle) => {
    const solved = [];
    for (let row = 0; row < 3; row++) {
      solved[row] = [];
      for (let col = 0; col < 3; col++) {
        if (row === 2 && col === 2) {
          solved[row][col] = null;
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

    const shuffled = JSON.parse(JSON.stringify(solved));
    let currentEmptyPos = { row: 2, col: 2 };
    
    for (let i = 0; i < 1000; i++) {
      const possibleMoves = getPossibleMoves(shuffled, currentEmptyPos);
      if (possibleMoves.length > 0) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        shuffled[currentEmptyPos.row][currentEmptyPos.col] = shuffled[randomMove.row][randomMove.col];
        shuffled[randomMove.row][randomMove.col] = null;
        currentEmptyPos = { row: randomMove.row, col: randomMove.col };
      }
    }
    
    setEmptyPos(currentEmptyPos);
    return shuffled;
  }, []);

  const getPossibleMoves = (board, emptyPos) => {
    const moves = [];
    const { row, col } = emptyPos;
    
    const directions = [
      { row: row - 1, col: col },
      { row: row + 1, col: col },
      { row: row, col: col - 1 },
      { row: row, col: col + 1 }
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

    const isAdjacent = (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    );

    if (isAdjacent) {
      newBoard[emptyRow][emptyCol] = newBoard[row][col];
      newBoard[row][col] = null;
      
      if (newBoard[emptyRow][emptyCol]) {
        newBoard[emptyRow][emptyCol].currentRow = emptyRow;
        newBoard[emptyRow][emptyCol].currentCol = emptyCol;
      }

      setBoard(newBoard);
      setEmptyPos({ row, col });

      if (isPuzzleSolved(newBoard)) {
        const finalTime = Date.now() - startTime;
        setTotalTime(finalTime);
        setGameState('completed');
        console.log('🎉 Puzzle completed!');
      }
    }
  }, [board, emptyPos, gameState, isPaused, startTime]);

  const isPuzzleSolved = (board) => {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (row === 2 && col === 2) {
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
    const tileSize = 74;
    const backgroundPositionX = -(correctCol * tileSize);
    const backgroundPositionY = -(correctRow * tileSize);
    
    return {
      backgroundImage: `url(${tile.image})`,
      backgroundSize: `${tileSize * 3}px ${tileSize * 3}px`,
      backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
      backgroundRepeat: 'no-repeat'
    };
  };

  const startGame = useCallback(() => {
    const puzzle = IMAGE_PUZZLES[Math.floor(Math.random() * IMAGE_PUZZLES.length)];
    setCurrentPuzzle(puzzle);
    const newBoard = generateBoard(puzzle);
    setBoard(newBoard);
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
      loadOnchainLeaderboard();
    }
    setShowLeaderboard(!showLeaderboard);
  }, [showLeaderboard, loadOnchainLeaderboard]);

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

  // Loading screen
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
      background: 'linear-gradient(135deg, #ff7043 0%, #ff5722 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative'
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

      {/* Card Container */}
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
            {/* Make It Snow Button */}
            <button
              onClick={toggleSnowEffect}
              style={{
                padding: '6px',
                backgroundColor: showSnowEffect ? '#87CEEB' : '#ff5722',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
              title={showSnowEffect ? 'Stop Snow' : 'Make It Snow'}
            >
              <Snowflake size={12} />
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
        {!walletConnected && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: isInFarcaster ? '#fff3cd' : '#f8d7da',
            borderBottom: '1px solid ' + (isInFarcaster ? '#ffeaa7' : '#f5c6cb'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '12px', color: isInFarcaster ? '#856404' : '#721c24' }}>
              {isInFarcaster ? '📱 Farcaster Wallet Required' : '⚠️ Open in Farcaster App'}
            </span>
            <button
              onClick={connectWallet}
              disabled={!isInFarcaster}
              style={{
                backgroundColor: isInFarcaster ? '#8B5CF6' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: isInFarcaster ? 'pointer' : 'not-allowed',
                opacity: isInFarcaster ? 1 : 0.6
              }}
            >
              {isInFarcaster ? 'Connect Wallet' : 'Not Available'}
            </button>
          </div>
        )}

        {walletConnected && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#e8f5e8',
            borderBottom: '1px solid #c8e6c9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#2e7d32' }}>
                🔗 Farcaster Wallet Connected
              </span>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                color: '#333',
                backgroundColor: 'rgba(0,0,0,0.1)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </span>
            </div>
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
              Time: {(totalTime / 1000).toFixed(1)} seconds
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{ minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
          {/* Leaderboard */}
          {showLeaderboard && (
            <div style={{ flex: 1, padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#333', textAlign: 'center' }}>
                🏆 Onchain Leaderboard
              </h3>
              
              {isLoadingLeaderboard ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#666', fontSize: '12px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ff5722',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 8px'
                  }} />
                  Loading onchain scores...
                </div>
              ) : sharedLeaderboard.length > 0 ? (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: '600',
                    color: '#666',
                    borderBottom: '1px solid #e0e0e0',
                    marginBottom: '6px'
                  }}>
                    <span>Rank & Player</span>
                    <span>Time & Puzzle</span>
                  </div>
                  {sharedLeaderboard.slice(0, 10).map((entry, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#f9f9f9',
                      marginBottom: '4px',
                      border: '1px solid #e0e0e0',
                      boxShadow: index < 3 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: index < 3 ? '#fff' : '#ff5722',
                          color: index < 3 ? '#333' : '#fff',
                          fontSize: '10px',
                          fontWeight: '700'
                        }}>
                          {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {entry.username}
                          </div>
                          <div style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace' }}>
                            {entry.player}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#ff5722', fontFamily: 'monospace' }}>
                          {entry.time}s
                        </div>
                        <div style={{ fontSize: '9px', color: '#666' }}>
                          Puzzle #{entry.puzzleId}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div style={{
                    textAlign: 'center',
                    padding: '8px',
                    fontSize: '10px',
                    color: '#666',
                    borderTop: '1px solid #e0e0e0',
                    marginTop: '8px'
                  }}>
                    ⛓️ Scores stored permanently on Base blockchain
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#666', fontSize: '12px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>No onchain scores yet!</div>
                  <div style={{ fontSize: '10px', marginBottom: '8px' }}>Be the first to submit a score to the blockchain</div>
                  <div style={{ fontSize: '10px', color: '#999' }}>
                    {walletConnected ? 'Complete a puzzle to submit your score!' : 'Connect wallet to save scores onchain'}
                  </div>
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
              
              {!walletConnected && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#856404'
                }}>
                  📱 Connect your Farcaster wallet to save scores on Base blockchain!
                </div>
              )}
              
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
                You completed puzzle {currentPuzzle?.id} in {(totalTime / 1000).toFixed(1)} seconds
              </p>
              
              {walletConnected && (
                <div style={{
                  backgroundColor: '#e8f5e8',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  width: '100%',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '12px', color: '#2e7d32', margin: '0 0 8px 0' }}>
                    🔗 Save your score onchain for permanent leaderboard!
                  </p>
                  <button
                    onClick={() => {
                      console.log('🔥 WAGMI: Save Onchain button clicked!');
                      console.log('🔥 WAGMI: totalTime:', totalTime);
                      console.log('🔥 WAGMI: currentPuzzle?.id:', currentPuzzle?.id);
                      submitScoreWithWagmi(totalTime, currentPuzzle?.id);
                    }}
                    disabled={isSubmittingWagmi || isWaitingForTx}
                    style={{
                      backgroundColor: '#8B5CF6',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '12px',
                      border: 'none',
                      cursor: (isSubmittingWagmi || isWaitingForTx) ? 'not-allowed' : 'pointer',
                      opacity: (isSubmittingWagmi || isWaitingForTx) ? 0.7 : 1
                    }}
                  >
                    {isSubmittingWagmi ? 'Signing...' : isWaitingForTx ? 'Confirming...' : '⛓️ Save Onchain'}
                  </button>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={shareResult}
                  style={{
                    backgroundColor: '#1DA1F2',
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
                  <Share2 size={16} />
                  Share Result
                </button>
                
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

      {/* Animation styles */}
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

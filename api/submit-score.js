// Firebase-powered score submission API for Vercel Serverless Functions
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDKBbxqu4uU6_wq1KPvv5yRuH6KaUqWWs",
  authDomain: "inflynced-puzzle.firebaseapp.com",
  projectId: "inflynced-puzzle",
  storageBucket: "inflynced-puzzle.firebasestorage.app",
  messagingSenderId: "299932878484",
  appId: "1:299932878484:web:b5609e70e0111786381681"
};

// Initialize Firebase
let app;
let db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  // Firebase might already be initialized
  console.log('Firebase initialization note:', error.message);
}

// Helper function to fetch Farcaster profile data
async function fetchFarcasterProfile(username, fid) {
  try {
    console.log(`🔍 Fetching Farcaster profile for ${username} (FID: ${fid})`);
    const response = await fetch(`https://api.warpcast.com/v2/user?fid=${fid}`, {
      headers: {
        'User-Agent': 'InflyncedPuzzle/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const user = data.result?.user;
      
      if (user) {
        console.log(`✅ Got Farcaster profile for ${user.username}`);
        return {
          username: user.username || username,
          displayName: user.displayName || user.username || username,
          pfpUrl: user.pfp?.url || null
        };
      }
    }
  } catch (error) {
    console.log(`⚠️ Could not fetch Farcaster profile for ${username}:`, error.message);
  }
  
  // Fallback to provided data
  return {
    username: username,
    displayName: username,
    pfpUrl: null
  };
}

export default async function handler(req, res) {
  // Set CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { username, fid, time, avatar } = req.body;

      // Validate required fields
      if (!username || !fid || typeof time !== 'number') {
        console.log('❌ Validation failed: Missing required fields', { username: !!username, fid: !!fid, time: typeof time });
        return res.status(400).json({ 
          error: 'Missing required fields: username, fid, and time are required' 
        });
      }

      // Validate time is reasonable (between 1 second and 1 hour)
      if (time < 1 || time > 3600) {
        console.log('❌ Validation failed: Invalid time', time);
        return res.status(400).json({ 
          error: 'Invalid time. Time must be between 1 and 3600 seconds.' 
        });
      }

      // Validate username length
      if (username.length > 50) {
        console.log('❌ Validation failed: Username too long', username.length);
        return res.status(400).json({ 
          error: 'Username too long. Maximum 50 characters.' 
        });
      }

      console.log(`📊 Processing score submission: ${username} (${fid}) - ${time}s`);

      // Fetch updated Farcaster profile information
      const profile = await fetchFarcasterProfile(username, fid);

      // Create the score entry
      const scoreEntry = {
        username: profile.username.slice(0, 20), // Limit username length for display
        displayName: profile.displayName || profile.username,
        fid: fid.toString(), // Ensure FID is stored as string
        time: parseFloat(time.toFixed(1)), // Round to 1 decimal place
        timestamp: Date.now(),
        avatar: profile.pfpUrl || avatar || "🧩",
        pfpUrl: profile.pfpUrl,
        userAgent: req.headers['user-agent'] || 'Unknown',
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'Unknown'
      };

      console.log('💾 Saving score to Firebase:', { 
        username: scoreEntry.username, 
        fid: scoreEntry.fid, 
        time: scoreEntry.time 
      });

      // Add to Firebase Firestore
      const docRef = await addDoc(collection(db, 'leaderboard'), scoreEntry);
      console.log(`✅ Score saved to Firebase with document ID: ${docRef.id}`);

      // Get updated leaderboard to calculate user's position
      try {
        const leaderboardRef = collection(db, 'leaderboard');
        const q = query(
          leaderboardRef,
          orderBy('time', 'asc'),
          limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        const allScores = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.username && 
              data.fid && 
              typeof data.time === 'number' && 
              data.time > 0 &&
              data.username !== 'puzzlemaster' && 
              data.username !== 'speedsolver' && 
              data.username !== 'braingamer' &&
              !data.fid.toString().includes('demo') &&
              !data.fid.toString().includes('sample')) {
            allScores.push(data);
          }
        });

        // Remove duplicates - keep only best score per user
        const userBestScores = {};
        allScores.forEach(entry => {
          const entryFid = entry.fid.toString();
          if (!userBestScores[entryFid] || entry.time < userBestScores[entryFid].time) {
            userBestScores[entryFid] = entry;
          }
        });

        const finalScores = Object.values(userBestScores)
          .sort((a, b) => a.time - b.time);

        // Find user's position
        const userFid = fid.toString();
        const position = finalScores.findIndex(entry => entry.fid.toString() === userFid) + 1;

        console.log(`🏆 ${username} is now ranked #${position} out of ${finalScores.length} players`);

        // Return success response
        res.status(200).json({ 
          success: true, 
          message: 'Score submitted successfully to Firebase',
          position: position,
          totalScores: finalScores.length,
          userScore: {
            username: scoreEntry.username,
            time: scoreEntry.time,
            position: position
          },
          leaderboard: finalScores.slice(0, 10) // Return top 10 for immediate UI update
        });

      } catch (leaderboardError) {
        console.log('⚠️ Could not fetch updated leaderboard, but score was saved:', leaderboardError.message);
        
        // Score was saved successfully, just couldn't get updated leaderboard
        res.status(200).json({ 
          success: true, 
          message: 'Score submitted successfully to Firebase',
          position: null,
          totalScores: null,
          userScore: {
            username: scoreEntry.username,
            time: scoreEntry.time
          }
        });
      }

    } catch (error) {
      console.error('❌ Firebase score submission error:', error);
      
      // Return detailed error for debugging
      res.status(500).json({ 
        error: 'Failed to submit score to Firebase', 
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      });
    }
  } else {
    // Method not allowed
    res.status(405).json({ error: 'Method not allowed. Use POST to submit scores.' });
  }
}

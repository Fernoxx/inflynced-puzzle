// Firebase-powered score submission API for Vercel
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

// Initialize Firebase (only if not already initialized)
let app;
let db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.log('Firebase already initialized');
}

// Helper function to fetch Farcaster profile data
async function fetchFarcasterProfile(username, fid) {
  try {
    const response = await fetch(`https://api.warpcast.com/v2/user?fid=${fid}`);
    if (response.ok) {
      const data = await response.json();
      return {
        username: data.result?.user?.username || username,
        displayName: data.result?.user?.displayName || username,
        pfpUrl: data.result?.user?.pfp?.url || null
      };
    }
  } catch (error) {
    console.log('Could not fetch Farcaster profile:', error);
  }
  
  return {
    username: username,
    displayName: username,
    pfpUrl: null
  };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { username, fid, time, avatar } = req.body;

      // Validate input
      if (!username || !fid || typeof time !== 'number') {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (time < 0 || time > 3600) { // Reasonable time limits (0-60 minutes)
        return res.status(400).json({ error: 'Invalid time' });
      }

      console.log('📊 Submitting score to Firebase:', { username, fid, time });

      // Fetch updated Farcaster profile
      const profile = await fetchFarcasterProfile(username, fid);

      // Create new entry
      const newEntry = {
        username: profile.username.slice(0, 20), // Limit username length
        displayName: profile.displayName,
        fid: fid,
        time: parseFloat(time.toFixed(1)),
        timestamp: Date.now(),
        avatar: profile.pfpUrl || avatar || "🧩",
        pfpUrl: profile.pfpUrl
      };

      // Add to Firebase
      const docRef = await addDoc(collection(db, 'leaderboard'), newEntry);
      console.log('✅ Score added to Firebase with ID:', docRef.id);

      // Get updated leaderboard for user position
      const scoresRef = collection(db, 'leaderboard');
      const q = query(
        scoresRef,
        orderBy('time', 'asc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const allScores = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.username !== 'puzzlemaster' && 
            data.username !== 'speedsolver' && 
            data.username !== 'braingamer' &&
            !data.fid?.includes('demo') &&
            !data.fid?.includes('sample') &&
            data.fid && 
            data.username &&
            typeof data.time === 'number') {
          allScores.push({ id: doc.id, ...data });
        }
      });

      // Remove duplicates - keep only best score per user
      const userBestScores = {};
      allScores.forEach(entry => {
        if (!userBestScores[entry.fid] || entry.time < userBestScores[entry.fid].time) {
          userBestScores[entry.fid] = entry;
        }
      });

      const finalScores = Object.values(userBestScores)
        .sort((a, b) => a.time - b.time);

      // Find user's position
      const position = finalScores.findIndex(entry => entry.fid === fid) + 1;

      console.log(`✅ Score submitted successfully. User ${username} is now position ${position}`);

      res.status(200).json({ 
        success: true, 
        message: 'Score submitted successfully',
        position: position,
        totalScores: finalScores.length,
        leaderboard: finalScores.slice(0, 10) // Return top 10 for immediate update
      });

    } catch (error) {
      console.error('❌ Firebase submit score error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Fixed Firebase-powered leaderboard API for Vercel Serverless Functions
// Use dynamic imports for Firebase in Node.js environment

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDKBbxqu4uU6_wq1KPvv5yRuH6KaUqWWs",
  authDomain: "inflynced-puzzle.firebaseapp.com",
  projectId: "inflynced-puzzle",
  storageBucket: "inflynced-puzzle.firebasestorage.app",
  messagingSenderId: "299932878484",
  appId: "1:299932878484:web:b5609e70e0111786381681"
};

// Initialize Firebase with dynamic imports
let app;
let db;

const initializeFirebase = async () => {
  if (!app) {
    try {
      const { initializeApp } = await import('firebase/app');
      const { getFirestore } = await import('firebase/firestore');
      
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }
  return { app, db };
};

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

  if (req.method === 'GET') {
    try {
      console.log('🔄 Fetching leaderboard from Firebase Firestore...');
      
      // Initialize Firebase
      await initializeFirebase();
      
      // Import Firestore functions dynamically
      const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
      
      // Query Firestore for leaderboard scores
      const leaderboardRef = collection(db, 'leaderboard');
      const q = query(
        leaderboardRef, 
        orderBy('time', 'asc'), // Best times first (ascending)
        limit(100) // Get top 100 scores for processing
      );
      
      const querySnapshot = await getDocs(q);
      const allScores = [];
      
      // Process each document
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter out demo/test data and validate entries
        if (data.username && 
            data.fid && 
            typeof data.time === 'number' && 
            data.time > 0 &&
            data.username !== 'puzzlemaster' && 
            data.username !== 'speedsolver' && 
            data.username !== 'braingamer' &&
            !data.fid.toString().includes('demo') &&
            !data.fid.toString().includes('sample') &&
            !data.fid.toString().includes('test')) {
          
          allScores.push({
            id: doc.id,
            username: data.username,
            displayName: data.displayName || data.username,
            fid: data.fid,
            time: data.time,
            timestamp: data.timestamp || Date.now(),
            avatar: data.avatar || "🧩",
            pfpUrl: data.pfpUrl || null
          });
        }
      });

      // Remove duplicates - keep only best score per user (lowest time)
      const userBestScores = {};
      allScores.forEach(entry => {
        const fid = entry.fid.toString();
        if (!userBestScores[fid] || entry.time < userBestScores[fid].time) {
          userBestScores[fid] = entry;
        }
      });

      // Convert back to array, sort by time, and limit to top 10
      const finalScores = Object.values(userBestScores)
        .sort((a, b) => a.time - b.time)
        .slice(0, 10);

      console.log(`✅ Successfully fetched ${finalScores.length} leaderboard entries from Firebase`);
      
      // Return the leaderboard
      res.status(200).json(finalScores);
      
    } catch (error) {
      console.error('❌ Firebase leaderboard fetch error:', error);
      
      // Return error with empty scores array
      res.status(500).json({ 
        error: 'Failed to fetch leaderboard from Firebase', 
        scores: [],
        details: error.message 
      });
    }
  } else {
    // Method not allowed
    res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }
}

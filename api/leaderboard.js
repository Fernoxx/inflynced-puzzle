// Firebase-powered leaderboard API for Vercel
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";

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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      console.log('🔄 Fetching leaderboard from Firebase...');
      
      // Get all scores from Firebase, ordered by time (ascending = best first)
      const scoresRef = collection(db, 'leaderboard');
      const q = query(
        scoresRef, 
        orderBy('time', 'asc'),
        limit(50) // Get top 50 scores
      );
      
      const querySnapshot = await getDocs(q);
      const allScores = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out demo/test data
        if (data.username !== 'puzzlemaster' && 
            data.username !== 'speedsolver' && 
            data.username !== 'braingamer' &&
            !data.fid?.includes('demo') &&
            !data.fid?.includes('sample') &&
            data.fid && 
            data.username &&
            typeof data.time === 'number') {
          allScores.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Remove duplicates - keep only best score per user
      const userBestScores = {};
      allScores.forEach(entry => {
        if (!userBestScores[entry.fid] || entry.time < userBestScores[entry.fid].time) {
          userBestScores[entry.fid] = entry;
        }
      });

      // Convert back to array, sort, and limit to top 10
      const finalScores = Object.values(userBestScores)
        .sort((a, b) => a.time - b.time)
        .slice(0, 10);

      console.log(`✅ Returning ${finalScores.length} leaderboard entries from Firebase`);
      
      res.status(200).json(finalScores);
      
    } catch (error) {
      console.error('❌ Firebase leaderboard fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard', scores: [] });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Vercel serverless function for leaderboard
let leaderboardData = [];

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return current leaderboard (top 10, sorted by time)
    const sortedLeaderboard = leaderboardData
      .sort((a, b) => a.time - b.time)
      .slice(0, 10);
    
    res.status(200).json(sortedLeaderboard);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

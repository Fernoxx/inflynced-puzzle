// Vercel serverless function for submitting scores
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

      // Create new entry
      const newEntry = {
        username: username.slice(0, 20), // Limit username length
        fid,
        time: parseFloat(time.toFixed(1)),
        timestamp: Date.now(),
        avatar: avatar || "🧩"
      };

      // Add to leaderboard
      leaderboardData.push(newEntry);

      // Keep only top 100 scores to prevent memory issues
      leaderboardData = leaderboardData
        .sort((a, b) => a.time - b.time)
        .slice(0, 100);

      res.status(200).json({ 
        success: true, 
        message: 'Score submitted successfully',
        position: leaderboardData.findIndex(entry => 
          entry.fid === fid && entry.timestamp === newEntry.timestamp
        ) + 1
      });

    } catch (error) {
      console.error('Submit score error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

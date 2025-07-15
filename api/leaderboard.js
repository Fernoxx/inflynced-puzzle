// Vercel serverless function for shared leaderboard
let sharedLeaderboard = [];

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
    // Filter out demo data and remove duplicates
    const realScores = sharedLeaderboard.filter(entry => 
      entry.username !== 'puzzlemaster' && 
      entry.username !== 'speedsolver' && 
      entry.username !== 'braingamer' &&
      !entry.fid?.includes('demo') &&
      !entry.fid?.includes('sample')
    );
    
    // Remove duplicates - keep only best score per user
    const userBestScores = {};
    realScores.forEach(entry => {
      if (!userBestScores[entry.fid] || entry.time < userBestScores[entry.fid].time) {
        userBestScores[entry.fid] = entry;
      }
    });
    
    const finalScores = Object.values(userBestScores)
      .sort((a, b) => a.time - b.time)
      .slice(0, 10);
    
    // Update the shared leaderboard with cleaned data
    sharedLeaderboard = finalScores;
    
    res.status(200).json(finalScores);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

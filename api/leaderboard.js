// Fixed Vercel serverless function for fetching leaderboard
// Uses file-based persistence to match submit-score.js

import { promises as fs } from 'fs';
import path from 'path';

const LEADERBOARD_FILE = '/tmp/leaderboard.json';

// Helper function to load leaderboard from file
async function loadLeaderboard() {
  try {
    const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty, return empty array
    console.log('No leaderboard file found, returning empty array');
    return [];
  }
}

// Helper function to refresh Farcaster profile data
async function refreshFarcasterProfile(entry) {
  try {
    // Only refresh if we don't have a profile picture or it's been more than 1 hour
    const oneHour = 60 * 60 * 1000;
    const shouldRefresh = !entry.pfpUrl || !entry.lastProfileUpdate || 
                         (Date.now() - entry.lastProfileUpdate) > oneHour;
    
    if (!shouldRefresh) {
      return entry;
    }

    const response = await fetch(`https://api.warpcast.com/v2/user?fid=${entry.fid}`);
    if (response.ok) {
      const data = await response.json();
      const user = data.result?.user;
      
      if (user) {
        return {
          ...entry,
          username: user.username || entry.username,
          displayName: user.displayName || entry.displayName || entry.username,
          pfpUrl: user.pfp?.url || entry.pfpUrl,
          lastProfileUpdate: Date.now()
        };
      }
    }
  } catch (error) {
    console.log('Could not refresh Farcaster profile for FID:', entry.fid, error);
  }
  
  return entry;
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
      // Load leaderboard from file
      let leaderboard = await loadLeaderboard();
      
      // Filter out demo data and invalid entries
      const realScores = leaderboard.filter(entry => 
        entry.username !== 'puzzlemaster' && 
        entry.username !== 'speedsolver' && 
        entry.username !== 'braingamer' &&
        !entry.fid?.includes('demo') &&
        !entry.fid?.includes('sample') &&
        entry.fid && 
        entry.username &&
        typeof entry.time === 'number'
      );
      
      // Remove duplicates - keep only best score per user
      const userBestScores = {};
      realScores.forEach(entry => {
        if (!userBestScores[entry.fid] || entry.time < userBestScores[entry.fid].time) {
          userBestScores[entry.fid] = entry;
        }
      });
      
      // Convert back to array and sort
      let finalScores = Object.values(userBestScores)
        .sort((a, b) => a.time - b.time)
        .slice(0, 10);

      // Refresh profile data for top 10 (optional, can be resource intensive)
      // Uncomment the following block if you want to always have fresh profile pics
      /*
      const refreshPromises = finalScores.map(entry => refreshFarcasterProfile(entry));
      finalScores = await Promise.all(refreshPromises);
      */

      console.log(`Returning ${finalScores.length} leaderboard entries`);
      
      res.status(200).json(finalScores);
      
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      res.status(500).json({ error: 'Internal server error', scores: [] });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

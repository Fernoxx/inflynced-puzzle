// Fixed Vercel serverless function for submitting scores
// Uses file-based persistence for simple deployment

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
    return [];
  }
}

// Helper function to save leaderboard to file
async function saveLeaderboard(leaderboard) {
  try {
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
  } catch (error) {
    console.error('Error saving leaderboard:', error);
  }
}

// Helper function to fetch Farcaster profile data
async function fetchFarcasterProfile(username, fid) {
  try {
    // Try to get profile from Warpcast API (if available)
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
  
  // Fallback to provided data
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

      // Load current leaderboard
      let leaderboard = await loadLeaderboard();

      // Filter out demo data and old scores from same user
      leaderboard = leaderboard.filter(entry => 
        entry.username !== 'puzzlemaster' && 
        entry.username !== 'speedsolver' && 
        entry.username !== 'braingamer' &&
        !entry.fid?.includes('demo') &&
        !entry.fid?.includes('sample') &&
        entry.fid !== fid
      );

      // Fetch updated Farcaster profile
      const profile = await fetchFarcasterProfile(username, fid);

      // Create new entry
      const newEntry = {
        username: profile.username.slice(0, 20), // Limit username length
        displayName: profile.displayName,
        fid: fid,
        time: parseFloat(time.toFixed(1)),
        timestamp: Date.now(),
        avatar: profile.pfpUrl || "🧩",
        pfpUrl: profile.pfpUrl
      };

      console.log('Adding new score entry:', newEntry);

      // Add to leaderboard
      leaderboard.push(newEntry);

      // Sort by time and keep top 50
      leaderboard = leaderboard
        .sort((a, b) => a.time - b.time)
        .slice(0, 50);

      // Save updated leaderboard
      await saveLeaderboard(leaderboard);

      // Find user's position
      const position = leaderboard.findIndex(entry => entry.fid === fid) + 1;

      console.log(`Score submitted successfully. User ${username} is now position ${position}`);

      res.status(200).json({ 
        success: true, 
        message: 'Score submitted successfully',
        position: position,
        totalScores: leaderboard.length,
        leaderboard: leaderboard.slice(0, 10) // Return top 10 for immediate update
      });

    } catch (error) {
      console.error('Submit score error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

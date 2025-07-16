// Farcaster Miniapp Webhook Handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only handle POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { type, data } = req.body;
    
    console.log('🔔 Webhook received:', { type, data });
    
    // Handle different webhook event types
    switch (type) {
      case 'miniapp.launched':
        console.log('🚀 Miniapp launched by user:', data.user);
        // You can track user engagement here
        break;
        
      case 'miniapp.cast_shared':
        console.log('📢 Cast shared:', data);
        // Track sharing events
        break;
        
      case 'miniapp.interaction':
        console.log('🎮 User interaction:', data);
        // Track user interactions
        break;
        
      default:
        console.log('❓ Unknown webhook type:', type);
        break;
    }
    
    // Always respond with success
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
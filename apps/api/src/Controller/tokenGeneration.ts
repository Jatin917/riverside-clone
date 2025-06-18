import { AccessToken } from 'livekit-server-sdk';
import { API_KEY, API_SECRET, LIVEKIT_URL } from '../server';


export const tokenGeneration = async (req, res)=>{
    try {
    const { token:roomToken, metadata, email } = req.body;
    
    if (!roomToken ||  !email) {
      console.log("roomToken and email are required ", roomToken, email);
      return res.status(400).json({ 
        error: 'roomToken and email are required' 
      });
    }

    // Create access token
    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: email,
      metadata: metadata || JSON.stringify({ userId: Date.now() })
    });

    // Grant permissions
    at.addGrant({
      room: roomToken,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true
    });

    const token = await at.toJwt();
    
    res.json({
      token,
      wsUrl: LIVEKIT_URL,
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
}
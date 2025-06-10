import { AccessToken } from 'livekit-server-sdk';
import { API_KEY, API_SECRET, LIVEKIT_URL } from '../server';


export const tokenGeneration = async (req, res)=>{
    try {
    const { roomName, participantName, metadata } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ 
        error: 'roomName and participantName are required' 
      });
    }

    // Create access token
    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: participantName,
      metadata: metadata || JSON.stringify({ userId: Date.now() })
    });

    // Grant permissions
    at.addGrant({
      room: roomName,
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
      roomName,
      participantName
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
}
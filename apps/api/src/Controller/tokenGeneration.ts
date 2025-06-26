import { AccessToken } from 'livekit-server-sdk';
import { API_KEY, API_SECRET, LIVEKIT_URL } from '../server';
import { Request, Response } from 'express';
import { RedisClient } from '../services/redis';
import { error } from 'console';
import { HTTP_STATUS } from '../lib/types';
import { prisma } from '@repo/db';

interface TokenGenerationRequest {
  token: string;
  metadata?: string;
  email: string;
}

export const tokenGeneration = async (req: Request, res: Response) => {
  try {
    const { token: roomToken, metadata, email } = req.body as TokenGenerationRequest;
    
    if (!roomToken || !email) {
      return res.status(400).json({
        error: 'roomToken and email are required'
      });
    }
    const user = await prisma.user.findFirst({where:{email}, include:{Studio:{select:{slugId:true}}}});
    if(!user){
      return res.status(HTTP_STATUS.NOT_FOUND).json({message:"No user found with this email"});
    }
    const userId = user?.id;
    const slugIdOfHost = user.Studio?.slugId;
    const client = await RedisClient();
    const alreadyExist = await client.get(`participateSession-${userId}`);
    const session = await client.get(`sessionToken-${roomToken}`);
    if(!session) {
      console.log("session don't exist for this room token");
      return res.status(HTTP_STATUS.BAD_REQUEST).json({message:"No Session exist"});
    }
    const parsedSession = await JSON.parse(session);
    const slugIdOfUser = parsedSession.slugId;
    if(alreadyExist){
      const parseddata = JSON.parse(alreadyExist);
      if(parseddata.roomToken!=roomToken){
        // iska mtlb user dusre room main join hona chah rhaa hain so we will make sure this thing don't happen
        return res.status(HTTP_STATUS.CONFLICT).json({message:"Already in the room ", roomToken:parseddata.roomToken});
      }
    }
    else if(slugIdOfHost!==slugIdOfUser) await client.set(`participateSession-${userId}`, JSON.stringify({joinedAt: new Date(), roomToken:roomToken}), {EX:7200})

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
    return res.json({
      token,
      wsUrl: LIVEKIT_URL,
    });

  } catch (error) {
    console.error('Token generation error:', (error as Error).message);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
};

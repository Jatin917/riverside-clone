import { AccessToken } from 'livekit-server-sdk';
import { API_KEY, API_SECRET, LIVEKIT_URL } from '../../server.js';
import { HTTP_STATUS } from '../../lib/types.js';
import { prisma } from '@repo/db';
import { RedisClient } from '../../services/redis.js';

interface TokenGenerationRequest {
  token: string;
  metadata?: string;
  email: string;
  socketId:string;
}

export const tokenGeneration = async ({token:roomToken, metadata,  email, socketId}:TokenGenerationRequest) => {
  try {    
    if (!roomToken || !email) {
      return {status:HTTP_STATUS.NOT_FOUND, message:"room token and email not found"};
    }
    const user = await prisma.user.findFirst({where:{email}, include:{Studio:{select:{slugId:true}}}});
    if(!user){
      return {status:HTTP_STATUS.NOT_FOUND,message:"No user found with this email"};
    }
    const userId = user?.id;
    const slugIdOfHost = user.Studio?.slugId;
    const client = await RedisClient();
    const alreadyExist = await client.get(`participateSession-${userId}`);
    const session = await client.get(`sessionToken-${roomToken}`);
    if(!session) {
      console.log("session don't exist for this room token");
      return {status:HTTP_STATUS.BAD_REQUEST,message:"No Session exist"};
    }
    const parsedSession = await JSON.parse(session);
    const slugIdOfUser = parsedSession.slugId;
    if(alreadyExist){
      const parseddata = JSON.parse(alreadyExist);
      if(parseddata.roomToken!=roomToken){
        // iska mtlb user dusre room main join hona chah rhaa hain so we will make sure this thing don't happen
        return {status:HTTP_STATUS.CONFLICT, message:"Already in the room ", roomToken:parseddata.roomToken};
      }
    }
    else if(slugIdOfHost!==slugIdOfUser) await client.set(`participateSession-${userId}`, JSON.stringify({joinedAt: new Date(), roomToken:roomToken, socketId}), {EX:7200})

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
    return {status:'ok',
      token,
      wsUrl: LIVEKIT_URL,
    };

  } catch (error) {
    console.error('Token generation error:', (error as Error).message);
    return {status:HTTP_STATUS.INTERNAL_SERVER_ERROR,  error: 'Failed to generate token' };
  }
};

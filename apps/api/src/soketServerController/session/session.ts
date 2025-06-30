import { HTTP_STATUS } from "../../lib/types.js";
import { RedisClient } from "../../services/redis.js";
import crypto from 'crypto'


export const createToken = async (slugId:string, sessionId:string, socketId:string) => {
    try {
      const token = crypto.randomBytes(6).toString('base64url');
      const client = await RedisClient();
      // this is on going session for the studio when the user reconnects to the studio he should get the room token(token->sessionId+slugId) so that he can join the session again
      await client.set(`sessionToken-${token}`, JSON.stringify({ slugId, sessionId }));
      await client.set(`ongoingSession-${slugId}`, JSON.stringify({
        hostSocketId:socketId,
        roomToken: token,
        startedAt: new Date(),
        liveParticipants:[],
        wasParticipants:[],
      }), { EX: 7200 }); // ye 2 hours baad apne aap se khtm ho jayega session so either apan jab host nikalega session us time apan db main entry kr denge and if the session is closed by due to time limit fir kya kr skte hain?
      // host ka participate session redis main instanse nhi bna rhe as kb ongoing session ko kill krenge tb we can make direct entry in db from there only
      return { token };
    } catch (error) {
      console.error((error as Error));
    return {error}
    }
  };
  
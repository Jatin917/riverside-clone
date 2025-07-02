import { prisma } from "@repo/db";
import { HTTP_STATUS } from "../../lib/types.js";
import { RedisClient } from "../../services/redis.js";
import crypto from 'crypto'

  export const createSessionAndToken = async (slugId:string) => {
    try {
      if (!slugId) {
        return {status:HTTP_STATUS.NOT_FOUND,  message: "Missing slugId in request" };
      }
  
      const studio = await prisma.studio.findFirst({ where: { slugId } });
      if (!studio) {
        return {status:HTTP_STATUS.CONFLICT,  message: "No studio found" };
      }

  
      const session = await prisma.session.create({
        data: {
          studioId: studio.id,
          startedAt: new Date(),
          endedAt: new Date(), // For now default; needs update later
        },
      });
      await prisma.participantSession.create({
        data: {
          sessionId: session.id,
          userId: studio.ownerId,
          name: "Host",
          joinedAt: new Date(),
          leftAt: new Date(), // For now default; needs update later
        },
      });
      console.log("session created ", session.id);
      return {status:"ok", 
        message: "Successfully created session",
        session: {
          id: session.id,
          studioId: session.studioId,
          startedAt: session.startedAt,
        },
      };
    } catch (error) {
      console.error("CreateSession error:", (error as Error));
      return {status:HTTP_STATUS.INTERNAL_SERVER_ERROR,  message: "Internal server error" };
    }
  };
  
  export const createToken = async (slugId:string, sessionId:string, socketId:string) => {
    try {
      const token = crypto.randomBytes(6).toString('base64url');
      const client = await RedisClient();
      // this is on going session for the studio when the user reconnects to the studio he should get the room token(token->sessionId+slugId) so that he can join the session again
      await client.set(`sessionToken-${token}`, JSON.stringify({ slugId, sessionId }));
      await client.set(`ongoingSession-${slugId}`, JSON.stringify({
        socketId, 
        roomToken: token,
        startedAt: new Date(),
        liveParticipants:[],
        wasParticipants:[],
      }), { EX: 7200 }); // ye 2 hours baad apne aap se khtm ho jayega session so either apan jab host nikalega session us time apan db main entry kr denge and if the session is closed by due to time limit fir kya kr skte hain?
      // host ka participate session redis main instanse nhi bna rhe as kb ongoing session ko kill krenge tb we can make direct entry in db from there only
      return {status:"ok",  token };
    } catch (error) {
      console.error((error as Error));
      return { status:HTTP_STATUS.INTERNAL_SERVER_ERROR, message: "Internal server error" };
    }
  };

  export const onLeaveSession = async ({email, sessionToken:roomToken, socketId}:{email:string, sessionToken:string, socketId:string}) => {
    try {
      let isHost = false;
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        console.log("No user found with this email");
        return {error: "User not found"}
      }
  
      const userId = user.id;
      const participantsStudioDetails = await prisma.studio.findFirst({ where: { ownerId: String(userId) } });
  
      const client = await RedisClient();
      const session = await client.get(`sessionToken-${roomToken}`);
      if (!session) {
        return {error: "No Session found for this participant"}
      }
  
      const parsedData = JSON.parse(session);
      const date = new Date();
  
      const ongoingSession = await client.get(`ongoingSession-${parsedData.slugId}`);
      if (!ongoingSession) {
        return {error: "No Ongoing Session found for this participant"}
      }
  
      const parsedOngoingSession = JSON.parse(ongoingSession);
  
      // Update liveParticipants and wasParticipants
      parsedOngoingSession.wasParticipants = parsedOngoingSession.wasParticipants || [];
      parsedOngoingSession.liveParticipants = Array.isArray(parsedOngoingSession.liveParticipants)
        ? parsedOngoingSession.liveParticipants.filter((id: string | number) => String(id) !== String(userId))
        : [];
  
      if (!parsedOngoingSession.wasParticipants.includes(userId)) {
        parsedOngoingSession.wasParticipants.push(userId);
      }
  
      // Save updated ongoing session
      await client.set(`ongoingSession-${parsedData.slugId}`, JSON.stringify(parsedOngoingSession));
      if(!participantsStudioDetails) {
        await client.del(`participateSession-${userId}`);
      }
      else if (parsedData.slugId === participantsStudioDetails.slugId) {
        const allParticipants = [
          ...(parsedOngoingSession.liveParticipants || []),
          ...(parsedOngoingSession.wasParticipants || [])
        ];
  
        const sessionId = parsedData.sessionId;
        const startedAt = parsedOngoingSession.startedAt ? new Date(parsedOngoingSession.startedAt) : undefined;
        const name = user.name
        // Upsert participant sessions
        await Promise.all(
          allParticipants.map(async (userId) => {
            const existing = await prisma.participantSession.findFirst({
              where: { userId: String(userId), sessionId }
            });
            await client.del(`participateSession-${userId}`);
            if (existing) {
              await prisma.participantSession.update({
                where: { id: existing.id },
                data: { leftAt: new Date() }
              });
            } else {
              await prisma.participantSession.create({
                data: {
                  userId: String(userId),
                  sessionId,
                  joinedAt: startedAt,
                  leftAt: new Date(),
                  name
                }
              });
            }
          })
        );
  
        // Update session metadata
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            startedAt,
            endedAt: new Date()
          }
        });
        isHost = true;
        await client.del(`ongoingSession-${parsedData.slugId}`);
        await client.del(`sessionToken-${roomToken}`);
      }

      const participateSession = await client.get(`participateSession-${userId}`);
      if (!isHost && !participateSession) {
        return {error: "No Participate Session found for this participant"}
      }
      const parsedParticipantSessionData = JSON.parse(participateSession as string);

      // Ensure a participant session record exists (idempotent backup)
      const exist = await prisma.participantSession.findFirst({
        where: {
          userId: String(userId),
          sessionId: parsedData.sessionId
        }
      });
  
      if (!exist) {
        await prisma.participantSession.create({
          data: {
            sessionId: parsedData.sessionId,
            userId: String(userId),
            joinedAt: !isHost ? new Date(parsedParticipantSessionData.joinedAt) : new Date(parsedOngoingSession.startedAt),
            leftAt: date,
            name: user.name,
          }
        });
      }
  
  
      return {status: HTTP_STATUS.CREATED,isHost,name:user.name, message: "Successfully left the session"}
  
    } catch (error) {
      console.error("Error in onLeaveSession:", error);
      return {error: "Internal server error"}
    }
  };
  
  
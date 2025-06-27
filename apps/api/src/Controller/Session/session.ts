import { prisma } from "@repo/db";
import { HTTP_STATUS } from "../../lib/types.js";
import crypto from 'crypto';
import { Request, Response } from "express";
import { RedisClient } from "../../services/redis.js";
import { error } from "console";

export const createSession = async (req: Request, res: Response) => {
  try {
    const slugId = req.body?.slugId as string;
    if (!slugId) {
      return res.status(400).json({ message: "Missing slugId in request" });
    }

    const studio = await prisma.studio.findFirst({ where: { slugId } });
    if (!studio) {
      return res.status(404).json({ message: "No studio found" });
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

    return res.status(201).json({
      message: "Successfully created session",
      session: {
        id: session.id,
        studioId: session.studioId,
        startedAt: session.startedAt,
      },
    });
  } catch (error) {
    console.error("CreateSession error:", (error as Error));
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createToken = async (req: Request, res: Response) => {
  try {
    const { slugId, sessionId } = req.body as { slugId: string; sessionId: string };
    const token = crypto.randomBytes(6).toString('base64url');
    const client = await RedisClient();
    // this is on going session for the studio when the user reconnects to the studio he should get the room token(token->sessionId+slugId) so that he can join the session again
    await client.set(`sessionToken-${token}`, JSON.stringify({ slugId, sessionId }));
    await client.set(`ongoingSession-${slugId}`, JSON.stringify({
      roomToken: token,
      startedAt: new Date(),
      liveParticipants:[],
      wasParticipants:[],
    }), { EX: 7200 }); // ye 2 hours baad apne aap se khtm ho jayega session so either apan jab host nikalega session us time apan db main entry kr denge and if the session is closed by due to time limit fir kya kr skte hain?
    // host ka participate session redis main instanse nhi bna rhe as kb ongoing session ko kill krenge tb we can make direct entry in db from there only
    return res.status(HTTP_STATUS.OK).json({ token });
  } catch (error) {
    console.error((error as Error));
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
};

export const getSessionToken = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const client = await RedisClient();
    let data = await client.get(`sessionToken-${token}`);
    data = JSON.parse(data as string);
    if (!data) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "No data found for this token" });
    }
    return res.status(HTTP_STATUS.OK).json({ data });
  } catch (error) {
    console.error((error as Error));
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
};


export const getOngoingSession = async (req: Request, res: Response) => {
  try {
    const client = await RedisClient();
    const slugId = req.query.slugId as string;
    const session = await client.get(`ongoingSession-${slugId}`);
    if(!session){
      throw error("session doesn't exist in redis");
      return;
    }
    const parsedSessionData = await JSON.parse(session as string);
    return res.status(HTTP_STATUS.OK).json({ roomToken:parsedSessionData.roomToken });
  } catch (error) {
    console.error((error as Error));
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
}

export const onLeaveSession = async (req: Request, res: Response) => {
  try {
    const { email, sessionToken:roomToken } = req.body;

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      console.log("No user found with this email");
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    }

    const userId = user.id;
    const participantsStudioDetails = await prisma.studio.findFirst({ where: { ownerId: String(userId) } });

    const client = await RedisClient();
    const participateSession = await client.get(`participateSession-${userId}`);
    if (!participateSession) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "No Participate Session found for this participant" });
    }
    const session = await client.get(`sessionToken-${roomToken}`);
    if (!session) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "No Session found for this participant" });
    }

    const parsedData = JSON.parse(session);
    const parsedSessionData = JSON.parse(participateSession);
    const date = new Date();

    const ongoingSession = await client.get(`ongoingSession-${parsedData.slugId}`);
    if (!ongoingSession) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "No Ongoing Session found for this participant" });
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
      const name = parsedOngoingSession.name || "unknown"
      // Upsert participant sessions
      await Promise.all(
        allParticipants.map(async (userId) => {
          const existing = await prisma.participantSession.findFirst({
            where: { userId: String(userId), sessionId }
          });

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

      await client.del(`ongoingSession-${parsedData.slugId}`);
      await client.del(`sessionToken-${roomToken}`);
    }

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
          joinedAt: parsedSessionData.joinedAt ? new Date(parsedSessionData.joinedAt) : undefined,
          leftAt: date,
          name: parsedSessionData.name || 'Unknown',
        }
      });
    }

    return res.status(HTTP_STATUS.CREATED).json({ message: "Successfully left the session" });

  } catch (error) {
    console.error("Error in onLeaveSession:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
};


export const addToLiveParticipants = async (req: Request, res: Response) => {
  try {
    const { email, roomToken } = req.body;
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      console.log("User doesn't exist with this email");
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    }

    const userId = user.id;
    const participantsStudioDetails = await prisma.user.findFirst({where:{id:userId}, include:{Studio:{select:{slugId:true}}}})
    let userSlugId: string|null = null;
    if(participantsStudioDetails && participantsStudioDetails.Studio?.slugId){
      userSlugId = participantsStudioDetails.Studio.slugId;
    }

    const client = await RedisClient();

    const sessionDetail = await client.get(`sessionToken-${roomToken}`);
    if (!sessionDetail) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "No Session Exist" });
    }

    const parsedSessionDetails = JSON.parse(sessionDetail);
    const slugIdOfHost = parsedSessionDetails.slugId;

    const ongoingSession = await client.get(`ongoingSession-${slugIdOfHost}`);
    if (!ongoingSession) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "No Ongoing Session Exist" });
    }

    const parsedOngoingSession = JSON.parse(ongoingSession);

    if(userSlugId!==slugIdOfHost && !parsedOngoingSession.liveParticipants.includes(userId)){
        parsedOngoingSession.wasParticipants = parsedOngoingSession.wasParticipants.filter(
          (id: string) => id !== userId
        );
      parsedOngoingSession.liveParticipants.push(userId);  // assuming the key is liveParticipants
    } 
    await client.set(`ongoingSession-${slugIdOfHost}`, JSON.stringify(parsedOngoingSession));

    return res.status(HTTP_STATUS.CREATED).json({ message: "Added Live Participants" });
  } catch (error) {
    console.error("Error in addToLiveParticipants:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
}

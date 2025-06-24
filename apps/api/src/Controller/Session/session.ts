import { prisma } from "@repo/db";
import { HTTP_STATUS } from "../../lib/types";
import crypto from 'crypto';
import { Request, Response } from "express";
import { RedisClient } from "../../services/redis";
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
    console.error("CreateSession error:", (error as Error).message);
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
    console.error((error as Error).message);
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
    console.error((error as Error).message);
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
    console.error((error as Error).message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
}

export const onLeaveSession = async (req:Request, res:Response) =>{
  try {
    const {userId, roomToken} = req.body;
    const participantsStudioDetails = await prisma.studio.findFirst({where:{ownerId:String(userId)}});
    if(!participantsStudioDetails){
      console.log("participants with this user don't exist");
      return;
    }
    const client = await RedisClient();
    const participateSession = await client.get(`participateSession-${userId}`);
    if(!participateSession){
      console.error("participate session dont exist in redis for ", userId);
      return;
    }
    const session = await client.get(`sessionToken-${roomToken}`);
    if(!session){
      console.error("session don't exist");
      return;
    }
    const parsedData = await JSON.parse(session);
    const date = new Date();
    const parsedSessionData = await JSON.parse(participateSession);
    const ongoingSession = await client.get(`ongoingSession-${parsedData.slugId}`);
    if(!ongoingSession){
      console.log("on going session don't exist");
      return;
    }
    const parsedOngoingSession = JSON.parse(ongoingSession);
    parsedOngoingSession.wasParticipants.push(userId);
    parsedOngoingSession.liveParticipants = Array.isArray(parsedOngoingSession.liveParticipants)
      ? parsedOngoingSession.liveParticipants.filter((id: string | number) => String(id) !== String(userId))
      : [];
    await client.set(`ongoingSession-${parsedData.slugId}`, JSON.stringify(parsedOngoingSession));
    if(parsedData.slugId===participantsStudioDetails.slugId){
      let totalParticipants = parsedOngoingSession.liveParticipants
      totalParticipants=[...totalParticipants, parsedOngoingSession.wasParticipants];
      const startedAt = parsedOngoingSession.startedAt;
      const sessionId = parsedData.sessionId;
      await prisma.session.update({where:{id:sessionId}, data:{startedAt:startedAt, endedAt:new Date(), ParticipantSession:totalParticipants}});
      client.del(`ongoingSession-${parsedData.slugId}`);
    }
    else await client.del(`participateSession-${userId}`);
    await prisma.participantSession.create({
      data: {
        sessionId: parsedData.sessionId,
        userId: String(userId),
        joinedAt: parsedSessionData.joinedAt ? new Date(parsedSessionData.joinedAt) : undefined,
        leftAt: date,
        name: parsedSessionData.name || undefined,
        session: { connect: { id: parsedData.sessionId } },
        user: { connect: { id: String(userId) } }
      }
    });
    return res.status(HTTP_STATUS.CREATED).json({ message: "Created Participate Session" });
  } catch (error) {
    
  }
}
import { prisma } from "@repo/db";
import { HTTP_STATUS } from "../../lib/types";
import crypto from 'crypto';
import { Request, Response } from "express";
import { RedisClient } from "../../services/redis";

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
    await client.set(`ongoingSession:${slugId}`, JSON.stringify({
      roomToken: token,
    }));

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
    const session = await client.get(`ongoingSession:${slugId}`);
    return res.status(HTTP_STATUS.OK).json({ session });
  } catch (error) {
    console.error((error as Error).message);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
}
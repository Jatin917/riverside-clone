import { prisma } from "@repo/db";
import { HTTP_STATUS } from "../../lib/types";
import crypto from 'crypto'
import { sessionMap } from "../../server";
import { error } from "console";

export const createSession = async (req, res) => {
  try {
    const slugId = req.body?.slugId;
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
        endedAt: new Date() // abhi ke liye default kr diya hain changes krna padegea
      },
    });

    await prisma.participantSession.create({
      data: {
        sessionId: session.id,
        userId: studio.ownerId,
        name: "Host", // or studio.owner.name
        leftAt:new Date(), // abhi ke liye default kr diya hain changes krna padegea
        joinedAt: new Date(),
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


export const createToken = async (req, res) =>{
    try {
    const {slugId, sessionId} = req.body;
    const token = crypto.randomBytes(6).toString('base64url');
    sessionMap.set(token, {slugId, sessionId});
    return res.status(HTTP_STATUS.OK).json({token});
    } catch (error) {
        console.log((error as Error).message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
}

export const getSessionToken = async (req, res) =>{
    try {
        const token = req.query.token;
        const data = sessionMap.get(token);
        if(!data){
            throw Error("No data Found for this token");
            // return res.status(HTTP_STATUS.BAD_REQUEST).json({message:e});
        }
    } catch (error) {
        console.log((error as Error).message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
} 
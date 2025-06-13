import { prisma } from "@repo/db";
import { HTTP_STATUS } from "../../lib/types";
import crypto from 'crypto'
import { sessionMap } from "../../server";
import { error } from "console";

export const createSession =async (req, res) =>{
    try {
        const slugId = req.body.slugId;
        const studio = await prisma.studio.findFirst({where:{slugId}});
        if(!studio){
            return res.status(HTTP_STATUS.NOT_FOUND).json({message:"NO Studio Found"});
        }
        const session = await prisma.session.create({data:{studioId:studio.id, hostId:studio.ownerId }});
        if(!session){
            return res.status(HTTP_STATUS.NOT_FOUND).json({message:"NO Studio Found"});
        }
        return res.status(HTTP_STATUS.CREATED).json({message:"Successfully created session", sessionId:session.id})
    } catch (error) {
        console.log((error as Error).message);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
}

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
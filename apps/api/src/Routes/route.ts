import { Router } from "express";
import { tokenGeneration } from "../Controller/tokenGeneration";
import { getStudio } from '../Controller/Studio/studio'
import { createSession, createToken, getSessionToken } from '../Controller/Session/session'

export const router = Router();

router.post('/livekit-token', tokenGeneration);
router.get('/studio', getStudio);
router.post('/session', createSession);
router.post('/session-token', createToken);
router.get('/session-token', getSessionToken);
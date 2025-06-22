import { Router } from "express";
import { tokenGeneration } from "../Controller/tokenGeneration";
import { getStudio } from '../Controller/Studio/studio';
import { createSession, createToken, getSessionToken, getOngoingSession } from '../Controller/Session/session';

const router = Router();

// Routes
// @ts-ignore
router.post('/livekit-token', tokenGeneration);
// @ts-ignore
router.get('/studio', getStudio);
// @ts-ignore
router.post('/session', createSession);
// @ts-ignore
router.post('/session-token', createToken);
// @ts-ignore
router.get('/session-token', getSessionToken);
// @ts-ignore
router.get('/ongoing-session', getOngoingSession);

export default router;

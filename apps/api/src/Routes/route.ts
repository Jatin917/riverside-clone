import { Router } from "express";
import { tokenGeneration } from "../Controller/tokenGeneration.js";
import { getStudio } from '../Controller/Studio/studio.js';
import { createSession, createToken, getSessionToken, getOngoingSession, onLeaveSession, addToLiveParticipants } from '../Controller/Session/session.js';

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
// abhi tak is route ko kisine use nhi kiya hain
router.get('/session-token', getSessionToken);
// @ts-ignore
router.get('/ongoing-session', getOngoingSession);
// @ts-ignore
router.post('/leave-session', onLeaveSession);
// @ts-ignore
router.post('/add-to-liveParticipant', addToLiveParticipants);

export default router;

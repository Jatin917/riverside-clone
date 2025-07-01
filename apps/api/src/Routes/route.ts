import { Router } from "express";
import { getStudio } from '../Controller/Studio/studio.js';
import { createToken, getSessionToken, getOngoingSession, addToLiveParticipants } from '../Controller/Session/session.js';

const router = Router();

// Routes
// @ts-ignore
router.get('/studio', getStudio);
// @ts-ignore
router.post('/session-token', createToken);
// @ts-ignore
// abhi tak is route ko kisine use nhi kiya hain
router.get('/session-token', getSessionToken);
// @ts-ignore
router.get('/ongoing-session', getOngoingSession);
// @ts-ignore
router.post('/add-to-liveParticipant', addToLiveParticipants);

export default router;

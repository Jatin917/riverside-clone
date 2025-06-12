import { Router } from "express";
import { tokenGeneration } from "../Controller/tokenGeneration";
import { getStudio } from '../Controller/Studio/studio'

export const router = Router();

router.post('/token', tokenGeneration);
router.get('/studio', getStudio);
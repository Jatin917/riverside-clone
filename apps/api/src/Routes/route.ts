import { Router } from "express";
import { tokenGeneration } from "../Controller/tokenGeneration";

export const router = Router();

router.post('/token', tokenGeneration);
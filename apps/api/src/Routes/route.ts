import { Router } from "express";

const route = Router();

route.post('/token', tokenGeneration);
// src/app.ts
import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { socketHandler } from './wss-server';
import router  from './Routes/route';


dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
export const API_KEY = process.env.LIVEKIT_API_KEY
export const API_SECRET = process.env.LIVEKIT_API_SECRET
export const LIVEKIT_URL = process.env.LIVEKIT_URL;
const PORT = process.env.PORT || 3001;
// export const sessionMap = new Map();

app.use('/api', router);
socketHandler(io);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
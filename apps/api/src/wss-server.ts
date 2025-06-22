// src/socket-handler.ts
import { Server, Socket } from "socket.io";

export const socketHandler = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    
  });
};
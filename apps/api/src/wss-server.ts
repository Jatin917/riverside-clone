// src/socket-handler.ts
import { Server, Socket } from "socket.io";
import { createToken } from "./soketServerController/session/session.js";
import { tokenGeneration } from "./soketServerController/livekit-token.ts/tokenGeneration.js";

export const socketHandler = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    // session create kr rhe hain then this socket belongs to the host means host ne signal bheja hain that this is me as host so isko host session main store kr lete hain
    const socketId = socket.id;
    socket.on("create-session", async({slugId, sessionId})=>{
      const response = await createToken(slugId, sessionId, socketId);
      if(response.token){
        socket.emit('session-created', {sessionToken:response.token});
      }
      socket.emit('session-creation-failed');
    });
    socket.on('create-livekit-token', async(token, email, metadata)=>{
      const respone = await tokenGeneration({token, email, metadata, socketId});
    })



    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    
  });
};
// src/socket-handler.ts
import { Server, Socket } from "socket.io";
import { createToken, onLeaveSession } from "./soketServerController/session/session.js";
import { tokenGeneration } from "./soketServerController/livekit-token.ts/tokenGeneration.js";

export const socketHandler = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    // session create kr rhe hain then this socket belongs to the host means host ne signal bheja hain that this is me as host so isko host session main store kr lete hain
    const socketId = socket.id;
    let roomId:(string | null) = null;
    socket.on("create-session", async({slugId, sessionId})=>{
      const response = await createToken(slugId, sessionId, socketId);
      if(response.token){
        roomId = response.token as string;
        socket.emit(JSON.stringify({message:'session-created', sessionToken:response.token}));
        socket.join(roomId);
        return;
      }
      socket.emit(JSON.stringify({message:'session-creation-failed', error:response.error}));
      return;
    });
    socket.on('create-livekit-token', async(token, email, metadata)=>{
      // jo ye token aa rhi hain woh session/room token hain 
      const response = await tokenGeneration({token, email, metadata, socketId});
      roomId = token as string;
      // response.token is livekit token
      if(response.token){
        socket.join(roomId);
        socket.emit(JSON.stringify(response));
        return;
      }
      socket.emit(JSON.stringify({message:'token-generation-failed', error:response.error}));
      return;
    });

    socket.on("leave-session", async (email:string, sessionToken:string)=>{
      const response = await onLeaveSession({email, sessionToken, socketId});
      roomId = sessionToken;
      if(response.isHost){
        // yha par host left session so we need to emit the message to all the participants that host left the session
        socket.to(roomId).emit(JSON.stringify({message:'host-left-session', isHost:response.isHost, name:response.name}));
        // then we are making everyone leaves the room
        const clients = await io.in(roomId).fetchSockets();
        clients.forEach(s => s.leave(roomId as string));
      }
      socket.to(roomId).emit(JSON.stringify({message:'host-left-session', isHost:response.isHost, name:response.name}));
      return;
    })



    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    
  });
};
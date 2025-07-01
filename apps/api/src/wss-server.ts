// src/socket-handler.ts
import { Server, Socket } from "socket.io";
import { createToken, onLeaveSession } from "./soketServerController/session/session.js";
import { tokenGeneration } from "./soketServerController/livekit-token.ts/tokenGeneration.js";
import { error } from "console";

export const socketHandler = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    // session create kr rhe hain then this socket belongs to the host means host ne signal bheja hain that this is me as host so isko host session main store kr lete hain
    const socketId = socket.id;
    let roomId:(string | null) = null;
    socket.on("create-session", async({slugId, sessionId}, callback)=>{
      const response = await createToken(slugId, sessionId, socketId);
      if(response.token){
        roomId = response.token as string;
        callback({status:'ok', message:'session-created', sessionToken:response.token});
        socket.join(roomId);
        return;
      }
      callback({status:'error', message:'session-creation-failed', error:response.error});
      return;
    });
    socket.on('create-livekit-token', async({token, email, isStreamer:metadata}, callback)=>{
      // jo ye token aa rhi hain woh session/room token hain 
      const response = await tokenGeneration({token, email, metadata, socketId});
      roomId = token as string;
      // response.token is livekit token
      if(response.token){
        socket.join(roomId);
        callback(response);
        return;
      }
      callback({status:409, message:'token-generation-failed', error:response.error});
      return;
    });

    socket.on("leave-session", async ({ email, sessionToken }: { email: string, sessionToken: string }, callback) => {
      const response = await onLeaveSession({ email, sessionToken, socketId: socket.id });
      const roomId = sessionToken;
      if(response.error){
        callback({error:"problem in leaving session"});
        return;
      }
      console.log("leave session ", response)
      if (response.isHost) {
        // Host left — notify all participants
        socket.to(roomId).emit("session-ended", {
          message: "host-left-session",
          isHost: response.isHost,
          name: response.name,
        });
    
        // Make everyone leave the room
        const clients = await io.in(roomId).fetchSockets();
        clients.forEach(s => s.leave(roomId));
        return;
      }
    
      // Send ack back to the sender
      socket.to(roomId).emit('leave-session', {
        message:"left-session", 
        name:response.name
      })
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    
  });
};
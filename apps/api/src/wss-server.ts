// src/socket-handler.ts
import { Server, Socket } from "socket.io";
import { createSessionAndToken, createToken, onLeaveSession } from "./soketServerController/session/session.js";
import { tokenGeneration } from "./soketServerController/livekit-token.ts/tokenGeneration.js";
import { error } from "console";
import { callbackify } from "util";

export const socketHandler = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    // session create kr rhe hain then this socket belongs to the host means host ne signal bheja hain that this is me as host so isko host session main store kr lete hain
    const socketId = socket.id;
    let roomId:(string | null) = null;
    socket.on("create-session", async({slugId}, callback)=>{
      const response = await createSessionAndToken(slugId);
      if(response.session){
        callback(response);
        return;
      }
      callback(response);
      return;
    });
    socket.on("create-session-token", async({slugId, sessionId}, callback)=>{
      const response = await createToken(slugId, sessionId, socketId);
      if(response.token){
        callback({status:"ok", message:"token created", token:response.token});
        return;
      }
      callback({status:"error", message:"error in session creation"});
      return;
    })
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
          status:"ok",
          message: "host-left-session",
          isHost: response.isHost,
          name: response.name,
        });
    
        // Make everyone leave the room
        const clients = await io.in(roomId).fetchSockets();
        clients.forEach(s => s.leave(roomId));
        callback({status:"ok", message:"left-session"});
        return;
      }
    
      // Send ack back to the sender
      socket.to(roomId).emit('leave-session', {
        status:"ok", 
        message:"left-session", 
        name:response.name
      })
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    
  });
};
import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({port:8080});
const users :{[key:number]:{[key:number]:WebSocket}} = {}

console.log("WebSocket server started on port 8080");

wss.on('connection', (ws:WebSocket)=>{
    console.log("New WebSocket connection established");
    
    ws.on('error', console.error);

    ws.on('message', async (data:any)=>{
        const message = JSON.parse(data);
        console.log(`Received message type: ${message.type}`);
        
        if(message.type==='join-room'){
            console.log(`User ${message.userId} joining room ${message.roomId}`);
            const roomId = Number(message.roomId);
            const userId = Number(message.userId);
            
            if (!users[roomId]) {
                users[roomId] = {};
            }
            
            const sizeBefore = Object.keys(users[roomId]).length;
            users[roomId][userId] = ws;
            
            console.log(`Room ${roomId} now has ${Object.keys(users[roomId]).length} users`);
            
            if(sizeBefore > 0){
                const otherUsersId = Object.keys(users[roomId]).filter((id)=>Number(id)!=userId);
                console.log(`Notifying ${otherUsersId.length} other users about new join`);
                
                await Promise.all(otherUsersId.map(id => {
                    try {
                        users[roomId][Number(id)].send(JSON.stringify({
                            type: 'userJoined', 
                            userId: userId,
                            roomId: roomId
                        }));
                    } catch (error) {
                        console.error(`Error notifying user ${id}:`, error);
                    }
                }));
            }
            
            // Send confirmation to the user who joined
            try {
                users[roomId][userId]?.send(JSON.stringify({
                    type: "joinedRoom",
                    roomId: roomId,
                    userId: userId,
                    totalUsers: Object.keys(users[roomId]).length
                }));
            } catch (error) {
                console.error(`Error sending join confirmation to user ${userId}:`, error);
            }
        }
        // Handle connection request
        else if(message.type === 'connectionRequest'){
            console.log(`Connection request from user ${message.fromUserId} to user ${message.toUserId} in room ${message.roomId}`);
            const fromUserId = Number(message.fromUserId);
            const toUserId = Number(message.toUserId);
            const roomId = Number(message.roomId);
            
            // Check if target user exists in the room
            if(!users[roomId] || !users[roomId][toUserId]){
                console.log(`User ${toUserId} not found in room ${roomId}`);
                // Send error back to requester
                try {
                    users[roomId]?.[fromUserId]?.send(JSON.stringify({
                        type: 'connectionError',
                        message: `User ${toUserId} not found or offline`,
                        roomId: roomId
                    }));
                } catch (error) {
                    console.error(`Error sending connection error to user ${fromUserId}:`, error);
                }
                return;
            }
            
            // Forward connection request to target user
            try {
                users[roomId][toUserId].send(JSON.stringify({
                    type: 'connectionRequest',
                    fromUserId: fromUserId,
                    fromUserName: message.fromUserName || `User ${fromUserId}`,
                    roomId: roomId
                }));
                console.log(`Connection request forwarded to user ${toUserId}`);
            } catch (error) {
                console.error(`Error forwarding connection request to user ${toUserId}:`, error);
            }
        }
        // Handle connection response (accept/decline)
        else if(message.type === 'connectionResponse'){
            console.log(`Connection response: ${message.accepted ? 'accepted' : 'declined'} from user ${message.fromUserId} to user ${message.toUserId}`);
            const fromUserId = Number(message.fromUserId);
            const toUserId = Number(message.toUserId);
            const roomId = Number(message.roomId);
            
            // Check if original requester still exists
            if(!users[roomId] || !users[roomId][toUserId]){
                console.log(`Original requester ${toUserId} not found`);
                return;
            }
            
            // Forward response to original requester
            try {
                users[roomId][toUserId].send(JSON.stringify({
                    type: 'connectionResponse',
                    accepted: message.accepted,
                    fromUserId: fromUserId,
                    roomId: roomId
                }));
                
                // If accepted, initiate WebRTC signaling
                if(message.accepted){
                    console.log("Connection accepted, starting WebRTC signaling");
                    // Tell the original requester to create an offer
                    users[roomId][toUserId].send(JSON.stringify({
                        type: 'serverAskToCreateOffer',
                        senderId: toUserId,
                        recieverId: fromUserId,
                        roomId: roomId
                    }));
                }
                
                console.log(`Connection response forwarded to user ${toUserId}`);
            } catch (error) {
                console.error(`Error forwarding connection response to user ${toUserId}:`, error);
            }
        }
        else if(message.type==="connect"){
            console.log(`Direct connect request: user ${message.senderId} wants to connect with user ${message.recieverId}`);
            const senderId = message.senderId;
            const recieverId = message.recieverId;
            const roomId = message.roomId;
            
            if(!users[Number(roomId)][Number(senderId)] || !users[Number(roomId)][Number(recieverId)]){
                console.log("One or both users not found for direct connect");
                return;
            }
            
            try {
                users[roomId][senderId].send(JSON.stringify({
                    type:"serverAskToCreateOffer", 
                    senderId, 
                    recieverId, 
                    roomId
                }));
                console.log(`Direct connect offer request sent to user ${senderId}`);
            } catch (error) {
                console.error(`Error sending direct connect request to user ${senderId}:`, error);
            }
        }
        else if(message.type==="createOffer"){
            console.log(`Offer received from user ${message.senderId} to user ${message.recieverId}`);
            const senderId = message.senderId;
            const recieverId = message.recieverId;
            const roomId = message.roomId;
            
            if(!users[roomId] || !users[roomId][recieverId]){
                console.log(`Receiver ${recieverId} not found for offer`);
                return;
            }
            
            try {
                users[roomId][recieverId].send(JSON.stringify({
                    type: 'createOffer',
                    sdp: message.sdp,
                    recieverId,
                    senderId,
                    roomId
                }));
                console.log(`Offer forwarded to user ${recieverId}`);
            } catch (error) {
                console.error(`Error forwarding offer to user ${recieverId}:`, error);
            }
        }
        else if (message.type === 'createAnswer') {
            console.log(`Answer received from user ${message.senderId} to user ${message.recieverId}`);
            const senderId = message.senderId;
            const recieverId = message.recieverId;
            const roomId = message.roomId;
            
            if(!users[roomId] || !users[roomId][recieverId]){
                console.log(`Receiver ${recieverId} not found for answer`);
                return;
            }
            
            try {
                users[roomId][recieverId].send(JSON.stringify({
                    type: 'createAnswer',
                    sdp: message.sdp,
                    recieverId,
                    senderId,
                    roomId
                }));
                console.log(`Answer forwarded to user ${recieverId}`);
            } catch (error) {
                console.error(`Error forwarding answer to user ${recieverId}:`, error);
            }
        } 
        else if (message.type === 'iceCandidate') {
            console.log(`ICE candidate received from user ${message.senderId} to user ${message.recieverId}`);
            const senderId = message.senderId;
            const recieverId = message.recieverId;
            const roomId = message.roomId;
            
            if(!users[roomId]){
                console.log(`Room ${roomId} not found for ICE candidate`);
                return;
            }
            
            // Forward ICE candidate to the intended recipient
            if(users[roomId][recieverId]){
                try {
                    users[roomId][recieverId].send(JSON.stringify({
                        type: 'iceCandidate',
                        candidate: message.candidate,
                        senderId: senderId,
                        recieverId: recieverId,
                        roomId: roomId
                    }));
                    console.log(`ICE candidate forwarded from user ${senderId} to user ${recieverId}`);
                } catch (error) {
                    console.error(`Error forwarding ICE candidate to user ${recieverId}:`, error);
                }
            } else {
                console.log(`Receiver ${recieverId} not found for ICE candidate`);
            }
        }
    })

    // Handle user disconnection
    ws.on('close', () => {
        console.log('WebSocket connection closed');
        
        // Find and remove the user from all rooms
        for (const roomId in users) {
            for (const userId in users[roomId]) {
                if (users[roomId][userId] === ws) {
                    console.log(`User ${userId} left room ${roomId}`);
                    delete users[roomId][userId];
                    
                    // Notify other users in the room about the disconnection
                    const remainingUsers = Object.keys(users[roomId]);
                    console.log(`Notifying ${remainingUsers.length} remaining users about disconnection`);
                    
                    remainingUsers.forEach(otherUserId => {
                        try {
                            users[roomId][Number(otherUserId)].send(JSON.stringify({
                                type: 'userLeft',
                                userId: userId,
                                roomId: roomId,
                                remainingUsers: remainingUsers.length
                            }));
                        } catch (error) {
                            console.error(`Error notifying user ${otherUserId} about disconnection:`, error);
                        }
                    });
                    
                    // Clean up empty rooms
                    if (remainingUsers.length === 0) {
                        console.log(`Room ${roomId} is now empty, cleaning up`);
                        delete users[roomId];
                    }
                    
                    return; // Exit after finding the user
                }
            }
        }
    });
})

console.log("WebRTC signaling server is running and ready for connections...");
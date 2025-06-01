import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({port:8080});
const users :{[key:number]:{[key:number]:WebSocket}} = {}

wss.on('connection', (ws:WebSocket)=>{
    ws.on('error', console.error);

    ws.on('message', async (data:any)=>{
        const message = JSON.parse(data);
        if(message.type==='join-room'){
            console.log("join room");
            const roomId = Number(message.roomId);
            const userId = Number(message.userId);
            if (!users[roomId]) {
                users[roomId] = {};
            }
            const size = Object.keys(users[roomId]).length;
            console.log("users is", users);
            users[roomId][userId] = ws;
            console.log("updated users is", users);
            if(size>0){
                const otherUsersId = Object.keys(users[roomId]).filter((id)=>Number(id)!=userId);
                await Promise.all(otherUsersId.map(id=>users[roomId][Number(id)].send(JSON.stringify({type:`${id} has joined`}))));
            }
            users[roomId][userId]?.send(JSON.stringify({type:"Joined Room"}));
        }
        else if(message.type==="connect"){
            console.log("user ", message.senderId, "want to connect with user ", message.recieverId);
            const senderId = message.senderId;
            const recieverId = message.recieverId;
            const roomId = message.roomId;
            if(!users[Number(roomId)][Number(senderId)] || !users[Number(roomId)][Number(recieverId)]){
                console.log("No users found ")
                return;
            }
            users[roomId][senderId].send(JSON.stringify({type:"serverAskToCreateOffer", senderId, recieverId, roomId}));
        }
        else if(message.type==="createOffer"){
            console.log("offer created")
            const senderId = message.senderId;
            const recieverId = message.recieverId;
            const roomId = message.roomId;
            console.log("offer aa gya server prr")
            users[roomId][recieverId]?.send(JSON.stringify({
                type: 'createOffer',
                sdp: message.sdp,
                recieverId,
                senderId,
                roomId
            }));
        }
        else if (message.type === 'createAnswer') {
            console.log("answer created")
            const senderId = message.senderId;
            const recieverId = message.recieverId;
            const roomId = message.roomId;
            console.log("offer aa gya reciever prr")
            users[roomId][recieverId]?.send(JSON.stringify({
                type: 'createAnswer',
                sdp: message.sdp,
                recieverId,
                senderId,
                roomId
            }));
        } 
        else if (message.type === 'iceCandidate') {
            const senderId = message.senderId;
            const recieverId = message.recieverId;
            const roomId = message.roomId;
            console.log("ice candidate aa gya server pr")
            if (ws === users[roomId][senderId]) {
                console.log("reciever ko bhej diya ice candidate")
                users[roomId][recieverId]?.send(JSON.stringify({
                type: 'iceCandidate',
                candidate: message.candidate,
                roomId, senderId, recieverId
                }));
            } else if (ws === users[roomId][recieverId]) {
                console.log("sender ko bhej diya ice candidate")
                users[roomId][senderId]?.send(JSON.stringify({
                type: 'iceCandidate',
                candidate: message.candidate,
                recieverId, senderId, roomId
                }));
            }
        }
    })
})
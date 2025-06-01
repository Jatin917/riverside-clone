"use client";

import { useParams } from 'next/navigation';
import React, { useEffect, useRef } from 'react';

const Page = () => {
    const params = useParams();
    const {roomId, userId} = params;
    const socketRef = useRef<WebSocket | null>(null);
    const myVideoRef = useRef<HTMLVideoElement | null>(null);
    const userVideoRef = useRef<HTMLVideoElement | null>(null);
    const peerConnections = useRef<{ [key: number]: { [key: number]: RTCPeerConnection } }>({});
    const streamRef = useRef<MediaStream | null>(null);
    
    if (!peerConnections.current[Number(roomId)]) {
        peerConnections.current[Number(roomId)] = {};
    }

    const createPeerConnection = (peerId: number) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        // Add local tracks if stream is available
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, streamRef.current!);
            });
        }

        // Handle remote tracks
        pc.ontrack = event => {
            console.log("Received remote track from peer:", peerId);
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = event => {
            console.log("ICE candidate generated for peer:", peerId);
            if (event.candidate) {
                socketRef.current?.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate,
                    recieverId: peerId,
                    senderId: Number(userId),
                    roomId
                }));
            }
        };

        // Store the peer connection
        peerConnections.current[Number(roomId)][peerId] = pc;
        return pc;
    };

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        socketRef.current = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'join-room', roomId, userId }));
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'serverAskToCreateOffer') {
                console.log("Server asks to create offer");
                const senderId = message.senderId;
                const recieverId = message.recieverId;
                
                if(senderId != userId){
                    console.log("Not same user id", senderId, userId);
                    return;
                } 

                let pc = peerConnections.current[Number(roomId)][Number(recieverId)];
                if (!pc) {
                    pc = createPeerConnection(Number(recieverId));
                }

                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    console.log("Sending offer");
                    socketRef.current?.send(JSON.stringify({
                        type: "createOffer",
                        sdp: offer,
                        senderId,
                        recieverId,
                        roomId
                    }));
                } catch (error) {
                    console.error("Error creating offer:", error);
                }
            }
            else if (message.type === 'createOffer') {
                console.log("Received offer");
                const senderId = message.senderId;
                const recieverId = message.recieverId;

                // Create peer connection for the sender
                const pc = createPeerConnection(Number(senderId));

                try {
                    // Set remote description first
                    await pc.setRemoteDescription(message.sdp);
                    
                    // Create and set local description
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    // Send answer back
                    socketRef.current?.send(JSON.stringify({
                        type: 'createAnswer',
                        sdp: answer,
                        recieverId: senderId,
                        senderId: recieverId,
                        roomId
                    }));
                } catch (error) {
                    console.error("Error handling offer:", error);
                }
            }
            else if (message.type === 'createAnswer') {
                console.log("Received answer");
                const pc = peerConnections.current[Number(roomId)][Number(message.senderId)];
                if (pc) {
                    try {
                        await pc.setRemoteDescription(message.sdp);
                    } catch (error) {
                        console.error("Error setting remote description:", error);
                    }
                }
            }
            else if (message.type === 'iceCandidate') {
                console.log("Received ICE candidate");
                const rm = Number(roomId);
                const fromId = Number(message.senderId);
                const candidate = new RTCIceCandidate(message.candidate);

                const pc = peerConnections.current[rm][fromId];
                if (pc && pc.remoteDescription) {
                    try {
                        await pc.addIceCandidate(candidate);
                        console.log("ICE candidate added successfully");
                    } catch (error) {
                        console.error("Error adding ICE candidate:", error);
                    }
                } else {
                    console.log("Peer connection not ready for ICE candidate");
                }
            }
        };

        return () => {
            socket.close();
        };
    }, [roomId, userId]);

    const getCameraStream = async (targetUserId: string) => {
        try {
            // Get media stream first
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            
            // Display local video
            if (userVideoRef.current) {
                userVideoRef.current.srcObject = stream;
            }

            // Create peer connection and add tracks
            const pc = createPeerConnection(Number(targetUserId));
            
            // Add tracks to the peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Initiate connection
            socketRef.current?.send(JSON.stringify({
                type: 'connect',
                recieverId: Number(targetUserId),
                senderId: Number(userId),
                roomId
            }));

            console.log("Camera stream started and connection initiated");
        } catch (error) {
            console.error("Error getting camera stream:", error);
        }
    };

    return (
        <div>
            <h1>User {userId}</h1>
            <button onClick={() => getCameraStream('2')}>Start Camera & Connect</button>
            <div>
                <h3>My Video:</h3>
                <video ref={userVideoRef} autoPlay playsInline muted width="300" />
            </div>
            <div>
                <h3>Remote Video:</h3>
                <video ref={myVideoRef} autoPlay playsInline width="300" />
            </div>
        </div>
    );
};

export default Page;
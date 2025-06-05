"use client"

import { useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

const Page = () => {
    const params = useParams();
    const {roomId, userId} = params;
    const socketRef = useRef<WebSocket | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const peerConnections = useRef<{ [key: number]: { [key: number]: RTCPeerConnection } }>({});
    const localStreamRef = useRef<MediaStream | null>(null);
    
    // Queue for ICE candidates that arrive before remote description is set
    const iceCandidateQueue = useRef<{ [key: number]: RTCIceCandidate[] }>({});
    
    // New state for connection requests
    const [incomingRequest, setIncomingRequest] = useState<{
        fromUserId: string;
        fromUserName?: string;
    } | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'requesting' | 'connected'>('idle');
    const [isConnected, setIsConnected] = useState(false);
    
    if (!peerConnections.current[Number(roomId)]) {
        peerConnections.current[Number(roomId)] = {};
    }

    const createPeerConnection = (peerId: number) => {
        console.log("Creating peer connection for peer id:", peerId);
        
        // Initialize ICE candidate queue for this peer
        if (!iceCandidateQueue.current[peerId]) {
            iceCandidateQueue.current[peerId] = [];
        }
        
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        });

        // Add local tracks if stream is available
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                console.log("Adding local track to peer connection for peer:", peerId);
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle remote tracks
        pc.ontrack = event => {
            console.log("Received remote track from peer:", peerId);
            const remoteStream = event.streams[0];
            if (remoteVideoRef.current && remoteStream) {
                console.log("Setting remote stream to remote video element");
                remoteVideoRef.current.srcObject = remoteStream;
                setIsConnected(true);
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = event => {
            if (event.candidate) {
                console.log("Sending ICE candidate to peer:", peerId);
                socketRef.current?.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate,
                    recieverId: peerId,
                    senderId: Number(userId),
                    roomId
                }));
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`Peer ${peerId} connection state:`, pc.connectionState);
            if (pc.connectionState === 'connected') {
                setIsConnected(true);
                setConnectionStatus('connected');
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setIsConnected(false);
                console.log(`Connection with peer ${peerId} failed/disconnected`);
            }
        };

        // Handle ICE connection state changes
        pc.oniceconnectionstatechange = () => {
            console.log(`Peer ${peerId} ICE connection state:`, pc.iceConnectionState);
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                setIsConnected(true);
                setConnectionStatus('connected');
            } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                setIsConnected(false);
            }
        };

        // Store the peer connection
        peerConnections.current[Number(roomId)][peerId] = pc;
        return pc;
    };

    // Function to process queued ICE candidates
    const processQueuedCandidates = async (peerId: number) => {
        const pc = peerConnections.current[Number(roomId)][peerId];
        if (pc && pc.remoteDescription && iceCandidateQueue.current[peerId]) {
            console.log(`Processing ${iceCandidateQueue.current[peerId].length} queued candidates for peer ${peerId}`);
            
            for (const candidate of iceCandidateQueue.current[peerId]) {
                try {
                    await pc.addIceCandidate(candidate);
                    console.log("Queued ICE candidate added successfully");
                } catch (error) {
                    console.error("Error adding queued ICE candidate:", error);
                }
            }
            
            // Clear the queue
            iceCandidateQueue.current[peerId] = [];
        }
    };

    // Function to get user media
    const getUserMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                }, 
                audio: true 
            });
            localStreamRef.current = stream;
            
            // Display local video immediately
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                console.log("Local video stream set");
            }
            
            return stream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
            throw error;
        }
    };

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connected");
            socket.send(JSON.stringify({ type: 'join-room', roomId, userId }));
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            console.log("Received message:", message.type);
            
            // Handle connection request
            if (message.type === 'connectionRequest') {
                console.log("Received connection request from:", message.fromUserId);
                setIncomingRequest({
                    fromUserId: message.fromUserId,
                    fromUserName: message.fromUserName || `User ${message.fromUserId}`
                });
            }
            // Handle connection request response
            else if (message.type === 'connectionResponse') {
                if (message.accepted) {
                    console.log("Connection request accepted");
                    setConnectionStatus('connected');
                    // The server will send serverAskToCreateOffer, so we don't need to do anything here
                } else {
                    console.log("Connection request declined");
                    setConnectionStatus('idle');
                    alert("Connection request was declined");
                }
            }
            else if (message.type === 'serverAskToCreateOffer') {
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

                // Ensure we have local stream before creating offer
                if (!localStreamRef.current) {
                    console.log("No local stream available, getting media first");
                    await getUserMedia();
                    
                    // Add tracks to the peer connection
                    if (localStreamRef.current) {
                        localStreamRef.current.getTracks().forEach(track => {
                            console.log("Adding track to peer connection");
                            pc.addTrack(track, localStreamRef.current!);
                        });
                    }
                }

                try {
                    const offer = await pc.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true
                    });
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
                console.log("Received offer from:", message.senderId);
                const senderId = message.senderId;
                const recieverId = message.recieverId;

                // Create peer connection for the sender
                let pc = peerConnections.current[Number(roomId)][Number(senderId)];
                if (!pc) {
                    pc = createPeerConnection(Number(senderId));
                }

                // Ensure we have local stream
                if (!localStreamRef.current) {
                    console.log("No local stream available, getting media first");
                    await getUserMedia();
                    
                    // Add tracks to the peer connection
                    if (localStreamRef.current) {
                        localStreamRef.current.getTracks().forEach(track => {
                            console.log("Adding track to peer connection");
                            pc.addTrack(track, localStreamRef.current!);
                        });
                    }
                }

                try {
                    // Set remote description first
                    await pc.setRemoteDescription(message.sdp);
                    console.log("Remote description set for peer:", senderId);
                    
                    // Process any queued ICE candidates
                    await processQueuedCandidates(Number(senderId));
                    
                    // Create and set local description
                    const answer = await pc.createAnswer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true
                    });
                    await pc.setLocalDescription(answer);
                    console.log("Local description set, sending answer");

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
                console.log("Received answer from:", message.senderId);
                const pc = peerConnections.current[Number(roomId)][Number(message.senderId)];
                if (pc) {
                    try {
                        await pc.setRemoteDescription(message.sdp);
                        console.log("Answer processed successfully for peer:", message.senderId);
                        
                        // Process any queued ICE candidates
                        await processQueuedCandidates(Number(message.senderId));
                    } catch (error) {
                        console.error("Error setting remote description:", error);
                    }
                }
            }
            else if (message.type === 'iceCandidate') {
                console.log("Received ICE candidate from:", message.senderId);
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
                    console.log("Peer connection not ready for ICE candidate, queuing...");
                    // Queue the candidate for later processing
                    if (!iceCandidateQueue.current[fromId]) {
                        iceCandidateQueue.current[fromId] = [];
                    }
                    iceCandidateQueue.current[fromId].push(candidate);
                }
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
        };

        return () => {
            socket.close();
            // Clean up media stream
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [roomId, userId]);

    // Send connection request
    const sendConnectionRequest = async (targetUserId: string) => {
        if (connectionStatus !== 'idle') return;
        
        try {
            // Get user media first
            await getUserMedia();
            
            setConnectionStatus('requesting');
            socketRef.current?.send(JSON.stringify({
                type: 'connectionRequest',
                fromUserId: userId,
                toUserId: targetUserId,
                fromUserName: `User ${userId}`,
                roomId
            }));
            
            console.log(`Connection request sent to user ${targetUserId}`);
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Could not access camera. Please check permissions.");
            setConnectionStatus('idle');
        }
    };

    // Accept connection request
    const acceptConnectionRequest = async () => {
        if (!incomingRequest) return;
        
        try {
            // Get camera stream first
            await getUserMedia();

            // Send acceptance response
            socketRef.current?.send(JSON.stringify({
                type: 'connectionResponse',
                accepted: true,
                fromUserId: userId,
                toUserId: incomingRequest.fromUserId,
                roomId
            }));

            setIncomingRequest(null);
            setConnectionStatus('connected');
            
            console.log("Connection request accepted");
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Could not access camera. Please check permissions.");
        }
    };

    // Decline connection request
    const declineConnectionRequest = () => {
        if (!incomingRequest) return;
        
        socketRef.current?.send(JSON.stringify({
            type: 'connectionResponse',
            accepted: false,
            fromUserId: userId,
            toUserId: incomingRequest.fromUserId,
            roomId
        }));

        setIncomingRequest(null);
        console.log("Connection request declined");
    };

    // End call
    const endCall = () => {
        console.log("Ending call...");
        
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log("Track stopped");
            });
            localStreamRef.current = null;
        }

        // Clear video elements
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        // Close peer connections
        Object.values(peerConnections.current[Number(roomId)] || {}).forEach(pc => {
            pc.close();
        });
        peerConnections.current[Number(roomId)] = {};
        
        // Clear ICE candidate queues
        iceCandidateQueue.current = {};

        setConnectionStatus('idle');
        setIsConnected(false);
        
        console.log("Call ended");
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>User {userId} - Room {roomId}</h1>
            
            {/* Connection Status */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Status: {connectionStatus}</h3>
                <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
                {connectionStatus === 'requesting' && (
                    <p>Waiting for response...</p>
                )}
            </div>

            {/* Incoming Connection Request */}
            {incomingRequest && (
                <div style={{ 
                    padding: '15px', 
                    border: '2px solid #007bff', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    backgroundColor: '#f8f9fa'
                }}>
                    <h3>Incoming Call Request</h3>
                    <p>{incomingRequest.fromUserName} wants to connect with you</p>
                    <button 
                        onClick={acceptConnectionRequest}
                        style={{ 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            padding: '10px 20px', 
                            border: 'none', 
                            borderRadius: '5px', 
                            marginRight: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        Accept
                    </button>
                    <button 
                        onClick={declineConnectionRequest}
                        style={{ 
                            backgroundColor: '#dc3545', 
                            color: 'white', 
                            padding: '10px 20px', 
                            border: 'none', 
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Decline
                    </button>
                </div>
            )}

            {/* Connection Controls */}
            {connectionStatus === 'idle' && (
                <div style={{ marginBottom: '20px' }}>
                    <h3>Connect to User:</h3>
                    <button 
                        onClick={() => sendConnectionRequest('2')}
                        style={{ 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            padding: '10px 20px', 
                            border: 'none', 
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        Call User 2
                    </button>
                    <button 
                        onClick={() => sendConnectionRequest('1')}
                        style={{ 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            padding: '10px 20px', 
                            border: 'none', 
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Call User 1
                    </button>
                </div>
            )}

            {/* End Call Button */}
            {(connectionStatus === 'connected' || isConnected) && (
                <div style={{ marginBottom: '20px' }}>
                    <button 
                        onClick={endCall}
                        style={{ 
                            backgroundColor: '#dc3545', 
                            color: 'white', 
                            padding: '10px 20px', 
                            border: 'none', 
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        End Call
                    </button>
                </div>
            )}

            {/* Video Elements */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                    <h3>Your Video (Local):</h3>
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        width="300" 
                        style={{ 
                            border: '1px solid #ccc', 
                            borderRadius: '8px',
                            backgroundColor: '#000'
                        }}
                    />
                </div>
                <div>
                    <h3>Remote Video:</h3>
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        width="300" 
                        style={{ 
                            border: '1px solid #ccc', 
                            borderRadius: '8px',
                            backgroundColor: '#000'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Page;
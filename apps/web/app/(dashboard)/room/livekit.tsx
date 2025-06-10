'use client';
import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, RemoteParticipant, RemoteTrack, LocalParticipant, ConnectionState, createLocalAudioTrack, createLocalVideoTrack } from 'livekit-client';

interface LiveKitRoomProps {
  token: string;
  wsUrl: string;
  roomName: string;
  participantName: string;
  isStreamer: boolean;
  onLeave: () => void;
}

export default function LiveKitRoom({ token, wsUrl, roomName, participantName, isStreamer, onLeave }: LiveKitRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [isReadyToConnect, setIsReadyToConnect] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  async function enableCameraAndMicrophone(room) {
    const videoTrack = await createLocalVideoTrack();
    const audioTrack = await createLocalAudioTrack();

    const videoPub = await room.localParticipant.publishTrack(videoTrack);
    const audioPub = await room.localParticipant.publishTrack(audioTrack);

    return [videoPub, audioPub];
}


  // Start audio context on user interaction
  const startAudioContext = async () => {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('✅ Audio context resumed');
        }
      }
    } catch (error) {
      console.error('AudioContext error:', error);
    }
  };

  // Handle join room with user interaction
  const handleJoinRoom = async () => {
    try {
      await startAudioContext();
      setIsReadyToConnect(true);
      setConnectionError('');
    } catch (error) {
      console.error('Error starting audio context:', error);
      setConnectionError('Failed to initialize audio. Please try again.');
    }
  };

  // Handle streamer setup
  const handleStreamerSetup = async (newRoom: Room, isMounted: boolean) => {
    try {
      console.log("🎥 Setting up streamer...");
      
      // First check if permissions are available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log("✅ Got initial media stream");
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        console.error("❌ Permission error:", permError);
        throw permError;
      }
      
      if (!isMounted) return;
      
      // Now enable in LiveKit
      console.log("🔄 Enabling camera and microphone in LiveKit...");
      const track = await enableCameraAndMicrophone(newRoom)

      console.log("✅ Tracks published:", track);
      
      if (!isMounted) return;
      
      if (!track || track.length === 0) {
        throw new Error("No tracks returned from enableCameraAndMicrophone");
      }
      
      const videoTrack = track.find((t: any) => t.kind === 'video');
      if (localVideoRef.current && videoTrack) {
        console.log("✅ Attaching local video track ", videoTrack);
        videoTrack.track.attach(localVideoRef.current);
      } else {
        console.warn("⚠️ No video track or video ref not available");
      }
      
    } catch (error: any) {
      console.error("❌ Error in streamer setup:", error);
      
      let errorMessage = 'Failed to access camera/microphone';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera and microphone permissions denied. Please allow access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect devices and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera or microphone is already in use by another application.';
      }
      
      setConnectionError(errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    if (!isReadyToConnect) return;
    
    let newRoom: Room | null = null;
    let isMounted = true;
    
    const connectToRoom = async () => {
      try {
        console.log('🔄 Starting room connection...');
        
        // Validate inputs
        if (!wsUrl || !token) {
          throw new Error('Missing wsUrl or token');
        }

        newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        
        if (!isMounted) return;
        setRoom(newRoom);

        // Connection event handlers
        newRoom.on(RoomEvent.Connected, () => {
          console.log('✅ Successfully connected to room');
          setIsConnected(true);
          setConnectionError('');
        });

        newRoom.on(RoomEvent.Disconnected, (reason) => {
          console.log('❌ Disconnected from room:', reason);
          setIsConnected(false);
        });

        newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
          console.log('🔄 Connection state changed:', state);
          setIsConnected(state === ConnectionState.Connected);
        });

        // Participant event handlers
        newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          console.log('👤 Participant connected:', participant.identity);
          setParticipants(prev => [...prev, participant]);
        });

        newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          console.log('👤 Participant disconnected:', participant.identity);
          setParticipants(prev => prev.filter(p => p.identity !== participant.identity));
        });

        // Track event handlers
        newRoom.on(RoomEvent.TrackSubscribed, (track: any, publication: any, participant: any) => {
          console.log('📹 Track subscribed:', track.kind, 'from:', participant.identity);
          if (track.kind === 'video' && remoteVideoRef.current) {
            console.log("remote track ", track)
            track.attach(remoteVideoRef.current);
          }
        });

        newRoom.on(RoomEvent.TrackUnsubscribed, (track: any, publication: any, participant: any) => {
          console.log('📹 Track unsubscribed:', track.kind, 'from:', participant.identity);
          if (track.kind === 'video' && remoteVideoRef.current) {
            console.log("attaching remote videoTrack", track)
            track.detach(remoteVideoRef.current);
          }
        });
        
        // Connect to room
        console.log('🔌 Connecting to room...');
        await newRoom.connect(wsUrl, token);
        
        if (!isMounted) {
          newRoom.disconnect();
          return;
        }

        // Set existing participants
        console.log("participants are ", newRoom);
        const existingParticipants = Array.from(newRoom.remoteParticipants.values());
        setParticipants(existingParticipants);
        console.log('👥 Existing participants:', existingParticipants.length);

        // Handle streamer setup after successful connection
        if (isStreamer) {
          await handleStreamerSetup(newRoom, isMounted);
        }
        
      } catch (error: any) {
        console.error('❌ Error connecting to room:', error);
        
        let errorMessage = 'Failed to connect to room';
        if (error.message?.includes('token')) {
          errorMessage = 'Invalid token. Please refresh and try again.';
        } else if (error.message?.includes('WebSocket')) {
          errorMessage = 'Connection failed. Please check your internet connection.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setConnectionError(errorMessage);
        setIsConnected(false);
      }
    };

    connectToRoom();

    return () => {
      console.log('🧹 Cleaning up room connection...');
      isMounted = false;
      if (newRoom) {
        newRoom.removeAllListeners();
        newRoom.disconnect();
      }
    };
  }, [token, wsUrl, isStreamer, isReadyToConnect]);

  // Handle leaving the room
  const handleLeave = () => {
    if (room) {
      room.disconnect();
    }
    onLeave();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-white text-xl">Room: {roomName}</h1>
        <button
          onClick={handleLeave}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Leave Room
        </button>
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        {!isReadyToConnect ? (
          <div className="text-center">
            <button
              onClick={handleJoinRoom}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 text-lg"
            >
              Join Room
            </button>
            <p className="text-gray-300 text-sm mt-2">
              Click to join and enable camera/microphone access
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {connectionError && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg mb-4">
          <p className="font-medium">Connection Error:</p>
          <p className="text-sm">{connectionError}</p>
          <button
            onClick={() => {
              setConnectionError('');
              setIsReadyToConnect(false);
            }}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Video Grid */}
      {isReadyToConnect && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local Video */}
          {isStreamer && (
            <div className="relative">
              <h2 className="text-white mb-2">Your Video</h2>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full aspect-video bg-black rounded-lg"
              />
            </div>
          )}

          {/* Remote Video */}
          <div className="relative">
            <h2 className="text-white mb-2">Remote Video</h2>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full aspect-video bg-black rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Participants List */}
      {isReadyToConnect && (
        <div className="mt-4">
          <h2 className="text-white mb-2">Participants ({participants.length + 1}):</h2>
          <ul className="text-white">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              You ({participantName}) {isStreamer ? '(Streamer)' : '(Viewer)'}
            </li>
            {participants.map((p) => (
              <li key={p.identity} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {p.identity}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
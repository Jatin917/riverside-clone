'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  ConnectionState,
  createLocalAudioTrack,
  createLocalVideoTrack,
} from 'livekit-client';
import { Track } from '../../components/tracks/track';

interface LiveKitRoomProps {
  token: string;
  wsUrl: string;
  roomName: string;
  participantName: string;
  isStreamer: boolean;
  onLeave: () => void;
}

export default function LiveKitRoom({
  token,
  wsUrl,
  roomName,
  participantName,
  isStreamer,
  onLeave,
}: LiveKitRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isReadyToConnect, setIsReadyToConnect] = useState(false);
  const [participantsTrack, setParticipantsTrack] = useState<RemoteTrack[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  async function enableCameraAndMicrophone(room: Room) {
    const videoTrack = await createLocalVideoTrack();
    const audioTrack = await createLocalAudioTrack();

    const videoPub = await room.localParticipant.publishTrack(videoTrack);
    const audioPub = await room.localParticipant.publishTrack(audioTrack);

    return [videoPub.track, audioPub.track];
  }

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

  const handleStreamerSetup = async (newRoom: Room, isMounted: boolean) => {
    try {
      console.log('🎥 Setting up streamer...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());

      if (!isMounted) return;

      const tracks = await enableCameraAndMicrophone(newRoom);
      console.log('✅ Tracks published:', tracks);

      if (!isMounted || !tracks || tracks.length === 0) return;

      const videoTrack = tracks.find((t: any) => t.kind === 'video');
      if (localVideoRef.current && videoTrack) {
        console.log('✅ Attaching local video track ', videoTrack);
        videoTrack.attach(localVideoRef.current);
      } else {
        console.warn('⚠️ No video track or video ref not available');
      }
    } catch (error: any) {
      console.error('❌ Error in streamer setup:', error);
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
        if (!wsUrl || !token) throw new Error('Missing wsUrl or token');

        newRoom = new Room({ adaptiveStream: true, dynacast: true });
        if (!isMounted) return;

        setRoom(newRoom);

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

        newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          console.log('👤 Participant connected:', participant.identity);
          setParticipants((prev) => [...prev, participant]);
        });

        newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          console.log('👤 Participant disconnected:', participant.identity);
          setParticipants((prev) => prev.filter((p) => p.identity !== participant.identity));
        });

        newRoom.on(RoomEvent.TrackSubscribed, (track: any) => {
          console.log('📹 Track subscribed:', track.kind);
          if (track.kind === 'video') {
            setParticipantsTrack((prev) => {
              const exists = prev.find((t) => t.sid === track.sid);
              return exists ? prev : [...prev, track];
            });
          }
        });

        newRoom.on(RoomEvent.TrackUnsubscribed, (track: any) => {
          console.log('📹 Track unsubscribed:', track.kind);
          if (track.kind === 'video') {
            setParticipantsTrack((prev) => prev.filter((t) => t.sid !== track.sid));
          }
        });

        await newRoom.connect(wsUrl, token);
        if (!isMounted) {
          newRoom.disconnect();
          return;
        }

        const existingParticipants = Array.from(newRoom.remoteParticipants.values());
        setParticipants(existingParticipants);

        if (isStreamer) {
          await handleStreamerSetup(newRoom, isMounted);
        }
      } catch (error: any) {
        console.error('❌ Error connecting to room:', error);
        setConnectionError(error.message || 'Failed to connect to room');
        setIsConnected(false);
      }
    };

    connectToRoom();

    return () => {
      isMounted = false;
      if (newRoom) {
        newRoom.removeAllListeners();
        newRoom.disconnect();
      }
    };
  }, [token, wsUrl, isStreamer, isReadyToConnect]);

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
        <button onClick={handleLeave} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Leave Room
        </button>
      </div>

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

      {isReadyToConnect && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="relative">
            {participantsTrack.map((track) => (
              <Track track={track} key={track.sid || track.kind} />
            ))}
          </div>
        </div>
      )}

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
'use client';
import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, RemoteParticipant, RemoteTrack, LocalParticipant } from 'livekit-client';

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
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let newRoom: Room;
    const connectToRoom = async () => {
      try {
        newRoom = new Room();
        setRoom(newRoom);
  
        newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === 'video' && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current);
          }
        });
        console.log("wsurl is ", wsUrl);
        await newRoom.connect(wsUrl, token);
  
        if (isStreamer) {
          const tracks = await newRoom.localParticipant.enableCameraAndMicrophone();
          const videoTrack = tracks.find((t) => t.kind === 'video');
          if (localVideoRef.current && videoTrack) {
            videoTrack.attach(localVideoRef.current);
          }
        }
      } catch (error) {
        console.error('Error connecting to room:', error);
      }
    };
  
    connectToRoom();
  
    return () => {
      if (newRoom) {
        newRoom.disconnect();
      }
    };
  }, [token, wsUrl, isStreamer]);
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-white text-xl">Room: {roomName}</h1>
        <button
          onClick={onLeave}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Leave Room
        </button>
      </div>

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

      {/* Participants List */}
      <div className="mt-4">
        <h2 className="text-white mb-2">Participants:</h2>
        <ul className="text-white">
          <li>You ({participantName}) {isStreamer ? '(Streamer)' : ''}</li>
          {participants.map((p) => (
            <li key={p.identity}>{p.identity}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
'use client'

import React, { useEffect, useRef, useState } from 'react'
import StudioHeader from './StudioHeader'
import VideoFeed from './VideoFeed'
import Sidebar from './SideBar'
import ControlBar from './ControlBar'
import InvitePanel from './InvitePanel'
import { Room, RoomEvent, ConnectionState, RemoteParticipant, RemoteTrack } from 'livekit-client'

// Types
interface Participant {
  id: string
  name: string
  isHost: boolean
  videoEnabled: boolean
  audioEnabled: boolean
  quality: string
}
// Main Studio Component
const StudioSession = ({previewStream, wsUrl, livekitToken, link}:{previewStream:MediaStream, wsUrl:string, livekitToken:string, link:URL}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isReadyToConnect, setIsReadyToConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [participantsTrack, setParticipantsTrack] = useState<RemoteTrack[]>([]);


    const handleStreamerSetup = async (newRoom: Room, isMounted: boolean) => {
    try {

      if (!isMounted) return;
      const videoTrack = previewStream.getVideoTracks()[0];
      const audioTrack = previewStream.getAudioTracks()[0];
      if (!isMounted || !videoTrack || !audioTrack) return;
      if(room){
        await room.localParticipant.publishTrack(audioTrack);
        await room.localParticipant.publishTrack(videoTrack);
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
          if (!wsUrl || !livekitToken) throw new Error('Missing wsUrl or livekitToken');
  
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
  
          await newRoom.connect(wsUrl, livekitToken);
          if (!isMounted) {
            newRoom.disconnect();
            return;
          }
  
          const existingParticipants = Array.from(newRoom.remoteParticipants.values());
          setParticipants(existingParticipants);
  
          await handleStreamerSetup(newRoom, isMounted);
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
    }, [livekitToken, wsUrl, isReadyToConnect]);
  
  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <StudioHeader />
      
      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <VideoFeed previewStream={previewStream} />
            </div>
          </div>
        </div>
        
        <Sidebar />
      </div>
      
      <ControlBar
        isRecording={false}
        onToggleRecording={() => void(!false)}
        audioEnabled={false}
        onToggleAudio={() => void(!false)}
        videoEnabled={false}
        onToggleVideo={() => void(!false)}
        onLeave={() => console.log('Leave')}
      />
      
    <InvitePanel 
        link={link}
        isOpen={false} 
        onClose={() => void(false)} 
      />
    </div>
  )
}

export default StudioSession


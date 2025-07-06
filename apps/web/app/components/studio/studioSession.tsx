'use client'

import React, { useEffect, useRef, useState } from 'react'
import StudioHeader from './StudioHeader'
import VideoFeed from './VideoFeed'
import Sidebar from './SideBar'
import ControlBar from './ControlBar'
import InvitePanel from './InvitePanel'
import InviteModal from './InviteModal'
import { Room, RoomEvent, ConnectionState, RemoteParticipant, RemoteTrack, TrackPublication } from 'livekit-client'
import { Users, MessageCircle, Settings, FileText, Music, Grid3X3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {  inLiveParticipants } from '@lib/studio'
import { leaveRoomApi } from "@lib/socketStudio";
import initSocket from '@lib/clientSocket'
import { toast } from 'react-toastify'

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
const StudioSession = ({previewStream, wsUrl, livekitToken, link, host, sessionToken, email}:{previewStream:MediaStream | null, wsUrl:string, livekitToken:string, link:string | null, host:boolean, sessionToken:string | null, email:string | null}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isReadyToConnect, setIsReadyToConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [participantsTrack, setParticipantsTrack] = useState<RemoteTrack[]>([]);
  const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(host);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const router=useRouter();

  const handleLeave = () => {
    console.log("handleLeave");
    setIsInvitePanelOpen(false);
  }

  const handleStreamerSetup = async (newRoom: Room, isMounted: boolean) => {
    try {
      console.log("handleStreamerSetup is ", isMounted);
      if (!isMounted || !previewStream) return;
      const videoTrack = previewStream.getVideoTracks()[0];
      const audioTrack = previewStream.getAudioTracks()[0];
      console.log("videoTrack is ", videoTrack);
      if (!videoTrack) return;
      console.log("room is 1", newRoom);
      if(newRoom){
        // await room.localParticipant.publishTrack(audioTrack);
        console.log("room is ", newRoom);
        console.log("publishing track ", videoTrack);
        await newRoom.localParticipant.publishTrack(videoTrack);
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

  // broadcast message of host
  useEffect(() => {
    const socket = initSocket();
  
    const handleSessionEnded = (data: { message: string, isHost: boolean, name: string }) => {
      console.log("⚠️ Session ended broadcast:", data);
      if(data.message==="host-left-session"){
        if(room?.connect) room.disconnect();
        if(localVideoRef.current) localVideoRef.current = null;
        toast.warn(`${data.name} host left the session`)
        setParticipants([]);
        setParticipantsTrack([]);
        setRoom(null);
        setIsConnected(false);
        router.push('/');
      } 
      else toast.warn(`${data.name} left the session`);
      // You can redirect, show modal, or leave room here
      // yha or show kr skte hain that modal this person leaves the sesison, can show modal and other things here
    };
  
    socket.on("session-ended", handleSessionEnded);
  
  return () => {
      socket.off("session-ended", handleSessionEnded); // Cleanup
    };
  }, []);

  useEffect(() => {
    // if (!isReadyToConnect) return;
    let newRoom: Room | null = null;
    let isMounted = true;

    const connectToRoom = async () => {
      try {
        console.log('🔄 Starting room connection...', wsUrl, livekitToken);
        if (!wsUrl || !livekitToken || !email || !sessionToken) throw new Error('Missing wsUrl or livekitToken or email or sessionToken');

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
        console.log("yha tak chala 1");
        await newRoom.connect(wsUrl, livekitToken);
        console.log("yha tak chala 2");
        // new user joinee ko live participants main entry de rhe hain
        await inLiveParticipants(email, sessionToken);
        console.log("yha tak chala 3");
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
    if (isConnected) return;
    connectToRoom();

    return () => {
      isMounted = false;
      if (newRoom) {
        newRoom.removeAllListeners();
        newRoom.disconnect();
      }
    };
  }, [livekitToken, wsUrl, isReadyToConnect, previewStream]);

  // Handler for Invite button in header
  const handleInviteClick = () => setIsInviteModalOpen(true);

  // Handler for closing InvitePanel
  const handleCloseInvitePanel = () => setIsInvitePanelOpen(false);

  // Handler for closing Sidebar
  const handleCloseSidebar = () => setIsSidebarOpen(false);
  // Handler for opening Sidebar
  const handleOpenSidebar = () => setIsSidebarOpen(true);

  const handleLeaveRoom = async()=>{
    console.log("leave room ", sessionToken, email);
    // room.localParticipant.videoTracks.forEach(pub => pub.track?.stop());
    // room.localParticipant.audioTracks.forEach(pub => pub.track?.stop());
    if(!email || !sessionToken){
      console.log("session token or email or not there ", sessionToken, email);
      return;
    }
    const response = await leaveRoomApi(email, sessionToken)
    if(response.message=="left-session"){
      await room?.disconnect();     router.push('/');
      setParticipants([]);
      setParticipantsTrack([]);
      setRoom(null);
      setIsConnected(false);
      toast.success("Left Session ");
    } 
    // yha prr check krna hain that ki unko kahi route krna ho agar koi feed back form lena ho and all
  }
  return (
    <div className="h-screen bg-[#0d0d0d] flex items-stretch p-4">
      {/* Main Content Container (shrinks when sidebar is open) */}
      <div className={`flex flex-col bg-black rounded-2xl transition-all duration-300 ${isSidebarOpen ? 'w-[calc(100%-27rem)]' : 'w-[calc(100%-5.5rem)]'}`}>
        <StudioHeader link={link} onInvite={handleInviteClick} />
        {/* <div className="flex-1 flex bg-transparent relative"> */}
          {/* This is the new "frame" container with padding */}
          {/* <div className="flex-1 p-6 flex items-center justify-center h-full bg-black"> */}
            {/* This is the VideoFeed container, now without margin */}
            <div className="bg-black rounded-2xl w-full max-w-5xl h-[70vh] flex items-center justify-center m-auto py-2 px-6">
              <VideoFeed participantsTrack={participantsTrack} previewStream={previewStream || undefined} />
            </div>
          {/* </div> */}
        {/* </div> */}
        <ControlBar
          sessionToken={sessionToken}
          previewStream={previewStream}
          isRecording={false}
          onToggleRecording={() => void(!false)}
          audioEnabled={false}
          onToggleAudio={() => void(!false)}
          videoEnabled={false}
          onToggleVideo={() => void(!false)}
          onLeave={handleLeaveRoom}
        />
      </div>

      {/* Sidebar and its open buttons (always on right) */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center space-y-3">
        <button onClick={handleOpenSidebar} className=" text-white rounded-full shadow p-3 transition-all duration-300 hover:bg-[#333] flex items-center justify-center" aria-label="Open People Sidebar">
          <Users className="w-6 h-6" />
        </button>
        <button className=" text-white rounded-full shadow p-3 transition-all duration-300 hover:bg-[#333] flex items-center justify-center" aria-label="Open Chat Sidebar">
          <MessageCircle className="w-6 h-6" />
        </button>
        <button className=" text-white rounded-full shadow p-3 transition-all duration-300 hover:bg-[#333] flex items-center justify-center" aria-label="Open Brand Sidebar">
          <Settings className="w-6 h-6" />
        </button>
        <button className=" text-white rounded-full shadow p-3 transition-all duration-300 hover:bg-[#333] flex items-center justify-center" aria-label="Open Text Sidebar">
          <FileText className="w-6 h-6" />
        </button>
        <button className=" text-white rounded-full shadow p-3 transition-all duration-300 hover:bg-[#333] flex items-center justify-center" aria-label="Open Media Sidebar">
          <Music className="w-6 h-6" />
        </button>
        <button className=" text-white rounded-full shadow p-3 transition-all duration-300 hover:bg-[#333] flex items-center justify-center" aria-label="Open Layout Sidebar">
          <Grid3X3 className="w-6 h-6" />
        </button>
      </div>
      {/* Sidebar appears to the left of the buttons with margin */}
      <div className={`fixed top-4 bottom-4 right-0 w-80 z-40 transition-transform duration-300 ${isSidebarOpen ? '-translate-x-[5.5rem]' : 'translate-x-full'}`}>
        <Sidebar onClose={handleCloseSidebar} />
      </div>
      
      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity duration-300">
          <InviteModal
            setIsInviteModalOpen={setIsInviteModalOpen}
            isInviteModalOpen={isInviteModalOpen}
            link={link || ''}
            selectedRole={"Guest"}
            setSelectedRole={()=>{}}
            email={""}
            setEmail={()=>{}}
          />
        </div>
      )}
    </div>
  )
}

export default StudioSession


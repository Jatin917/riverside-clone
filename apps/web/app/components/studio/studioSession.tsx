'use client'

import React, { useState } from 'react'
import StudioHeader from './StudioHeader'
import VideoFeed from './VideoFeed'
import Sidebar from './SideBar'
import ControlBar from './ControlBar'
import InvitePanel from './InvitePanel'

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
const StudioSession = ({link}) => {
  const [participants] = useState<Participant[]>([
    {
      id: '1',
      name: 'Jatin Chandel',
      isHost: true,
      videoEnabled: true,
      audioEnabled: true,
      quality: '720p'
    }
  ])
  
  const [isRecording, setIsRecording] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [showInvitePanel, setShowInvitePanel] = useState(true)
  
  const mainParticipant = participants[0]

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <StudioHeader />
      
      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <VideoFeed participant={mainParticipant} isMainFeed={true} />
            </div>
          </div>
        </div>
        
        <Sidebar />
      </div>
      
      <ControlBar
        isRecording={isRecording}
        onToggleRecording={() => setIsRecording(!isRecording)}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        videoEnabled={videoEnabled}
        onToggleVideo={() => setVideoEnabled(!videoEnabled)}
        onLeave={() => console.log('Leave')}
      />
      
    <InvitePanel 
        link={link}
        isOpen={showInvitePanel} 
        onClose={() => setShowInvitePanel(false)} 
      />
    </div>
  )
}

export default StudioSession
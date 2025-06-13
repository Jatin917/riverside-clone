"use client"

import { FileText, Mic, MicOff, Monitor, PhoneOff, Video, VideoOff } from "lucide-react"


// Control Bar Component
const ControlBar = ({ 
  isRecording, 
  onToggleRecording, 
  audioEnabled, 
  onToggleAudio, 
  videoEnabled, 
  onToggleVideo,
  onLeave 
}: {
  isRecording: boolean
  onToggleRecording: () => void
  audioEnabled: boolean
  onToggleAudio: () => void
  videoEnabled: boolean
  onToggleVideo: () => void
  onLeave: () => void
}) => {
  return (
    <div className="bg-gray-900 border-t border-gray-700 px-6 py-4">
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={onToggleRecording}
          className={`px-6 py-3 rounded-lg flex items-center space-x-2 font-medium ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`}></div>
          <span>{isRecording ? 'Stop' : 'Record'}</span>
        </button>
        
        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-lg ${
            audioEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          <span className="sr-only">Mic</span>
        </button>
        
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-lg ${
            videoEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          <span className="sr-only">Cam</span>
        </button>
        
        <button className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white">
          <Monitor className="w-5 h-5" />
          <span className="sr-only">Speaker</span>
        </button>
        
        <button className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white">
          <FileText className="w-5 h-5" />
          <span className="sr-only">Script</span>
        </button>
        
        <button className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white">
          <Monitor className="w-5 h-5" />
          <span className="sr-only">Share</span>
        </button>
        
        <button
          onClick={onLeave}
          className="p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="sr-only">Leave</span>
        </button>
      </div>
    </div>
  )
}

export default ControlBar
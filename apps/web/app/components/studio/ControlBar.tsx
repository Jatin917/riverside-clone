"use client"

import { FileText, Mic, MicOff, Monitor, MonitorOff, PhoneOff, Video, VideoOff } from "lucide-react"
import { useState } from "react"

// Control Bar Component
const ControlBar = ({previewStream, onLeave }: {previewStream:MediaStream | null,  onLeave: () => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [monitorEnabled, setMonitorEnabled] = useState(true);
  const [scriptEnabled, setScriptEnabled] = useState(true);
  const [shareEnabled, setShareEnabled] = useState(true);

  function onToggleRecording() {
    setIsRecording((prev) => !prev);
  }
  function onToggleAudio() {
    if (!previewStream) return;
  
    previewStream.getAudioTracks().forEach(track => {
      track.enabled = !audioEnabled;
    });
  
    setAudioEnabled(prev => !prev);
  }
  function onToggleVideo() {
    if (!previewStream) return;
  
    previewStream.getVideoTracks().forEach(track => {
      track.enabled = !videoEnabled;
    });
  
    setVideoEnabled(prev => !prev);
  }
  
  function onToggleMonitor() {
    setMonitorEnabled((prev) => !prev);
  }
  function onToggleScript() {
    setScriptEnabled((prev) => !prev);
  }
  function onToggleShare() {
    setShareEnabled((prev) => !prev);
  }

  return (
    <div className="bg-[#0d0d0d] border-gray-700 px-6 py-4">
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={onToggleRecording}
          className={`px-6 py-3 rounded-lg flex items-center space-x-2 font-medium bg-[#232323] hover:bg-[#3d3d3d] text-white`}
        >
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`}></div>
          <span>{isRecording ? 'Stop' : 'Record'}</span>
        </button>

        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-lg cursor-pointer bg-[#232323] hover:bg-[#3d3d3d] text-white`}
        >
          {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-[#c65959]" />}
          <span className="sr-only">Mic</span>
        </button>

        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-lg bg-[#232323] hover:bg-[#3d3d3d] text-white`}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-[#c65959]" />}
          <span className="sr-only">Cam</span>
        </button>

        <button
          onClick={onToggleMonitor}
          className={`p-3 rounded-lg bg-[#232323] hover:bg-[#3d3d3d] text-white`}
        >
          {monitorEnabled ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5 text-[#c65959]" />}
          <span className="sr-only">Speaker</span>
        </button>

        <button
          onClick={onToggleScript}
          className={`p-3 rounded-lg bg-[#232323] hover:bg-[#3d3d3d] text-white`}
        >
          {scriptEnabled ? <FileText className="w-5 h-5" /> : <FileText className="w-5 h-5 text-[#c65959]" />}
          <span className="sr-only">Script</span>
        </button>

        <button
          onClick={onToggleShare}
          className={`p-3 rounded-lg bg-[#232323] hover:bg-[#3d3d3d] text-white`}
        >
          {shareEnabled ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5 text-[#c65959]" />}
          <span className="sr-only">Share</span>
        </button>

        <button
          onClick={onLeave}
          className="p-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white"
        >
          <PhoneOff className="w-5 h-5 text-[#c65959]" />
          <span className="sr-only">Leave</span>
        </button>
      </div>
    </div>
  )
}

export default ControlBar
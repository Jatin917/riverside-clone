"use client"
// Video Feed Component
import { MicOff } from "lucide-react";
import { useEffect, useRef } from "react";


// Types
interface Participant {
  id: string
  name: string
  isHost: boolean
  videoEnabled: boolean
  audioEnabled: boolean
  quality: string
}

const VideoFeed = ({ participant, isMainFeed = false }: { participant: Participant; isMainFeed?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useEffect(() => {
    // Simulate video stream
    if (videoRef.current && participant.videoEnabled) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch(() => {
          // Fallback to placeholder
        })
    }
  }, [participant.videoEnabled])

  return (
    <div className={`relative bg-gray-800 rounded-xl overflow-hidden ${isMainFeed ? 'aspect-video' : 'aspect-square'}`}>
      {participant.videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-semibold">
              {participant.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}
      
      {/* Participant Info */}
      <div className="absolute bottom-3 left-3 flex items-center space-x-2">
        <span className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
          {participant.name}
        </span>
        {participant.isHost && (
          <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
            Host
          </span>
        )}
        <span className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
          {participant.quality}
        </span>
      </div>
      
      {/* Audio Indicator */}
      <div className="absolute top-3 right-3">
        {participant.audioEnabled ? (
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        ) : (
          <MicOff className="w-4 h-4 text-red-500" />
        )}
      </div>
    </div>
  )
}
export default VideoFeed;
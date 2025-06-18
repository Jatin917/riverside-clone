import { MicOff } from "lucide-react";
import { useEffect, useRef } from "react";

interface ParticipantTrack {
    id: string;
    name: string;
    isHost: boolean;
    videoEnabled: boolean;
    audioEnabled: boolean;
    quality: string;
    stream: MediaStream | null;
    isSpeaking?: boolean;
  }

const SingleVideoFeed = ({ 
    participant, 
    stream, 
    isPreview = false,
    isMainSpeaker = false,
    layout = 'grid'
  }: { 
    participant: ParticipantTrack; 
    stream?: MediaStream;
    isPreview?: boolean;
    isMainSpeaker?: boolean;
    layout?: string;
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
  
    useEffect(() => {
      console.log("stream is there in remote track ", stream)
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);
  
    const containerClass = isMainSpeaker && layout !== 'grid' 
      ? "relative bg-gray-900 rounded-xl overflow-hidden aspect-video border-2 border-purple-500"
      : "relative bg-gray-900 rounded-xl overflow-hidden aspect-video hover:border-gray-600 border border-gray-800 transition-all";
  
    return (
      <div className={containerClass}>
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            muted={isPreview}
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center border border-gray-600">
              <span className="text-white text-2xl font-medium">
                {participant.name ? participant.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : "N/A"}
              </span>
            </div>
          </div>
        )}
  
        {/* Speaking indicator */}
        {participant.isSpeaking && (
          <div className="absolute inset-0 border-3 border-green-400 rounded-xl pointer-events-none"></div>
        )}
  
        {/* Participant name */}
        <div className="absolute bottom-4 left-4">
          <span className="bg-black bg-opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
            {participant.name} {isPreview && "(You)"}
          </span>
        </div>
  
        {/* Audio status indicator */}
        <div className="absolute bottom-4 right-4">
          {!participant.audioEnabled && (
            <div className="bg-gray-800 bg-opacity-80 p-1.5 rounded-lg">
              <MicOff className="w-4 h-4 text-red-400" />
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default SingleVideoFeed;
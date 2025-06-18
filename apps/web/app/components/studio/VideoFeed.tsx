

import SingleVideoFeed from "./SingleFeed";

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
// VideoFeed Component
const VideoFeed = ({ 
  previewStream, 
  participantsTrack = [],
  currentUserId,
  hostName
}: { 
  previewStream?: MediaStream;
  participantsTrack?: ParticipantTrack[];
  currentUserId?: string;
  hostName?: string;
}) => {
  // Create host participant from preview stream
  const hostParticipant: ParticipantTrack = {
    id: currentUserId || 'host',
    name: hostName || 'Host',
    isHost: true,
    videoEnabled: !!previewStream,
    audioEnabled: true,
    quality: 'HD',
    stream: previewStream
  };

  console.log("participantsTrack are ", participantsTrack);
  const allParticipants = [hostParticipant, ...participantsTrack];

  // Grid layout logic
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 lg:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  return (
    <div className="flex-1 p-6">
      <div className={`grid gap-6 h-full ${getGridCols(allParticipants.length)}`}>
        {/* Host Video */}
        <SingleVideoFeed 
          participant={hostParticipant}
          stream={previewStream}
          isPreview={true}
        />
        
        {/* Participants Videos */}
        {participantsTrack.map((participant) => (
          <SingleVideoFeed 
            key={participant.id}
            participant={participant} 
            stream={(new MediaStream([participant.mediaStreamTrack]))}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoFeed;
"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isStreamer, setIsStreamer] = useState(false);
  const router = useRouter();

  const handleJoin = () => {
    if (roomName && participantName) {
      const params = new URLSearchParams({
        room: roomName,
        participant: participantName,
        streamer: isStreamer.toString(),
      });
      router.push(`/room?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Join Streaming Room</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter room name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="streamer"
              checked={isStreamer}
              onChange={(e) => setIsStreamer(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="streamer" className="text-sm text-gray-700">
              Join as streamer (can broadcast video)
            </label>
          </div>
          
          <button
            onClick={handleJoin}
            disabled={!roomName || !participantName}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

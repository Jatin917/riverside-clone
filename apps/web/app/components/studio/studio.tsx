'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, MicOff, VideoOff, ChevronDown, Settings } from 'lucide-react';
import { createLocalAudioTrack, createLocalVideoTrack } from 'livekit-client';

interface MediaDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
}

interface CameraSetupProps {
  onJoinStudio?: () => void;
  hostName?: string;
  studioName?: string;
}

const CameraSetup: React.FC<CameraSetupProps> = ({
  onJoinStudio,
  hostName = "Jatin Chandel",
  studioName = "Jatin Chandel's Studio"
}) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [showCameraDropdown, setShowCameraDropdown] = useState<boolean>(false);
  const [showMicDropdown, setShowMicDropdown] = useState<boolean>(false);
  const [showSpeakerDropdown, setShowSpeakerDropdown] = useState<boolean>(false);
  const [isUsingHeadphones, setIsUsingHeadphones] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const getMediaDevices = async (): Promise<MediaDevice[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
        kind: device.kind as 'videoinput' | 'audioinput' | 'audiooutput'
      }));
    } catch (error) {
      console.error('Error getting media devices:', error);
      return [];
    }
  };

useEffect(()=>{
        if (videoRef.current && previewStream) {
        console.log("privies stream")
        videoRef.current.srcObject = previewStream;
      }
},[hasPermission, previewStream])

  const requestPermission = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const videoTrack = await createLocalVideoTrack();
      const audioTrack = await createLocalAudioTrack(); 
      const stream = new MediaStream([
        videoTrack.mediaStreamTrack,
        audioTrack.mediaStreamTrack,
      ]);
      setHasPermission(true);
      setPreviewStream(stream);
      
      const availableDevices = await getMediaDevices();
      setDevices(availableDevices);
      
      // Set default devices
      const videoDevices = availableDevices.filter(d => d.kind === 'videoinput');
      const audioDevices = availableDevices.filter(d => d.kind === 'audioinput');
      const audioOutputDevices = availableDevices.filter(d => d.kind === 'audiooutput');
      
      if (videoDevices.length > 0) setSelectedCamera(videoDevices[0].deviceId);
      if (audioDevices.length > 0) setSelectedMicrophone(audioDevices[0].deviceId);
      if (audioOutputDevices.length > 0) setSelectedSpeaker(audioOutputDevices[0].deviceId);
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Camera and microphone access is required to join the studio.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchCamera = async (deviceId: string): Promise<void> => {
    if (!stream) return;
    
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: { deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined }
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      stream.removeTrack(videoTrack);
      stream.addTrack(newVideoTrack);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setSelectedCamera(deviceId);
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const toggleCamera = (): void => {
    if (previewStream) {
      const videoTrack = previewStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMicrophone = (): void => {
    if (previewStream) {
      const audioTrack = previewStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const cameraDevices = devices.filter(d => d.kind === 'videoinput');
  const microphoneDevices = devices.filter(d => d.kind === 'audioinput');
  const speakerDevices = devices.filter(d => d.kind === 'audiooutput');

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex gap-8 items-center">
        {/* Left Panel */}
        <div className="flex-1 max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">
              You're about to join {studioName}
            </h1>
            <h2 className="text-3xl font-bold">
              Let's check your cam and mic
            </h2>
          </div>

          {/* Host Info */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">{hostName}</span>
              <span className="text-gray-400 text-sm">Host</span>
            </div>
          </div>

          {/* Headphones Selection */}
          <div className="mb-6">
            <div className="flex gap-3">
              <button
                onClick={() => setIsUsingHeadphones(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  !isUsingHeadphones
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                I am not using headphones
              </button>
              <button
                onClick={() => setIsUsingHeadphones(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  isUsingHeadphones
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                I am using headphones
              </button>
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={hasPermission ? onJoinStudio : requestPermission}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors mb-4"
          >
            {isLoading ? 'Requesting Access...' : hasPermission ? 'Join Studio' : 'Allow Access'}
          </button>

          {/* Producer Link */}
          <div className="text-center text-gray-400">
            <span>You are joining as a host. </span>
            <button className="text-purple-400 hover:text-purple-300 underline">
              Join as a producer
            </button>
          </div>
        </div>

        {/* Right Panel - Camera Preview */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            {/* Video Preview */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video mb-4">
              {hasPermission ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isCameraOn && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <VideoOff className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {/* Quality Indicator */}
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                    720p / 30fps
                  </div>
                  {/* Effects Button */}
                  <button className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 px-3 py-1 rounded flex items-center gap-2 text-sm transition-colors">
                    <Settings className="w-4 h-4" />
                    Effects
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Camera className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">Camera Setup</p>
                  <p className="text-sm">Click "Allow Access" to enable camera</p>
                </div>
              )}
            </div>

            {/* Media Controls */}
            {hasPermission && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <button
                  onClick={toggleMicrophone}
                  className={`p-3 rounded-full transition-colors ${
                    isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full transition-colors ${
                    isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isCameraOn ? <Camera className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>

          {/* Device Selection */}
          {hasPermission && (
            <div className="space-y-3">
              {/* Camera Selection */}
              <div className="relative">
                <button
                  onClick={() => setShowCameraDropdown(!showCameraDropdown)}
                  className="w-full bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5" />
                    <span className="text-sm">
                      {cameraDevices.find(d => d.deviceId === selectedCamera)?.label || 'Select Camera'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showCameraDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg border border-gray-700 z-10">
                    {cameraDevices.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() => {
                          switchCamera(device.deviceId);
                          setShowCameraDropdown(false);
                        }}
                        className="w-full p-3 text-left hover:bg-gray-700 transition-colors text-sm first:rounded-t-lg last:rounded-b-lg"
                      >
                        {device.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Microphone Selection */}
              <div className="relative">
                <button
                  onClick={() => setShowMicDropdown(!showMicDropdown)}
                  className="w-full bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5" />
                    <span className="text-sm">
                      {microphoneDevices.find(d => d.deviceId === selectedMicrophone)?.label || 'Select Microphone'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showMicDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg border border-gray-700 z-10">
                    {microphoneDevices.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() => {
                          setSelectedMicrophone(device.deviceId);
                          setShowMicDropdown(false);
                        }}
                        className="w-full p-3 text-left hover:bg-gray-700 transition-colors text-sm first:rounded-t-lg last:rounded-b-lg"
                      >
                        {device.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Speaker Selection */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeakerDropdown(!showSpeakerDropdown)}
                  className="w-full bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    <span className="text-sm">
                      {speakerDevices.find(d => d.deviceId === selectedSpeaker)?.label || 'Default - Speakers'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showSpeakerDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg border border-gray-700 z-10">
                    {speakerDevices.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() => {
                          setSelectedSpeaker(device.deviceId);
                          setShowSpeakerDropdown(false);
                        }}
                        className="w-full p-3 text-left hover:bg-gray-700 transition-colors text-sm first:rounded-t-lg last:rounded-b-lg"
                      >
                        {device.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraSetup;
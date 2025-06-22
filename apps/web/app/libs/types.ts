// types/media.ts
export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
}

export interface CameraSetupProps {
  onJoinStudio?: () => void;
  hostName?: string;
  studioName?: string;
}

export interface MediaPermissions {
  camera: boolean;
  microphone: boolean;
}

export interface StreamSettings {
  video: {
    deviceId?: string;
    width?: number;
    height?: number;
    frameRate?: number;
  };
  audio: {
    deviceId?: string;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
  };
}

// types/studio.ts
export interface StudioConfig {
  id: string;
  name: string;
  host: {
    id: string;
    name: string;
    avatar?: string;
  };
  settings: {
    maxParticipants: number;
    recordingEnabled: boolean;
    chatEnabled: boolean;
  };
}

export interface Participant {
  id: string;
  name: string;
  role: 'host' | 'producer' | 'guest';
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  joinedAt: Date;
}
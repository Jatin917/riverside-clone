import { toast } from 'react-toastify';
import initSocket  from './clientSocket';
import axios from 'axios';

export function emitWithAck<T = any>(event: string, data: any): Promise<T> {
  const socket = initSocket();

  return new Promise((resolve, reject) => {
    socket.emit(event, data, (response: any) => {
      if (response?.status === 'ok') resolve(response);
      else reject(new Error(response?.message || 'Unknown error'));
    });
  });
}

export const createSessionAndToken = async (slugId: string) => {
    try {
      const response = await emitWithAck('create-session', {slugId});
      if (!response.session?.id) throw new Error('Session creation failed');
      const sessionId = response.session.id;
      const tokenRes = await emitWithAck("create-session-token", {slugId, sessionId });
      const token = tokenRes.token;
      return token;
    } catch (error) {
      console.error('Error creating session and token:', error);
      throw error;
    }
  }
  

export const fetchLivekitToken = async (email: string, token: string) => {
  try {
    const response = await emitWithAck('create-livekit-token', {
      token,
      email,
      isStreamer: 'true',
    });
    if (response.status === 409) {
      toast.warn('Already in another room!');
      return null;
    }
    return {
      livekitToken: response.token as string,
      wsUrl: response.wsUrl as string,
    };
  } catch (error) {
    console.error('Error fetching token:', error);
    throw error;
  }
};

export const leaveRoomApi = async (email: string, sessionToken: string) => {
  try {
    const response = await emitWithAck('leave-session', { email, sessionToken });
    console.log("leave session clien ", response)
    return response;
  } catch (error) {
    console.error('Error in leaveRoomApi:', (error as Error).message);
    return null;
  }
};

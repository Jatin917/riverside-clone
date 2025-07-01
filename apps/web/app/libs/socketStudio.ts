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
      const session = await emitWithAck('create-session', {slugId});
      if (!session?.sessionToken) throw new Error('Session creation failed');
  
      const tokenRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session-token`, {
        slugId,
        sessionId: session.sessionToken,
      });
      const token = tokenRes.data.token;
  
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
    return response&&null;
  } catch (error) {
    console.error('Error in leaveRoomApi:', (error as Error).message);
    return null;
  }
};

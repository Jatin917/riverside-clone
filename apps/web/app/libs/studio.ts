// lib/studio.ts
import { prisma } from "@repo/db";
import axios from "axios";
import { nanoid } from "nanoid";
import { toast } from "react-toastify";

export async function getOrCreateStudioByEmail(email: string) {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) throw new Error("User not found");

  let studio = await prisma.studio.findFirst({
    where: { ownerId: user.id },
  });

  if (!studio) {
    const parsedName = user.name.trim().toLowerCase().replace(/\s+/g, '-');
    const slugId = `${parsedName}-${nanoid(6)}`;

    studio = await prisma.studio.create({
      data: {
        name: user.name,
        ownerId: user.id,
        slugId: slugId,
      },
    });
  }

  return studio;
}

export const createSessionAndToken = async (slugId: string) => {
  try {
    const sessionRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session`, {
      slugId,
    });

    const session = sessionRes.data.session;
    if (!session?.id) throw new Error('Session creation failed');

    const tokenRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session-token`, {
      slugId,
      sessionId: session.id,
    });
    console.log("tokenRes in createSessionAndToken is ", tokenRes.data);
    const token = tokenRes.data.token;

    return token;
  } catch (error) {
    console.error('Error creating session and token:', error);
    throw error;
  }
}

export const fetchLivekitToken = async (email: string, token: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/livekit-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        token,
        isStreamer: true,
      }),
    });
    if(response.status===409){
        toast.warn("Already in another room!!!");
        return null;
    }
    if (!response.ok) throw new Error('Failed to get access token');

    const data = await response.json();
    console.log("data in fetchLivekitToken is ", data);
    return {livekitToken: data.token, wsUrl: data.wsUrl};
  } catch (error) {
    console.error('Error fetching token:', error);  
    throw error;
  }
}

export const fetchRoomToken = async (email: string, token: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/room-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        token,
        isStreamer: 'true',
      })  
    });

    if (!response.ok) throw new Error('Failed to get room token');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching room token:', error);
    throw error;
  }
}

export const fetchOngoingSession = async (slugId: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ongoing-session?slugId=${slugId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ongoing session:', error);
    throw error;
  }
}

export const leaveRoomApi = async (email:string, sessionToken:string)=>{
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/leave-session`, {email, sessionToken});
    if(!response){
      return null;
    }
    return response.data;
  } catch (error) {
    console.log("error in leaving room in client side ", (error as Error).message);
    return;
  }
}

export const inLiveParticipants = async (email:string, roomToken:string) =>{
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/add-to-liveParticipant`, {email, roomToken});
    if(!response) return null;
    return response.data;
  } catch (error) {
    console.log("error in leaving room in client side ", (error as Error).message);
    return;
  }
}
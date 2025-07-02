// ✅ lib/server/studio.ts (runs only on server, safe to use Prisma and Axios)
'use server';

import { prisma } from '@repo/db';
import axios from 'axios';
import { nanoid } from 'nanoid';

export async function getOrCreateStudioByEmail(email: string) {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) throw new Error('User not found');

  let studio = await prisma.studio.findFirst({ where: { ownerId: user.id } });
  if (!studio) {
    const parsedName = user.name.trim().toLowerCase().replace(/\s+/g, '-');
    const slugId = `${parsedName}-${nanoid(6)}`;

    studio = await prisma.studio.create({
      data: {
        name: user.name,
        ownerId: user.id,
        slugId,
      },
    });
  }

  return studio;
}

export const fetchRoomToken = async (email: string, token: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/room-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, isStreamer: 'true' })
  });
  if (!response.ok) throw new Error('Failed to get room token');
  return await response.json();
};

export const fetchOngoingSession = async (slugId: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ongoing-session?slugId=${slugId}`);
  return await response.json();
};

export const inLiveParticipants = async (email: string, roomToken: string) => {
  const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/add-to-liveParticipant`, { email, roomToken });
  return response.data;
};
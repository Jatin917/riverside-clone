// lib/socket.ts
'use client'
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export default function initSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ['websocket'],
    });
  }
  return socket;
}

import { io, Socket } from 'socket.io-client';
import { API_URL } from './config';
import type { UbicacionPayload } from './types';

let socket: Socket | null = null;

/** Devuelve la instancia singleton del socket, creandola si hace falta. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

/** Emite la ubicacion actual del repartidor al backend. */
export function enviarUbicacion(payload: UbicacionPayload) {
  getSocket().emit('enviar_ubicacion', payload);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

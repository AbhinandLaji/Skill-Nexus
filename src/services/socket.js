import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
let socket = null;

export function getSocket() {
  const token = localStorage.getItem('auth_token');

  if (!socket) {
    socket = io(BACKEND_URL, {
      autoConnect: false,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  } else if (socket.auth?.token !== token) {
    socket.auth = { token };
    if (socket.connected) {
      socket.disconnect();
    }
  }

  if (token && !socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocket;

import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
let socket;

export function getRealtimeSocket() {
  const token = localStorage.getItem('auth_token');

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
  } else if (socket.auth?.token !== token) {
    socket.auth = { token };
    if (socket.connected) socket.disconnect();
  }

  if (!socket.connected) socket.connect();
  return socket;
}

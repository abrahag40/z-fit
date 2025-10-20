import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/realtime', {
  transports: ['websocket'], // fuerza el modo WS puro
});

socket.on('connect', () => {
  console.log('🟢 Cliente Socket.IO conectado:', socket.id);
});

socket.on('checkin_event', (data) => {
  console.log('📡 Evento recibido:', data);
});

socket.on('disconnect', () => {
  console.log('🔴 Cliente desconectado');
});

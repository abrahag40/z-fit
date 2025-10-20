import { io } from 'socket.io-client';

// ✅ Conexión directa a tu namespace
const socket = io('http://localhost:3000/realtime', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log(`✅ Conectado al servidor con id: ${socket.id}`);

  // 1️⃣ Enviamos ping para validar conexión bidireccional
  console.log('📤 Enviando ping...');
  socket.emit('ping', { test: 'pong-check' });
});

// 2️⃣ Esperamos respuesta del servidor
socket.on('pong', (data) => {
  console.log('📨 Respuesta PONG:', data);
});

// 3️⃣ Escuchamos los eventos de checkin en tiempo real
socket.on('checkin_event', (payload) => {
  console.log('📡 Nuevo evento checkin_event recibido:');
  console.log(payload);
});

// 4️⃣ Logs de conexión / error / desconexión
socket.on('disconnect', (reason) => {
  console.warn('🔴 Desconectado:', reason);
});

socket.on('connect_error', (err) => {
  console.error('❌ Error de conexión:', err.message);
});

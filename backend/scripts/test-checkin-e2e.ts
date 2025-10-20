import axios from 'axios';
import { io } from 'socket.io-client';
import { randomUUID } from 'crypto';

const API_URL = 'http://localhost:3000';
const WS_URL = `${API_URL}/realtime`;

const VALID_USER_ID = 'cmgv9djvi00000ds8n8bw3ner'; // Con membresía activa
const INVALID_USER_ID = randomUUID(); // Random UUID sin membresía

const checkinPayload = (userId: string, notes: string) => ({
  userId,
  notes,
});

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function main() {
  console.log('🚀 Iniciando prueba E2E de Check-in + Realtime (con Auth)...');

  // 1️⃣ Login para obtener token JWT
  console.log('🔐 Autenticando usuario admin...');
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@zahardev.com', // 👈 usa tus credenciales reales del seed
    password: 'Admin123!',       // 👈 o la que esté definida en tu base
  });
  console.log('🧩 Respuesta completa del login:', loginRes.data);


  const token = loginRes.data.accessToken;
  console.log('✅ Login exitoso. Token obtenido.');

  const axiosAuth = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  // 2️⃣ Conexión WebSocket
  const socket = io(WS_URL, { transports: ['websocket'] });
  const receivedEvents: any[] = [];

  socket.on('connect', () => console.log(`✅ WS conectado (${socket.id})`));
  socket.on('checkin_event', (payload) => {
    console.log('📡 Evento recibido:', payload);
    receivedEvents.push(payload);
  });
  socket.on('disconnect', (r) => console.warn('🔴 WS desconectado:', r));
  socket.on('connect_error', (e) => console.error('❌ WS connect_error:', e.message));

  await wait(1000);

  // 3️⃣ Check-in válido
  console.log('\n🟢 Enviando check-in válido...');
  const validRes = await axiosAuth.post('/checkin', checkinPayload(VALID_USER_ID, 'Test QA ALLOWED'));
  console.log('✅ Respuesta API (ALLOWED):', validRes.data.status);

  // // 4️⃣ Check-in inválido
  // console.log('\n🔴 Enviando check-in inválido...');
  // try {
  //   await axiosAuth.post('/checkin', checkinPayload(INVALID_USER_ID, 'Test QA DENIED'));
  // } catch (err: any) {
  //   console.log('⚠️ Respuesta esperada (DENIED):', err.response?.status, err.response?.data?.message);
  // }

  // // 5️⃣ Esperar recepción WS
  // console.log('\n⏳ Esperando recepción de eventos...');
  // await wait(3000);

  // console.table(receivedEvents.map(e => ({
  //   status: e.status,
  //   userId: e.userId,
  //   membershipId: e.membershipId,
  //   timestamp: e.timestamp,
  // })));

  // if (receivedEvents.some(e => e.status === 'ALLOWED') && receivedEvents.some(e => e.status === 'DENIED')) {
  //   console.log('✅ PRUEBA E2E EXITOSA: ambos eventos recibidos correctamente.');
  // } else {
  //   console.error('❌ No se recibieron todos los eventos esperados.');
  // }

  // socket.disconnect();
  // process.exit(0);
}

main().catch((err) => {
  console.error('💥 Error en test E2E:', err);
  process.exit(1);
});

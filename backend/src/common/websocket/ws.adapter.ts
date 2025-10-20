import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { ServerOptions } from 'socket.io';

/**
 * Adaptador personalizado para Socket.IO con logs de depuración.
 * 
 * Permite monitorear la inicialización del servidor WebSocket,
 * namespaces activos y errores comunes durante el desarrollo.
 */
export class DebugSocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger('DebugSocketIoAdapter');

  constructor(private app: INestApplicationContext) {
    super(app);
  }

  /**
   * Crea el servidor Socket.IO con configuración personalizada.
   * Se ejecuta automáticamente al inicializar NestJS.
   */
  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      cors: {
        origin: '*', // Permite pruebas locales (para dashboard o scripts QA)
        methods: ['GET', 'POST'],
      },
      ...options,
    });

    // Logs informativos
    this.logger.log(`🧩 Socket.IO server creado en puerto ${port}`);
    this.logger.log('🔍 Namespaces iniciales:');
    Object.keys(server._nsps || {}).forEach((ns) => this.logger.log(`- ${ns}`));

    // Captura de errores globales
    server.on('connection_error', (err) => {
      this.logger.error(`❌ Error de conexión WebSocket: ${err.message}`);
    });

    return server;
  }
}

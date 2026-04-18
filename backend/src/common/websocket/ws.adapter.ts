import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { Server, ServerOptions } from 'socket.io';

/**
 * Adaptador Socket.IO con logs de depuración y CORS controlado.
 *
 * Se delega la whitelist desde configuration() para mantener un
 * único origen de verdad para HTTP y WebSocket.
 */
export class DebugSocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger('DebugSocketIoAdapter');

  constructor(
    app: INestApplicationContext,
    private readonly corsOrigins: string[],
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const allowWildcard = this.corsOrigins.includes('*');

    const server: Server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: allowWildcard ? true : this.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: !allowWildcard,
      },
    }) as Server;

    this.logger.log(`🧩 Socket.IO server creado en puerto ${port}`);
    this.logger.log(
      `🔐 CORS WS: ${allowWildcard ? '*' : this.corsOrigins.join(', ')}`,
    );

    server.on('connection_error', (err: Error) => {
      this.logger.error(`❌ Error de conexión WebSocket: ${err.message}`);
    });

    return server;
  }
}

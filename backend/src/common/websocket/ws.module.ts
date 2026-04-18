import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { WsGateway } from './ws.gateway';

/**
 * WsModule expone el gateway y trae su propio JwtModule configurado
 * desde ConfigService para verificar tokens en el middleware de
 * Socket.IO. No reutilizamos AuthModule para evitar dependencias
 * circulares (AuthModule consume UsersModule, que podría crecer).
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: cfg.get<number>('JWT_EXPIRES_IN') ?? 3600,
        },
      }),
    }),
  ],
  providers: [WsGateway],
  exports: [WsGateway],
})
export class WsModule {}

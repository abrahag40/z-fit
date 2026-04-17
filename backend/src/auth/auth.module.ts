import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * AuthModule
 *  - Exporta AuthService y JwtStrategy.
 *  - El `ThrottlerGuard` se registra en AppModule (scope global)
 *    para poder cubrir también rutas fuera de /auth si queremos,
 *    y aplicamos @Throttle() local en AuthController para subir
 *    la dureza sólo allí.
 */
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const secret = cfg.get<string>('JWT_SECRET');
        const expiresInValue = cfg.get<number>('JWT_EXPIRES_IN') ?? 3600;
        if (!secret) throw new Error('❌ JWT_SECRET no definido');
        return {
          secret,
          signOptions: { expiresIn: expiresInValue },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}

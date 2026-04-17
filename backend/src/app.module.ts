import { APP_GUARD } from '@nestjs/core';
import { AppLoggerModule } from './common/logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { CheckinModule } from './checkin/checkin.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { MembershipsModule } from './memberships/memberships.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RolesGuard } from './auth/roles.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './users/users.module';
import { validationSchema } from './config/validation';
import { WsModule } from './common/websocket/ws.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      expandVariables: true,
    }),

    /**
     * ThrottlerModule global:
     *  - Bucket por IP, default "laxo" (60 req / min) pensado para
     *    APIs autenticadas.
     *  - AuthController lo sobreescribe con @Throttle() mucho más
     *    estricto para /auth/login y /auth/register.
     *
     *  Nota operativa: cuando haya reverse proxy hay que activar
     *  `app.set('trust proxy', 1)` para que la IP real llegue aquí.
     */
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => [
        {
          name: 'default',
          ttl: 60_000,
          limit: 60,
        },
        {
          name: 'auth',
          ttl: (cfg.get<number>('AUTH_THROTTLE_TTL') ?? 60) * 1000,
          limit: cfg.get<number>('AUTH_THROTTLE_LIMIT') ?? 10,
        },
      ],
    }),

    AppLoggerModule,
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    MembershipsModule,
    CheckinModule,
    WsModule,
    DashboardModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    // Orden de ejecución: Throttler → JWT → Roles.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

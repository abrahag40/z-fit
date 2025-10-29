import { APP_GUARD } from '@nestjs/core';
import { AppLoggerModule } from './common/logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { CheckinModule } from './checkin/checkin.module';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { MembershipsModule } from './memberships/memberships.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RolesGuard } from './auth/roles.guard';
import { ScheduleModule } from '@nestjs/schedule';
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
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

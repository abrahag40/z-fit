import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { singleLine: true, translateTime: true } }
          : undefined,
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
  ],
})
export class AppLoggerModule {}

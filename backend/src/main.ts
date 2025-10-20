import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import configuration from './config/configuration';
import { DebugSocketIoAdapter } from './common/websocket/ws.adapter';

async function bootstrap() {
  // ---------------------------------------------------------
  // 🧩 Inicialización de la aplicación NestJS
  // ---------------------------------------------------------
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
  });

  // ---------------------------------------------------------
  // ⚙️ Logger y adaptador WebSocket
  // ---------------------------------------------------------
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useWebSocketAdapter(new DebugSocketIoAdapter(app)); // ✅ integra Socket.IO con Nest

  // ---------------------------------------------------------
  // 🛡️ Seguridad y CORS
  // ---------------------------------------------------------
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false,
    }),
  );

  const config = configuration();
  app.enableCors({
    origin: config.cors.origin ?? '*',
    credentials: true,
  });

  // ---------------------------------------------------------
  // ✅ Validación global (class-validator)
  // ---------------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ---------------------------------------------------------
  // 📚 Swagger API Docs
  // ---------------------------------------------------------
  const swaggerCfg = new DocumentBuilder()
    .setTitle(config.swagger.title)
    .setDescription(config.swagger.description)
    .setVersion(config.swagger.version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerCfg);
  SwaggerModule.setup(config.swagger.path, app, document);

  // ---------------------------------------------------------
  // 🚀 Servidor HTTP + WebSocket en un solo puerto
  // ---------------------------------------------------------
  const port = config.port || 3000;
  await app.listen(port);

  logger.log(`🚀 API + Socket.IO corriendo en http://localhost:${port}`);
  logger.log(`📚 Swagger disponible en http://localhost:${port}${config.swagger.path}`);
}

bootstrap();

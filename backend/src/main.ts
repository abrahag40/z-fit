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
  // 🧩 Inicialización
  //  - `cors: false` porque lo configuramos manualmente con whitelist.
  //  - `bufferLogs: true` para que Pino capture los logs de arranque.
  // ---------------------------------------------------------
  const app = await NestFactory.create(AppModule, {
    cors: false,
    bufferLogs: true,
  });

  const config = configuration();

  // ---------------------------------------------------------
  // ⚙️ Logger + adaptador WebSocket
  // ---------------------------------------------------------
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useWebSocketAdapter(new DebugSocketIoAdapter(app, config.cors.origin));

  // ---------------------------------------------------------
  // 🛡️ Helmet (security headers)
  //  - En producción habilitamos CSP con política mínima sana.
  //  - En dev la relajamos para no bloquear Swagger UI.
  //  - `crossOriginResourcePolicy: 'same-site'` evita que otros
  //    orígenes embeban respuestas sensibles.
  // ---------------------------------------------------------
  const isProd = config.nodeEnv === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              baseUri: ["'self'"],
              objectSrc: ["'none'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:'],
              connectSrc: ["'self'"],
              frameAncestors: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  // ---------------------------------------------------------
  // 🌐 CORS whitelist
  //  - `origin` acepta lista explícita; si viene '*' (solo dev)
  //    lo traducimos a función permisiva pero sin credentials,
  //    porque origin:'*' + credentials:true viola la spec.
  // ---------------------------------------------------------
  const allowWildcard = config.cors.origin.includes('*');
  app.enableCors({
    origin: allowWildcard
      ? true // refleja cualquier origin; credentials se desactiva abajo
      : config.cors.origin,
    credentials: !allowWildcard,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
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
  // 📚 Swagger
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
  // 🚀 HTTP + WebSocket en un solo puerto
  // ---------------------------------------------------------
  const port = config.port || 3000;
  await app.listen(port);

  logger.log(`🚀 API + Socket.IO corriendo en http://localhost:${port}`);
  logger.log(
    `📚 Swagger disponible en http://localhost:${port}${config.swagger.path}`,
  );
  logger.log(
    `🌐 CORS origins permitidos: ${allowWildcard ? '*' : config.cors.origin.join(', ')}`,
  );
}

void bootstrap();

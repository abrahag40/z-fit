import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import configuration from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(app.get(Logger));  // donde Logger viene de nestjs-pino

  const config = configuration();

  // Seguridad
  app.use(helmet());

  // CORS
  const origins = config.cors.origin;
  app.enableCors({ origin: origins, credentials: true });

  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger
  const swaggerCfg = new DocumentBuilder()
    .setTitle(config.swagger.title)
    .setDescription(config.swagger.description)
    .setVersion(config.swagger.version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerCfg, {
    // future: include extraModels for DTOs
  });
  SwaggerModule.setup(config.swagger.path, app, document);

  const port = config.port;
  await app.listen(port);
  logger.log(`🚀 API running on http://localhost:${port}`);
  logger.log(`📚 Swagger on http://localhost:${port}${config.swagger.path}`);
}
bootstrap();

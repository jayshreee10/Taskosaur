import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const appConfig = configService.get('app');

  // Set global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://0.0.0.0:3000',
          'http://0.0.0.0:4000',
          'http://127.0.0.1:3000',
          'http://localhost:8080',
        ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Enable ValidationPipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Check if Unix socket should be used
  const useUnixSocket =
    process.env.UNIX_SOCKET === '1' || !!process.env.UNIX_SOCKET_PATH;
  const unixSocketPath =
    process.env.UNIX_SOCKET_PATH ||
    join(__dirname, '..', 'tmp', 'taskosaur-backend.sock');

  // Get port and host from config
  const port = appConfig.port;
  const host = appConfig.host || '0.0.0.0';

  // Serve static files from the docs directory
  app.use('/docs', express.static(join(__dirname, '..', 'docs')));

  // Configure Swagger documentation
  const swaggerConfig = appConfig.swagger;
  const swaggerOptions = new DocumentBuilder()
    .setTitle(swaggerConfig.title)
    .setDescription(swaggerConfig.description)
    .setVersion(swaggerConfig.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer(`http://${host}:${port}`, 'Development server')
    .addServer('https://api.taskosaur.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup(swaggerConfig.path, app, document);

  if (useUnixSocket) {
    // Ensure socket directory exists
    const socketDir = join(unixSocketPath, '..');
    if (!fs.existsSync(socketDir)) {
      fs.mkdirSync(socketDir, { recursive: true });
    }

    // Remove existing socket file if it exists
    if (fs.existsSync(unixSocketPath)) {
      fs.unlinkSync(unixSocketPath);
    }

    await app.listen(unixSocketPath);
    logger.log(`Application is running on Unix socket: ${unixSocketPath}`);
    logger.log(
      `Swagger documentation available via Unix socket at /${swaggerConfig.path}`,
    );
  } else {
    await app.listen(port, host);
    logger.log(`Application is running on: http://${host}:${port}`);
    logger.log(
      `Swagger documentation available at: http://${host}:${port}/${swaggerConfig.path}`,
    );
  }
}
bootstrap();

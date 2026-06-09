import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3000);
  const apiPrefix = config.get<string>('app.apiPrefix', 'api/v1');
  const env = config.get<string>('app.env', 'development');

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({
    origin: env === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,          // Auto-transform types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger docs (only non-production)
  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('PG Management API')
      .setDescription('Production-grade PG Management System REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication')
      .addTag('Users')
      .addTag('Buildings')
      .addTag('Rooms')
      .addTag('Tenants')
      .addTag('Payments')
      .addTag('Complaints')
      .addTag('Notices')
      .addTag('Visitors')
      .addTag('Notifications')
      .addTag('Dashboard')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log(`Swagger docs: http://localhost:${port}/docs`);
  }

  await app.listen(port);
  logger.log(`Application running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`Environment: ${env}`);
}

bootstrap();

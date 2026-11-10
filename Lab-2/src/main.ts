import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { studentConfig } from './config/student.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable global validation pipe for request DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS for testing
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`====================================================`);
  logger.log(`🚀 Lab 2 NestJS Application running on http://localhost:${port}`);
  logger.log(`🎓 Student: ${studentConfig.lastName} ${studentConfig.initials} | Group: ${studentConfig.group}`);
  logger.log(`🔢 Variant: ${studentConfig.variant} | JWT Expiry: 60 + ${studentConfig.variant} = ${studentConfig.getExpiresInSeconds()}s`);
  logger.log(`====================================================`);
}

await bootstrap();

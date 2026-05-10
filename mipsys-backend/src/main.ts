import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strip properti yang tidak ada di DTO
      forbidNonWhitelisted: true, // Tolak request yang mengandung properti asing
      transform: true,            // Auto-transform string → number, dll
    }),
  );

  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logger } from './shared/logger/winston.config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // to enable request validation globally
  app.useGlobalPipes(new ValidationPipe());

  await app.startAllMicroservices();
  await app.listen(8080);
  console.log(`Application is running on: ${await app.getUrl()}`);

  // logging
  app.useLogger(logger);
}
bootstrap();

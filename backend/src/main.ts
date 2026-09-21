import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow the frontend (localhost:3000) to call this API later.
  app.enableCors({
    origin: 'http://localhost:3000',
  });

  // await app.listen(process.env.PORT ?? 5000);
  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
}
bootstrap();

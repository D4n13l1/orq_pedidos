import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Orquestrador de Pedidos')
    .setDescription('Orquestrador de Pedidos com webhook e filas')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      tagsSorter: 'alpha',
    },
  });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Documentação rodando em http://localhost:${port}/api`);
}
void bootstrap();

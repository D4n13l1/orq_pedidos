import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import * as pactum from 'pactum';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';
import { OrderStatus } from 'generated/prisma/enums';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(0);
    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();
    pactum.request.setBaseUrl(await app.getUrl());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Orders', () => {
    const orderDto: CreateOrderDto = {
      order_id: 'ext-123',
      customer: { email: 'user@example.com', name: 'Ana' },
      items: [{ sku: 'ABC123', qty: 2, unit_price: 59.9 }],
      currency: 'USD',
    };

    it('should create an order', async () => {
      await pactum
        .spec()
        .post('/webhooks/orders')
        .withJson(orderDto)
        .expectStatus(201);
    });

    describe('GET /orders with pagination, GET /orders/:id and DELETE /:id', () => {
      beforeEach(async () => {
        await prisma.cleanDatabase();

        await prisma.orders.create({
          data: {
            order_id: 'order-001',
            currency: 'BRL',
            idempotency_key: 'idem-001',
            status: OrderStatus.RECEIVED,
            customer: { email: 'one@example.com', name: 'One' },
            items: {
              create: [{ sku: 'SKU-001', qty: 1, unit_price: 10 }],
            },
          },
        });

        await prisma.orders.create({
          data: {
            order_id: 'order-002',
            currency: 'BRL',
            idempotency_key: 'idem-002',
            status: OrderStatus.RECEIVED,
            customer: { email: 'two@example.com', name: 'Two' },
            items: {
              create: [{ sku: 'SKU-002', qty: 2, unit_price: 20 }],
            },
          },
        });

        await prisma.orders.create({
          data: {
            order_id: 'order-003',
            currency: 'BRL',
            idempotency_key: 'idem-003',
            status: OrderStatus.RECEIVED,
            customer: { email: 'three@example.com', name: 'Three' },
            items: {
              create: [{ sku: 'SKU-003', qty: 3, unit_price: 30 }],
            },
          },
        });
      });

      it('should list orders with pagination', async () => {
        await pactum
          .spec()
          .get('/orders')
          .withQueryParams('take', '2')
          .withQueryParams('skip', '1')
          .expectStatus(200)
          .expectJsonLength(2);
      });

      it('should get one order by id', async () => {
        await pactum
          .spec()
          .get('/orders/order-002')
          .expectStatus(200)
          .expectJsonLike({
            order_id: 'order-002',
            currency: 'BRL',
          });
      });

      it('should delete one order by id', async () => {
        await pactum.spec().delete('/order-003').expectStatus(200);

        await pactum.spec().get('/orders/order-003').expectStatus(404);
      });
    });
  });
});

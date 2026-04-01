import { Job, Queue } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { ProcessorOrder } from './processor-order';

describe('ProcessorOrder', () => {
  let processor: ProcessorOrder;
  let prismaMock: {
    orders: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let queueMock: {
    add: jest.Mock;
  };

  const payload: CreateOrderDto = {
    order_id: 'ext-123',
    customer: { email: 'user@example.com', name: 'Ana' },
    items: [{ sku: 'ABC123', qty: 2, unit_price: 59.9 }],
    currency: 'USD',
  };

  beforeEach(() => {
    prismaMock = {
      orders: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    queueMock = {
      add: jest.fn(),
    };

    processor = new ProcessorOrder(
      prismaMock as unknown as PrismaService,
      queueMock as unknown as Queue,
    );
  });

  it('should create order and enqueue enrichment when order is new', async () => {
    prismaMock.orders.findUnique.mockResolvedValue(null);
    prismaMock.orders.create.mockResolvedValue({ order_id: 'ext-123' });

    const job = {
      data: payload,
    } as unknown as Job<CreateOrderDto>;

    await processor.processOrder(job);

    expect(prismaMock.orders.findUnique).toHaveBeenCalled();
    expect(prismaMock.orders.create).toHaveBeenCalled();
    expect(queueMock.add).toHaveBeenCalledWith('process-enrichment', 'ext-123');
  });

  it('should skip creation when idempotency key already exists', async () => {
    prismaMock.orders.findUnique.mockResolvedValue({ order_id: 'existing' });

    const job = {
      data: payload,
    } as unknown as Job<CreateOrderDto>;

    await processor.processOrder(job);

    expect(prismaMock.orders.create).not.toHaveBeenCalled();
    expect(queueMock.add).not.toHaveBeenCalled();
  });
});

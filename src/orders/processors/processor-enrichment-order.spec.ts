import { Job } from 'bull';
import { OrderStatus } from 'generated/prisma/enums';
import { AppConfigService } from 'src/app-config/app-config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProcessorEnrichmentOrder } from './processor-enrichment-order';

describe('ProcessorEnrichmentOrder', () => {
  let processor: ProcessorEnrichmentOrder;
  let prismaMock: {
    orders: {
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let txMock: {
    items: { update: jest.Mock };
    orders: { update: jest.Mock };
  };

  beforeEach(() => {
    txMock = {
      items: { update: jest.fn() },
      orders: { update: jest.fn() },
    };

    prismaMock = {
      orders: {
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(
        async (callback: (tx: typeof txMock) => Promise<void>) => {
          await callback(txMock);
        },
      ),
    };

    const configMock = {
      awesomeApiUrl: 'https://economia.awesomeapi.com.br/last/{currency}-BRL',
    } as AppConfigService;

    processor = new ProcessorEnrichmentOrder(
      prismaMock as unknown as PrismaService,
      configMock,
    );

    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        USDBRL: {
          bid: '5.0',
        },
      }),
    } as unknown as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw simulated error on first attempts', async () => {
    prismaMock.orders.findUniqueOrThrow.mockResolvedValue({
      order_id: 'ext-123',
      currency: 'USD',
      items: [],
    });

    const job = {
      data: 'ext-123',
      attemptsMade: 1,
    } as unknown as Job<string>;

    await expect(processor.proceessEnrichment(job)).rejects.toThrow(
      'Simulated error for order ext-123 to test retry mechanism',
    );
  });

  it('should enrich prices and update currency to BRL', async () => {
    prismaMock.orders.findUniqueOrThrow.mockResolvedValue({
      order_id: 'ext-123',
      currency: 'USD',
      items: [{ id: 'item-1', unit_price: 10 }],
    });

    const job = {
      data: 'ext-123',
      attemptsMade: 2,
    } as unknown as Job<string>;

    await processor.proceessEnrichment(job);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://economia.awesomeapi.com.br/last/USD-BRL',
    );
    expect(txMock.items.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { unit_price: 50 },
    });
    expect(txMock.orders.update).toHaveBeenCalledWith({
      where: { order_id: 'ext-123' },
      data: { currency: 'BRL' },
    });
  });

  it('should mark order as FAILED_ENRICHMENT on last failed attempt', async () => {
    const job = {
      data: 'ext-123',
      attemptsMade: 3,
      opts: { attempts: 3 },
    } as unknown as Job<string>;

    await processor.onFailed(job, new Error('boom'));

    expect(prismaMock.orders.update).toHaveBeenCalledWith({
      where: { order_id: 'ext-123' },
      data: { status: OrderStatus.FAILED_ENRICHMENT },
    });
  });
});

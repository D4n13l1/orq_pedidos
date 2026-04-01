import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { CreateOrderDto } from '../dto/create-order.dto';
import { createHash } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('order-process')
export class ProcessorOrder {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('enrichment-process')
    private readonly queueEnrich: Queue,
  ) {}
  private readonly logger = new Logger(ProcessorOrder.name);

  @Process('process-order')
  async processOrder(job: Job<CreateOrderDto>) {
    const data = job.data;
    const idempotencyKey = this.genIndepotencyKey(data);
    const existing = await this.prisma.orders.findUnique({
      where: {
        idempotency_key: idempotencyKey,
      },
    });
    if (existing) {
      this.logger.warn(
        `Order with idempotency key ${idempotencyKey} already exists. Skipping creation.`,
      );
      return;
    }
    const order = await this.prisma.orders.create({
      data: {
        order_id: data.order_id,
        customer: { ...data.customer },
        currency: data.currency,
        idempotency_key: idempotencyKey,
        items: {
          create: data.items.map((item) => ({
            sku: item.sku,
            qty: item.qty,
            unit_price: item.unit_price,
          })),
        },
      },
    });
    await this.queueEnrich.add('process-enrichment', order.order_id);
    this.logger.log(
      `Order ${order.order_id} created and added to enrichment queue`,
    );
  }
  private genIndepotencyKey(payload: CreateOrderDto): string {
    const str = JSON.stringify(payload);
    const hash = createHash('sha256').update(str).digest('hex');
    return hash;
  }
}

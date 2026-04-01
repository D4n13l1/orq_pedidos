import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { PrismaService } from '../prisma/prisma.service';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderStatus } from 'generated/prisma/enums';
import { QueueMetrics } from './enum/metric.enum';
import { QueueName } from './enum/queue-name.enum';
import { QueueMetricsResponseDto } from './processors/dto/queue-metrics-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectQueue('order-process')
    private readonly queueOrderProcess: Queue,
    @InjectQueue('enrichment-process')
    private readonly queueEnrichProcess: Queue,
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(OrdersService.name);

  async create(data: CreateOrderDto): Promise<void> {
    await this.queueOrderProcess.add('process-order', data);
    this.logger.log(`Order ${data.order_id} added to processing queue`);
  }

  async findAll(
    take: number = 10,
    skip: number = 0,
    filter?: string,
  ): Promise<OrderResponseDto[]> {
    return this.prisma.orders
      .findMany({
        where: filter ? { status: filter as OrderStatus } : {},
        take,
        skip,
        include: { items: true },
      })
      .then((orders) => orders.map((order) => new OrderResponseDto(order)));
  }

  async findOne(id: string): Promise<OrderResponseDto> {
    try {
      const order = await this.prisma.orders.findUniqueOrThrow({
        where: {
          order_id: id,
        },
        include: {
          items: true,
        },
      });
      return new OrderResponseDto(order);
    } catch (error: unknown) {
      if (this.isPrismaNotFoundError(error)) {
        throw new NotFoundException(`Order ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.orders.delete({
        where: {
          order_id: id,
        },
      });
    } catch (error: unknown) {
      if (this.isPrismaNotFoundError(error)) {
        throw new NotFoundException(`Order ${id} not found`);
      }
      throw error;
    }
  }

  private isPrismaNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    );
  }

  async getQueueMetrics(
    queue: QueueName,
    take: number = 100,
    filter: QueueMetrics,
  ): Promise<QueueMetricsResponseDto[]> {
    let newQueue: Queue;
    if (queue === QueueName.ORDER_PROCESS) {
      newQueue = this.queueOrderProcess;
    } else if (queue === QueueName.ENRICHMENT_PROCESS) {
      newQueue = this.queueEnrichProcess;
    } else {
      throw new Error(`Invalid queue name`);
    }

    switch (filter) {
      case QueueMetrics.ACTIVE:
        return (await newQueue.getActive())
          .slice(0, take)
          .map((job) => new QueueMetricsResponseDto(job));
      case QueueMetrics.WAITING:
        return (await newQueue.getWaiting())
          .slice(0, take)
          .map((job) => new QueueMetricsResponseDto(job));
      case QueueMetrics.COMPLETED:
        return (await newQueue.getCompleted())
          .slice(0, take)
          .map((job) => new QueueMetricsResponseDto(job));
      case QueueMetrics.FAILED:
        return (await newQueue.getFailed())
          .slice(0, take)
          .map((job) => new QueueMetricsResponseDto(job));
    }
  }
}

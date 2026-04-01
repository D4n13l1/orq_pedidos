import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { OrderStatus } from 'generated/prisma/enums';
import { OrderResponseDto } from './dto/order-response.dto';
import { QueueMetrics } from './enum/metric.enum';
import { QueueName } from './enum/queue-name.enum';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOkResponse({ description: 'Order created successfully' })
  @ApiBody({ type: CreateOrderDto })
  @ApiOperation({ summary: 'Create a new order via webhook' })
  @Post('webhooks/orders')
  create(@Body() createOrderDto: CreateOrderDto): Promise<void> {
    return this.ordersService.create(createOrderDto);
  }

  @ApiOperation({
    summary: 'Get all orders with optional pagination and status filter',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filter orders by status',
    enum: OrderStatus,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of records to return',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Number of records to skip',
  })
  @Get('orders')
  findAll(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('filter') filter?: OrderStatus,
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.findAll(
      take ? parseInt(take) : undefined,
      skip ? parseInt(skip) : undefined,
      filter,
    );
  }

  @ApiOperation({ summary: 'Get a single order by ID' })
  @Get('orders/:id')
  findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.findOne(id);
  }

  @ApiOperation({ summary: 'Delete an order by ID' })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.ordersService.remove(id);
  }

  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filter metrics by type',
    enum: QueueMetrics,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of records to return',
  })
  @ApiQuery({
    name: 'queue',
    required: true,
    description: 'Name of the queue to get metrics for',
    enum: QueueName,
  })
  @ApiOperation({ summary: 'Get metrics about the order processing queue' })
  @Get('queue/metrics')
  getQueueMetrics(
    @Query('queue') queue: QueueName,
    @Query('filter') filter: QueueMetrics,
    @Query('take') take?: string,
  ) {
    return this.ordersService.getQueueMetrics(
      queue,
      take ? parseInt(take) : undefined,
      filter,
    );
  }
}

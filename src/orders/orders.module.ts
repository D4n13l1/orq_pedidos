import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { BullModule } from '@nestjs/bull';
import { ProcessorOrder } from './processors/processor-order';
import { ProcessorEnrichmentOrder } from './processors/processor-enrichment-order';
import { AppConfigModule } from 'src/app-config/app-config.module';

@Module({
  imports: [
    AppConfigModule,
    BullModule.registerQueue(
      {
        name: 'order-process',
      },
      {
        name: 'enrichment-process',
      },
    ),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, ProcessorOrder, ProcessorEnrichmentOrder],
})
export class OrdersModule {}

import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { PrismaService } from 'src/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { OrderStatus } from 'generated/prisma/enums';
import { AppConfigService } from 'src/app-config/app-config.service';

interface CoinBRLApiResponse {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}
type AwesomeApiResponse = {
  [key: string]: CoinBRLApiResponse;
};
@Processor('enrichment-process')
export class ProcessorEnrichmentOrder {
  private awesomeApiUrl: string;
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {
    this.awesomeApiUrl = config.awesomeApiUrl;
  }
  private readonly logger = new Logger(ProcessorEnrichmentOrder.name);

  @Process('process-enrichment')
  async proceessEnrichment(job: Job<string>) {
    const orderId = job.data;
    this.logger.log(
      `Starting enrichment for order ${orderId} on attempt ${job.attemptsMade}`,
    );
    const order = await this.prisma.orders.findUniqueOrThrow({
      where: {
        order_id: orderId,
      },
      include: {
        items: true,
      },
    });
    if (job.attemptsMade <= 1) {
      this.logger.warn(
        `Simulating error form process enrichment for order ${orderId} on attempt ${job.attemptsMade}`,
      );
      throw new Error(
        `Simulated error for order ${orderId} to test retry mechanism`,
      );
    }

    if (order.currency.toUpperCase() !== 'BRL') {
      const modifiedUrl: string = this.awesomeApiUrl.replace(
        '{currency}',
        order.currency.toUpperCase(),
      );
      let dataAwesomeApi: AwesomeApiResponse | null = null;

      try {
        const response = await fetch(modifiedUrl);
        const jsonData: unknown = await response.json();
        if (jsonData && typeof jsonData === 'object') {
          dataAwesomeApi = jsonData as AwesomeApiResponse;
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Error fetching exchange rate for ${order.currency}-BRL: ${errorMessage}`,
        );
      }

      if (!dataAwesomeApi) {
        return;
      }

      this.logger.log(
        `Fetched exchange rate data for ${order.currency}-BRL: ${JSON.stringify(dataAwesomeApi)}`,
      );

      const firstKey = Object.keys(dataAwesomeApi)[0];
      const currency: CoinBRLApiResponse = dataAwesomeApi[firstKey];
      if (dataAwesomeApi) {
        const exchangeRate = parseFloat(currency.bid);
        await this.prisma.$transaction(async (tx) => {
          await Promise.all(
            order.items.map(async (item) => {
              const newUnitPrice = parseFloat(
                (item.unit_price * exchangeRate).toFixed(1),
              );
              await tx.items.update({
                where: { id: item.id },
                data: { unit_price: newUnitPrice },
              });
            }),
          );
          await tx.orders.update({
            where: {
              order_id: order.order_id,
            },
            data: { currency: 'BRL' },
          });
          this.logger.log(
            `Order ${order.order_id} enriched with exchange rate ${exchangeRate} and updated to BRL`,
          );
        });
      }
    }
  }
  @OnQueueFailed()
  async onFailed(job: Job<string>, err: Error) {
    if (job.attemptsMade >= job.opts.attempts!) {
      await this.prisma.orders.update({
        where: {
          order_id: job.data,
        },
        data: {
          status: OrderStatus.FAILED_ENRICHMENT,
        },
      });
      this.logger.error(
        `Enrichment failed for order ${job.data}: ${err.message}. Marking order as FAILED_ENRICHMENT after ${job.opts.attempts} attempts.`,
      );
    }
  }
}

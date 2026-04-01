import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { AppConfigService } from 'src/app-config/app-config.service';

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly databaseUrl: string;

  constructor(config: AppConfigService) {
    const adapter = new PrismaBetterSqlite3({ url: config.databaseUrl });
    super({ adapter });

    this.databaseUrl = config.databaseUrl;
  }

  async cleanDatabase() {
    await this.items.deleteMany();
    await this.orders.deleteMany();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

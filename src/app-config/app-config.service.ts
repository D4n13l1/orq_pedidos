import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get redisUrl(): string {
    return this.config.getOrThrow<string>('REDIS_URL');
  }

  get databaseUrl(): string {
    return this.config.getOrThrow<string>('DATABASE_URL');
  }

  get redisJobAttempts(): number {
    return this.config.getOrThrow<number>('REDIS_JOB_ATTEMPS');
  }

  get redisJobBackoffDelay(): number {
    return this.config.getOrThrow<number>('REDIS_JOB_BACKOFF_DELAY');
  }

  get awesomeApiUrl(): string {
    return this.config.getOrThrow<string>('AWESOME_API_URL');
  }
}

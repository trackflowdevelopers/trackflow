import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    const redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      connectTimeout: 3000,
      lazyConnect: true,
    });

    try {
      await redis.connect();
      await redis.ping();
      await redis.quit();
      return this.getStatus('redis', true);
    } catch (error) {
      const err = error as Error;
      await redis.quit().catch(() => null);
      throw new HealthCheckError('Redis check failed', this.getStatus('redis', false, { message: err.message }));
    }
  }
}

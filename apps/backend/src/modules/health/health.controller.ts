import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { DatabaseIndicator } from './indicators/database.indicator';
import { RedisIndicator } from './indicators/redis.indicator';
import { MqttIndicator } from './indicators/mqtt.indicator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly databaseIndicator: DatabaseIndicator,
    private readonly redisIndicator: RedisIndicator,
    private readonly mqttIndicator: MqttIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.databaseIndicator.isHealthy(),
      () => this.redisIndicator.isHealthy(),
      () => this.mqttIndicator.isHealthy(),
    ]);
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  isHealthy(): Promise<HealthIndicatorResult> {
    return new Promise((resolve, reject) => {
      const client = mqtt.connect(this.configService.get<string>('MQTT_URL') ?? 'mqtt://localhost:1883', {
        connectTimeout: 3000,
        reconnectPeriod: 0,
      });

      const timeout = setTimeout(() => {
        client.end(true);
        reject(new HealthCheckError('MQTT check failed', this.getStatus('mqtt', false, { message: 'Connection timeout' })));
      }, 3000);

      client.on('connect', () => {
        clearTimeout(timeout);
        client.end();
        resolve(this.getStatus('mqtt', true));
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        client.end(true);
        reject(new HealthCheckError('MQTT check failed', this.getStatus('mqtt', false, { message: error.message })));
      });
    });
  }
}
